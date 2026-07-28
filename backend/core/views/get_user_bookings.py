from django.db import connection
from django.http import JsonResponse
from backend.core.utils import jwt_required, release_expired_reservations

# API 11: Get User Bookings
    # Retrieves all reservations (including status, quantity, and
    # ticket details) for the authenticated user, with optional filtering.
@jwt_required
def get_user_bookings(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

    release_expired_reservations()

    user_id = request.user_id

    where_clauses = ["r.user_id = %s"]
    values = [user_id]

    status_filter = request.GET.get('status')
    time_filter = request.GET.get('time')

    if status_filter:
        where_clauses.append("r.reservation_status = %s")
        values.append(status_filter)

    if time_filter == 'upcoming':
        where_clauses.append("t.ticket_date_time >= CURRENT_TIMESTAMP")
    elif time_filter == 'past':
        where_clauses.append("t.ticket_date_time < CURRENT_TIMESTAMP")

    where_sql = " AND ".join(where_clauses)

    sql = f"""
        SELECT 
            r.reservation_id, r.quantity, r.reservation_status, r.seat_info,
            t.ticket_id, t.sport_type, t.home_team, t.away_team,
            t.venue_city, t.price, t.ticket_date_time, md.venue_name
        FROM reservations r
        JOIN tickets t ON r.ticket_id = t.ticket_id
        LEFT JOIN match_details md ON t.ticket_id = md.ticket_id
        WHERE {where_sql}
        ORDER BY t.ticket_date_time DESC;
    """

    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, values)
            raw_data = cursor.fetchall()
    except Exception:
        return JsonResponse({"error": "Database error occurred."}, status=500)

    formatted_response = []
    for row in raw_data:
        formatted_response.append({
            "reservation_id": row[0],
            "quantity": row[1],
            "status": row[2],
            "seat_info": row[3],
            "ticket_id": row[4],
            "sport_type": row[5],
            "home_team": row[6],
            "away_team": row[7],
            "venue_city": row[8],
            "price": float(row[9]),
            "ticket_date_time": str(row[10]),
            "venue_name": row[11] if row[11] else "TBD"
        })

    return JsonResponse({"reservations": formatted_response}, status=200)