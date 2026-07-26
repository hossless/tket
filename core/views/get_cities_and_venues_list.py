import json
import redis
from django.db import connection
from django.http import JsonResponse

cache = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)

# API 4: Get Cities and Venues List
    # Retrieves a distinct list of all available venues and their corresponding cities 
    # from the tickets and match_details tables for frontend search filtering.
def get_cities_and_venues_list(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

    cached_venues = cache.get("cities_and_venues_list")
    if cached_venues:
        return JsonResponse({
            "source": "Redis", 
            "venues": json.loads(cached_venues)
        }, status=200)

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT md.venue_name, t.venue_city 
            FROM tickets t
            JOIN match_details md ON t.ticket_id = md.ticket_id
            WHERE md.venue_name IS NOT NULL AND t.venue_city IS NOT NULL;
        """)
        raw_data = cursor.fetchall()

    formatted_response = []
    for row in raw_data:
        formatted_response.append({
            "venue_name": row[0],
            "venue_city": row[1]
        })

    cache.set("cities_and_venues_list", json.dumps(formatted_response), ex=86400)

    return JsonResponse({
        "source": "Database", 
        "venues": formatted_response
    }, status=200)