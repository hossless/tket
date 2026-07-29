import os
import json
import redis
from django.conf import settings
from django.http import JsonResponse
from elasticsearch import Elasticsearch
from core.utils import release_expired_reservations

redis_host = os.getenv('REDIS_HOST', '127.0.0.1')
cache = redis.Redis(host=redis_host, port=6379, db=0, decode_responses=True)

# API 5: Search Tickets
    # Dynamically searches available tickets based on multi-parameter query filters,
    # includes pagination, fuzzy text search, availability toggles, and Redis caching.
def search_tickets(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

    release_expired_reservations()

    es = Elasticsearch(getattr(settings, 'ELASTICSEARCH_URL', 'http://localhost:9200'))

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
    cache_key = f"tickets_search_es:{'&'.join(cache_items)}" if cache_items else "tickets_search_es:all"

    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse({"source": "Redis", "data": json.loads(cached_data)}, status=200)

    es_query = {"bool": {"must": [], "filter": []}}

    if 'q' in valid_params:
        es_query["bool"]["must"].append({
            "multi_match": {
                "query": valid_params['q'],
                "fields": ["home_team", "away_team", "venue_name"],
                "fuzziness": "AUTO"
            }
        })

    if 'sport_type' in valid_params:
        es_query["bool"]["filter"].append({"match": {"sport_type": valid_params['sport_type']}})
    if 'venue_city' in valid_params:
        es_query["bool"]["filter"].append({"match": {"venue_city": valid_params['venue_city']}})
    if 'venue_name' in valid_params:
        es_query["bool"]["filter"].append({"match": {"venue_name": valid_params['venue_name']}})
    if 'category' in valid_params:
        es_query["bool"]["filter"].append({"match": {"category": valid_params['category']}})
    
    if 'team' in valid_params:
        es_query["bool"]["filter"].append({
            "bool": {
                "should": [
                    {"match": {"home_team": valid_params['team']}},
                    {"match": {"away_team": valid_params['team']}}
                ]
            }
        })

    if str(valid_params.get('exclude_sold_out', '')).lower() in ['true', '1']:
        es_query["bool"]["filter"].append({"range": {"remaining_capacity": {"gt": 0}}})

    if not (str(valid_params.get('show_past', '')).lower() in ['true', '1']):
        es_query["bool"]["filter"].append({"range": {"ticket_date_time": {"gte": "now"}}})

    price_range = {}
    if 'min_price' in valid_params: price_range["gte"] = float(valid_params['min_price'])
    if 'max_price' in valid_params: price_range["lte"] = float(valid_params['max_price'])
    if price_range: es_query["bool"]["filter"].append({"range": {"price": price_range}})

    date_range = {}
    if 'start_date' in valid_params: date_range["gte"] = valid_params['start_date']
    if 'end_date' in valid_params: date_range["lte"] = valid_params['end_date']
    if date_range: es_query["bool"]["filter"].append({"range": {"ticket_date_time": date_range}})

    sort_mapping = {
        "price_asc": [{"price": "asc"}],
        "price_desc": [{"price": "desc"}],
        "date_asc": [{"ticket_date_time": "asc"}],
        "date_desc": [{"ticket_date_time": "desc"}]
    }
    sort_by = sort_mapping.get(valid_params.get('sort_by'), [{"ticket_date_time": "asc"}])

    try:
        page = int(valid_params.get('page', 1))
        limit = int(valid_params.get('limit', 20))
        page = max(1, page)
        limit = max(1, min(100, limit))
    except ValueError:
        page, limit = 1, 20
        
    offset = (page - 1) * limit

    try:
        response = es.search(
            index="tickets",
            query=es_query if (es_query["bool"]["must"] or es_query["bool"]["filter"]) else {"match_all": {}},
            sort=sort_by,
            from_=offset,
            size=limit
        )
    except Exception as e:
        return JsonResponse({"error": f"ElasticSearch error: {str(e)}"}, status=500)

    total_items = response['hits']['total']['value']
    formatted_response = []
    
    for hit in response['hits']['hits']:
        doc = hit['_source']
        doc['ticket_id'] = hit['_id']
        formatted_response.append(doc)
        
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

    return JsonResponse({"source": "ElasticSearch", "data": response_data}, status=200)