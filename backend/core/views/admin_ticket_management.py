import json
from django.http import JsonResponse
from django.db import connection, transaction
from django.views.decorators.csrf import csrf_exempt
from core.utils import (
    jwt_required,
    update_es_ticket,
    invalidate_ticket_caches,
    release_expired_reservations
)

# API 10: Admin Ticket & Report Management
    # Allows system administrators/support staff to update reservation statuses
    # (tracking who canceled them) or reply to user support reports.
@csrf_exempt
@jwt_required
def admin_ticket_management(request):
    if request.method != 'PATCH':
        return JsonResponse({"error": "Method not allowed. Use PATCH."}, status=405)

    release_expired_reservations()

    admin_user_id = request.user_id
    user_role = getattr(request, 'user_role', 'Spectator')

    if user_role not in ['Admin', 'Support']:
        return JsonResponse({"error": "Access denied. Admin or Support role required."}, status=403)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    target_type = body.get("target_type")
    raw_target_id = body.get("target_id")

    if not target_type or not raw_target_id:
        return JsonResponse({"error": "Both target_type and target_id are required."}, status=400)

    try:
        target_id = int(raw_target_id)
    except (ValueError, TypeError):
        return JsonResponse({"error": "target_id must be a valid integer."}, status=400)

    if target_type == "reservation":
        status = body.get("status")
        if not status:
            return JsonResponse({"error": "status is required for reservation updates."}, status=400)

        VALID_RES_STATUSES = ["Pending", "Confirmed", "Canceled", "Expired", "Failed"]
        if status not in VALID_RES_STATUSES:
            return JsonResponse({
                "error": f"Invalid reservation status. Allowed values: {', '.join(VALID_RES_STATUSES)}"
            }, status=400)
    
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    sql_get_res = """
                        SELECT reservation_status, quantity, ticket_id 
                        FROM reservations 
                        WHERE reservation_id = %s
                        FOR UPDATE;
                    """
                    cursor.execute(sql_get_res, [target_id])
                    res_row = cursor.fetchone()

                    if not res_row:
                        return JsonResponse({"error": "Reservation not found."}, status=404)

                    old_status, quantity, ticket_id = res_row
                    
                    alive_statuses = ["Pending", "Confirmed"]
                    dead_statuses = ["Canceled", "Expired", "Failed"]
                    new_capacity = None

                    if old_status in dead_statuses and status in alive_statuses:
                        sql_check_cap = "SELECT remaining_capacity FROM tickets WHERE ticket_id = %s FOR UPDATE;"
                        cursor.execute(sql_check_cap, [ticket_id])
                        ticket_row = cursor.fetchone()
                        
                        if not ticket_row:
                            return JsonResponse({"error": "Associated ticket not found."}, status=404)
                            
                        current_cap = ticket_row[0]
                        
                        if current_cap < quantity:
                            return JsonResponse({
                                "error": f"Cannot revive reservation. Only {current_cap} tickets left, but reservation requires {quantity}."
                            }, status=400)
                            
                        sql_deduct = """
                            UPDATE tickets
                            SET remaining_capacity = remaining_capacity - %s
                            WHERE ticket_id = %s
                            RETURNING remaining_capacity;
                        """
                        cursor.execute(sql_deduct, [quantity, ticket_id])
                        new_capacity = cursor.fetchone()[0]

                    elif old_status in alive_statuses and status in dead_statuses:
                        sql_restore = """
                            UPDATE tickets
                            SET remaining_capacity = remaining_capacity + %s
                            WHERE ticket_id = %s
                            RETURNING remaining_capacity;
                        """
                        cursor.execute(sql_restore, [quantity, ticket_id])
                        new_capacity = cursor.fetchone()[0]

                    if status == "Canceled":
                        sql_update_res = """
                            UPDATE reservations
                            SET reservation_status = %s, canceled_by = %s
                            WHERE reservation_id = %s;
                        """
                        cursor.execute(sql_update_res, [status, admin_user_id, target_id])
                    else:
                        sql_update_res = """
                            UPDATE reservations
                            SET reservation_status = %s, canceled_by = NULL
                            WHERE reservation_id = %s;
                        """
                        cursor.execute(sql_update_res, [status, target_id])

            if new_capacity is not None:
                invalidate_ticket_caches()
                update_es_ticket(ticket_id, remaining_capacity=new_capacity)

            response_data = {
                "reservation_id": target_id,
                "status": status,
                "ticket_id": ticket_id
            }
            
            if status == "Canceled":
                response_data["canceled_by"] = admin_user_id

            return JsonResponse({
                "message": "Reservation updated successfully.",
                "reservation": response_data
            }, status=200)
            
        except Exception as e:
            print(f"Admin API Error: {e}")
            return JsonResponse({"error": "Database error occurred during reservation update."}, status=500)

    elif target_type == "report":
        reply = body.get("reply")
        report_status = body.get("status", "Resolved")

        VALID_REP_STATUSES = ["Waiting", "Resolved"]
        if report_status not in VALID_REP_STATUSES:
            return JsonResponse({
                "error": f"Invalid report status. Allowed values: {', '.join(VALID_REP_STATUSES)}"
            }, status=400)

        if not reply:
            return JsonResponse({"error": "reply text is required for report updates."}, status=400)

        try:
            sql_report = """    
                UPDATE reports
                SET reply = %s,
                    report_status = %s
                WHERE report_id = %s
                RETURNING report_id;
            """
            with connection.cursor() as cursor:
                cursor.execute(sql_report, [reply, report_status, target_id])
                report_row = cursor.fetchone()

            if not report_row:
                return JsonResponse({"error": "Report not found."}, status=404)

            return JsonResponse({
                "message": "Report updated successfully.",
                "report": {
                    "report_id": target_id,
                    "status": report_status,
                    "reply": reply
                }
            }, status=200)
        except Exception as e:
             print(f"Admin API Error: {e}")
             return JsonResponse({"error": "Database error occurred during report update."}, status=500)

    else:
        return JsonResponse({"error": "Invalid target_type. Must be 'reservation' or 'report'."}, status=400)