from django.db import connection
from django.http import JsonResponse

# API 4: Get Cities and Venues List
    # Retrieves a distinct list of all available venues and their corresponding cities 
    # from the tickets and match_details tables for frontend search filtering.
def get_cities_and_venues_list(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT md.venue_name, t.venue_city 
            FROM tickets t
            JOIN match_details md ON t.ticket_id = md.ticket_id;
        """)
        raw_data = cursor.fetchall()

    formatted_response = []
    for row in raw_data:
        formatted_response.append({
            "venue_name": row[0],
            "venue_city": row[1]
        })

    return JsonResponse({"venues": formatted_response}, status=200)
