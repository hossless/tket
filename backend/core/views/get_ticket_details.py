import os
import json
import redis
from django.db import connection
from django.http import JsonResponse
from backend.core.utils import release_expired_reservations

redis_host = os.getenv('REDIS_HOST', '127.0.0.1')
cache = redis.Redis(host=redis_host, port=6379, db=0, decode_responses=True)

# API 6: Get Ticket Details
    # Retrieves exact details for a specific ticket based on its ID,
    # including teams, venues, times, and match-specific facilities.
def get_ticket_details(request, ticket_id):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

    release_expired_reservations()

    try:
        ticket_id = int(ticket_id)
    except ValueError:
        return JsonResponse({"error": "Invalid ticket ID format."}, status=400)

    cache_key = f"ticket_details:{ticket_id}"
    cached_data = cache.get(cache_key)

    if cached_data:
        return JsonResponse({
            "source": "Redis",
            "ticket_info": json.loads(cached_data)
        }, status=200)

    try:
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
    except Exception:
        return JsonResponse({"error": "Database error occurred."}, status=500)

    if not raw_data:
        return JsonResponse({"error": "Ticket not found."}, status=404)

    ticket_dict = {
        "sport_type": raw_data[0],
        "home_team": raw_data[1],
        "away_team": raw_data[2],
        "venue_city": raw_data[3],
        "ticket_date_time": str(raw_data[4]),
        "price": float(raw_data[5]),
        "facilities": raw_data[6],
        "remaining_capacity": raw_data[7],
        "total_capacity": raw_data[8],
        "venue_name": raw_data[9],
        "category": raw_data[10],
        "tournament_name": raw_data[11]
    }

    cache.set(cache_key, json.dumps(ticket_dict), ex=60)

    return JsonResponse({
        "source": "Database",
        "ticket_info": ticket_dict
    }, status=200)