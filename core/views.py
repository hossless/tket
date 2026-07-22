import re
import json
import redis
from django.db import connection
from django.shortcuts import render
from django.http import JsonResponse
from django.db import IntegrityError
from django.views.decorators.csrf import csrf_exempt
from core.utils import is_valid_email, is_valid_phone, is_valid_username

cache = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)

# API 3: Profile User Update
    # Updates profile details for a given user using dynamic SQL fields
    # and syncs the updated profile directly into the Redis cache.
@csrf_exempt
def update_user_profile(request, user_id):
    if request.method != 'PATCH':
        return JsonResponse({"error": "Method not allowed. Use PATCH."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    allowed_columns = ["first_name", "last_name", "username", "phone_number", "email", "city"]
    set_clauses = []
    values = []

    for key, value in body.items():
        if key in allowed_columns:
            str_value = str(value).strip()
            if str_value == "":
                return JsonResponse({"error": f"Field '{key}' cannot be empty."}, status=400)

            if key == "email" and not is_valid_email(str_value):
                return JsonResponse({"error": "Invalid email format."}, status=400)
            
            if key == "phone_number" and not is_valid_phone(str_value):
                return JsonResponse({"error": "Invalid phone number format."}, status=400)
            
            if key == "username" and not is_valid_username(str_value):
                return JsonResponse({"error": "Invalid username format."}, status=400)

            set_clauses.append(f"{key} = %s")
            
            if key == "phone_number":
                str_value = re.sub(r"[^\d\+]", "", str_value)
                
            values.append(str_value)
    if not set_clauses:
        return JsonResponse({"error": "No valid fields provided for update."}, status=400)

    set_string = ", ".join(set_clauses)
    
    sql = f"""
        UPDATE users 
        SET {set_string} 
        WHERE user_id = %s 
        RETURNING user_id, username, email, phone_number, first_name, last_name, city;
    """
    values.append(user_id)

    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, values)
            raw_data = cursor.fetchone()
    except IntegrityError:
        return JsonResponse({"error": "Username, email, or phone number already exists."}, status=409)

    if not raw_data:
        return JsonResponse({"error": "User not found."}, status=404)

    user_dict = {
        "user_id": raw_data[0],
        "username": raw_data[1],
        "email": raw_data[2],
        "phone_number": raw_data[3],
        "first_name": raw_data[4],
        "last_name": raw_data[5],
        "city": raw_data[6]
    }

    cache.set(f"user_profile:{user_id}", json.dumps(user_dict), ex=3600)

    return JsonResponse({"message": "Profile updated successfully.", "user": user_dict}, status=200)

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

# API 5: Tickets Search
    # Dynamically searches available tickets based on multi-parameter query filters,
    # returning formatted results and caching query responses in Redis.
def search_tickets(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

    query_params = request.GET.dict()
    
    sorted_params = sorted(query_params.items(), key=lambda x: x[0])
    cache_items = [f"{k}={v}" for k, v in sorted_params if str(v).strip() != ""]
    cache_key = f"tickets_search:{'&'.join(cache_items)}"

    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse({"tickets": json.loads(cached_data), "source": "redis"}, status=200)

    where_clauses = []
    values = []

    sport_type = request.GET.get('sport_type')
    team = request.GET.get('team')
    venue_city = request.GET.get('venue_city')
    venue_name = request.GET.get('venue_name')
    category = request.GET.get('category')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    if sport_type:
        where_clauses.append("t.sport_type = %s")
        values.append(sport_type)

    if team:
        where_clauses.append("(t.home_team = %s OR t.away_team = %s)")
        values.append(team)
        values.append(team)

    if venue_city:
        where_clauses.append("t.venue_city = %s")
        values.append(venue_city)

    if venue_name:
        where_clauses.append("md.venue_name = %s")
        values.append(venue_name)

    if category:
        where_clauses.append("t.category = %s")
        values.append(category)

    if min_price:
        where_clauses.append("t.price >= %s")
        values.append(min_price)

    if max_price:
        where_clauses.append("t.price <= %s")
        values.append(max_price)

    if start_date:
        where_clauses.append("t.ticket_date_time >= %s")
        values.append(start_date)

    if end_date:
        where_clauses.append("t.ticket_date_time <= %s")
        values.append(end_date)

    where_sql = ""
    if where_clauses:
        where_sql = " AND " + " AND ".join(where_clauses)

    sql = f"""
        SELECT t.ticket_id, t.sport_type, t.home_team, t.away_team,
               t.remaining_capacity, t.total_capacity, t.venue_city,
               t.price, t.category, t.ticket_date_time, md.venue_name
        FROM tickets t
        JOIN match_details md ON t.ticket_id = md.ticket_id
        WHERE 1=1{where_sql};
    """

    with connection.cursor() as cursor:
        cursor.execute(sql, values)
        raw_data = cursor.fetchall()

    formatted_response = []
    for row in raw_data:
        formatted_response.append({
            "ticket_id": row[0],
            "sport_type": row[1],
            "home_team": row[2],
            "away_team": row[3],
            "remaining_capacity": row[4],
            "total_capacity": row[5],
            "venue_city": row[6],
            "price": float(row[7]),
            "category": row[8],
            "ticket_date_time": str(row[9]),
            "venue_name": row[10]
        })

    cache.set(cache_key, json.dumps(formatted_response), ex=300)

    return JsonResponse({"tickets": formatted_response}, status=200)

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