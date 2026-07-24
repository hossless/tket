from django.db import connection
from django.http import JsonResponse
from core.utils import jwt_required, release_expired_reservations

# API 11: Get User Bookings
    # Retrieves all reservations (including status, quantity, and
    # ticket details) for the authenticated user.
@jwt_required
def get_user_bookings(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

    release_expired_reservations()

    user_id = request.user_id

    sql = """
        SELECT 
            r.reservation_id, r.quantity, r.reservation_status, r.seat_info,
            t.ticket_id, t.sport_type, t.home_team, t.away_team,
            t.venue_city, t.price, t.ticket_date_time, md.venue_name
        FROM reservations r
        JOIN tickets t ON r.ticket_id = t.ticket_id
        LEFT JOIN match_details md ON t.ticket_id = md.ticket_id
        WHERE r.user_id = %s
        ORDER BY t.ticket_date_time ASC;
    """

    with connection.cursor() as cursor:
        cursor.execute(sql, [user_id])
        raw_data = cursor.fetchall()

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