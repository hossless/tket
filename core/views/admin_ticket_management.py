import json
from django.http import JsonResponse
from django.db import connection, transaction
from django.views.decorators.csrf import csrf_exempt
from core.utils import release_expired_reservations

# API 10/14: Admin Ticket & Report Management
    # Allows system administrators/support staff to update reservation statuses
    # (tracking who canceled them) or reply to user support reports.
@csrf_exempt
def admin_ticket_management(request, admin_user_id):
    if request.method != 'PATCH':
        return JsonResponse({"error": "Method not allowed. Use PATCH."}, status=405)

    release_expired_reservations()

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    target_type = body.get("target_type")
    target_id = body.get("target_id")

    if not target_type or not target_id:
        return JsonResponse({"error": "Both target_type and target_id are required."}, status=400)

    sql_admin = """
        SELECT user_id 
        FROM users 
        WHERE user_id = %s 
          AND role IN ('Admin', 'Support');
    """
    with connection.cursor() as cursor:
        cursor.execute(sql_admin, [admin_user_id])
        admin_row = cursor.fetchone()

    if not admin_row:
        return JsonResponse({"error": "Access denied. Admin or Support role required."}, status=403)

    if target_type == "reservation":
        status = body.get("status")
        if not status:
            return JsonResponse({"error": "status is required for reservation updates."}, status=400)

        with transaction.atomic():
            with connection.cursor() as cursor:
                sql_get_res = """
                    SELECT reservation_status, quantity, ticket_id 
                    FROM reservations 
                    WHERE reservation_id = %s;
                """
                cursor.execute(sql_get_res, [target_id])
                res_row = cursor.fetchone()

                if not res_row:
                    return JsonResponse({"error": "Reservation not found."}, status=404)

                old_status, quantity, ticket_id = res_row

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
                        SET reservation_status = %s
                        WHERE reservation_id = %s;
                    """
                    cursor.execute(sql_update_res, [status, target_id])

                if status == "Canceled" and old_status != "Canceled":
                    sql_restore = """
                        UPDATE tickets
                        SET remaining_capacity = remaining_capacity + %s
                        WHERE ticket_id = %s;
                    """
                    cursor.execute(sql_restore, [quantity, ticket_id])

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

    elif target_type == "report":
        reply = body.get("reply")
        report_status = body.get("status", "Answered")

        if not reply:
            return JsonResponse({"error": "reply text is required for report updates."}, status=400)

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

    else:
        return JsonResponse({"error": "Invalid target_type. Must be 'reservation' or 'report'."}, status=400)