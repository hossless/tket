import json
import redis
from django.db import connection
from django.http import JsonResponse

cache = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)

# API 5: Search Tickets
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
