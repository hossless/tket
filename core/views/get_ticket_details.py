from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core.utils import release_expired_reservations

# API 6: Get Ticket Details
    # Retrieves exact details for a specific ticket based on its ID,
    # including teams, venues, times, and match-specific facilities.
def get_ticket_details(request, ticket_id):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

    release_expired_reservations()

    with connection.cursor() as cursor:
        sql = """
            SELECT t.sport_type, t.home_team, t.away_team, t.venue_city,
                   t.ticket_date_time, t.price, md.facilities, t.remaining_capacity,
                   t.total_capacity, md.venue_name, t.category, md.tournament_name
            FROM tickets t
            JOIN match_details md ON t.ticket_id = md.ticket_id
            WHERE t.ticket_id = %s;
        """
        cursor.execute(sql, [ticket_id])
        raw_data = cursor.fetchone()

    if not raw_data:
        return JsonResponse({"error": "Ticket not found."}, status=404)

    ticket_dict = {
        "sport_type": raw_data[0],
        "home_team": raw_data[1],
        "away_team": raw_data[2],
        "venue_city": raw_data[3],
        "ticket_date_time": raw_data[4],
        "price": raw_data[5],
        "facilities": raw_data[6],
        "remaining_capacity": raw_data[7],
        "total_capacity": raw_data[8],
        "venue_name": raw_data[9],
        "category": raw_data[10],
        "tournament_name": raw_data[11]
    }

    return JsonResponse({"ticket_info": ticket_dict}, status=200)
