import json
import redis
from django.db import connection
from django.http import JsonResponse
from core.utils import release_expired_reservations

cache = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)

# API 5: Search Tickets
    # Dynamically searches available tickets based on multi-parameter query filters,
    # includes pagination, fuzzy text search, availability toggles, and Redis caching.
def search_tickets(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

    release_expired_reservations()

    allowed_keys = {
        'sport_type', 'team', 'venue_city', 'venue_name', 
        'category', 'min_price', 'max_price', 'start_date', 'end_date', 'sort_by',
        'q', 'exclude_sold_out', 'page', 'limit', 'show_past'
    }
    
    valid_params = {
        k: v for k, v in request.GET.items() 
        if k in allowed_keys and str(v).strip() != ""
    }
    
    sorted_params = sorted(valid_params.items(), key=lambda x: x[0])
    cache_items = [f"{k}={v}" for k, v in sorted_params]
    cache_key = f"tickets_search:{'&'.join(cache_items)}" if cache_items else "tickets_search:all"

    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse({
            "source": "Redis", 
            "data": json.loads(cached_data)
        }, status=200)

    where_clauses = []
    values = []

    sport_type = valid_params.get('sport_type')
    team = valid_params.get('team')
    venue_city = valid_params.get('venue_city')
    venue_name = valid_params.get('venue_name')
    category = valid_params.get('category')
    min_price = valid_params.get('min_price')
    max_price = valid_params.get('max_price')
    start_date = valid_params.get('start_date')
    end_date = valid_params.get('end_date')
    search_query = valid_params.get('q')
    exclude_sold_out = valid_params.get('exclude_sold_out')
    show_past = valid_params.get('show_past')
    sort_by = valid_params.get('sort_by')

    if not (show_past and str(show_past).lower() in ['true', '1']):
        where_clauses.append("t.ticket_date_time >= CURRENT_TIMESTAMP")

    try:
        page = int(valid_params.get('page', 1))
        limit = int(valid_params.get('limit', 20))
        if page < 1: page = 1
        if limit < 1 or limit > 100: limit = 20
    except ValueError:
        page = 1
        limit = 20
        
    offset = (page - 1) * limit

    if search_query:
        where_clauses.append("(t.home_team ILIKE %s OR t.away_team ILIKE %s OR md.venue_name ILIKE %s)")
        fuzzy_term = f"%{search_query}%"
        values.extend([fuzzy_term, fuzzy_term, fuzzy_term])

    if exclude_sold_out and str(exclude_sold_out).lower() in ['true', '1']:
        where_clauses.append("t.remaining_capacity > 0")

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

    where_sql = "1=1"
    if where_clauses:
        where_sql = " AND ".join(where_clauses)

    sort_mapping = {
        "price_asc": "ORDER BY t.price ASC",
        "price_desc": "ORDER BY t.price DESC",
        "date_asc": "ORDER BY t.ticket_date_time ASC",
        "date_desc": "ORDER BY t.ticket_date_time DESC"
    }
    order_by_sql = sort_mapping.get(sort_by, "ORDER BY t.ticket_date_time ASC")

    sql_count = f"""
        SELECT COUNT(t.ticket_id)
        FROM tickets t
        JOIN match_details md ON t.ticket_id = md.ticket_id
        WHERE {where_sql};
    """

    sql_data = f"""
        SELECT t.ticket_id, t.sport_type, t.home_team, t.away_team,
               t.remaining_capacity, t.total_capacity, t.venue_city,
               t.price, t.category, t.ticket_date_time, md.venue_name
        FROM tickets t
        JOIN match_details md ON t.ticket_id = md.ticket_id
        WHERE {where_sql}
        {order_by_sql}
        LIMIT %s OFFSET %s;
    """

    try:
        with connection.cursor() as cursor:
            cursor.execute(sql_count, values)
            total_items = cursor.fetchone()[0]

            values.extend([limit, offset])
            
            cursor.execute(sql_data, values)
            raw_data = cursor.fetchall()
            
    except Exception:
        return JsonResponse({"error": "Invalid search parameter format."}, status=400)

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
        
    total_pages = (total_items + limit - 1) // limit

    response_data = {
        "pagination": {
            "total_items": total_items,
            "total_pages": total_pages,
            "current_page": page,
            "limit": limit
        },
        "tickets": formatted_response
    }

    cache.set(cache_key, json.dumps(response_data), ex=300)

    return JsonResponse({
        "source": "Database",
        "data": response_data
    }, status=200)