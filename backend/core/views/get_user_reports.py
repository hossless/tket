import json
from core.utils import jwt_required
from django.http import JsonResponse
from django.db import connection, IntegrityError
from django.views.decorators.csrf import csrf_exempt

# Helper api to get user's reports
@csrf_exempt
@jwt_required
def get_user_reports(request):
    user_id = request.user_id

    if request.method == 'GET':
        try:
            with connection.cursor() as cursor:
                sql = """
                    SELECT report_id, reservation_id, report_type, description, report_status, reply
                    FROM reports
                    WHERE user_id = %s
                    ORDER BY report_id DESC;
                """
                cursor.execute(sql, [user_id])
                columns = [col[0] for col in cursor.description]
                reports = [dict(zip(columns, row)) for row in cursor.fetchall()]

            return JsonResponse({"reports": reports}, status=200)

        except Exception:
            return JsonResponse({"error": "Database error occurred."}, status=500)

    if request.method == 'POST':
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        description = str(body.get('description', '')).strip()
        report_type = body.get('report_type')
        raw_reservation_id = body.get('reservation_id')

        if not description or not report_type:
            return JsonResponse({"error": "description and report_type are required."}, status=400)

        if len(description) > 2000:
            return JsonResponse({"error": "Description is too long (max 2000 characters)."}, status=400)

        valid_report_types = ["General", "Technical", "Complaint", "Refund", "Bug", "Other"]
        if report_type not in valid_report_types:
            return JsonResponse({"error": "Invalid report_type."}, status=400)

        reservation_id = None
        if raw_reservation_id not in [None, ""]:
            try:
                reservation_id = int(raw_reservation_id)
            except (ValueError, TypeError):
                return JsonResponse({"error": "reservation_id must be a valid integer."}, status=400)

        try:
            with connection.cursor() as cursor:
                if reservation_id:
                    sql_check = """
                        SELECT 1 FROM reservations 
                        WHERE reservation_id = %s AND user_id = %s;
                    """
                    cursor.execute(sql_check, [reservation_id, user_id])
                    if not cursor.fetchone():
                        return JsonResponse({"error": "Reservation not found or access denied."}, status=403)

                sql_insert = """
                    INSERT INTO reports (user_id, reservation_id, report_type, description, report_status)
                    VALUES (%s, %s, %s, %s, 'Waiting')
                    RETURNING report_id;
                """
                cursor.execute(sql_insert, [user_id, reservation_id, report_type, description])
                report_row = cursor.fetchone()
                report_id = report_row[0]
                
        except IntegrityError:
            return JsonResponse({"error": "Database constraint violation."}, status=400)
        except Exception:
            return JsonResponse({"error": "Database error occurred."}, status=500)
        
        return JsonResponse({"message": "Report submitted successfully.", "report_id": report_id}, status=201)

    return JsonResponse({"error": "Method not allowed. Use GET or POST."}, status=405)