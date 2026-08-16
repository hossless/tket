from django.http import JsonResponse
from django.db import connection
from core.utils import jwt_required, release_expired_reservations

# Helper api to get reports and reservations data for admin's dashboard
@jwt_required
def get_admin_dashboard_data(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

    user_role = getattr(request, 'user_role', 'Spectator')
    if user_role not in ['Admin', 'Support']:
        return JsonResponse({"error": "Access denied."}, status=403)

    release_expired_reservations()

    try:
        with connection.cursor() as cursor:
            sql_reservations = """
                SELECT 
                    r.reservation_id, u.username, t.home_team, t.away_team, 
                    r.quantity, r.reservation_status, r.reserved_at, r.ticket_id
                FROM reservations r
                JOIN users u ON r.user_id = u.user_id
                JOIN tickets t ON r.ticket_id = t.ticket_id
                ORDER BY r.reserved_at DESC;
            """
            cursor.execute(sql_reservations)
            res_columns = [col[0] for col in cursor.description]
            reservations = [dict(zip(res_columns, row)) for row in cursor.fetchall()]

            sql_reports = """
                SELECT 
                    rep.report_id, u.username, rep.reservation_id, rep.report_type, 
                    rep.description, rep.reply, rep.report_status, rep.reported_at
                FROM reports rep
                JOIN users u ON rep.user_id = u.user_id
                ORDER BY 
                    CASE WHEN rep.report_status = 'Waiting' THEN 1 ELSE 2 END,
                    rep.reported_at DESC;
            """
            cursor.execute(sql_reports)
            rep_columns = [col[0] for col in cursor.description]
            reports = [dict(zip(rep_columns, row)) for row in cursor.fetchall()]

        return JsonResponse({
            "reservations": reservations,
            "reports": reports
        }, status=200)

    except Exception:
        return JsonResponse({"error": "Database error occurred."}, status=500)