import json
import redis
from django.db import connection
from django.shortcuts import render
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

# API 6: Get Ticket Details
    # Retrieves exact details for a specific ticket based on its ID,
    # including teams, venues, times, and match-specific facilities.
def get_ticket_details(request, ticket_id):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

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