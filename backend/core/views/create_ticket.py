import json
from django.http import JsonResponse
from core.utils import index_new_ticket_in_es
from django.db import connection, transaction
from django.views.decorators.csrf import csrf_exempt
from core.utils import jwt_required, invalidate_ticket_caches

# Helper api to create a new ticket by an admin
@csrf_exempt
@jwt_required
def create_ticket(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    user_role = getattr(request, 'user_role', 'Spectator')

    if user_role not in ['Admin', 'Support']:
        return JsonResponse({"error": "Access denied. Admin or Support role required."}, status=403)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    sport_type = body.get('sport_type')
    home_team = body.get('home_team')
    away_team = body.get('away_team')
    ticket_date_time = body.get('ticket_date_time')
    venue_city = body.get('venue_city')
    raw_price = body.get('price')
    raw_capacity = body.get('total_capacity')
    category = body.get('category', 'Normal')

    if not all([sport_type, home_team, away_team, ticket_date_time, venue_city, raw_price, raw_capacity]):
        return JsonResponse({"error": "Missing required ticket fields."}, status=400)

    try:
        price = float(raw_price)
        total_capacity = int(raw_capacity)
        if price < 0 or total_capacity <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return JsonResponse({"error": "Price must be >= 0 and capacity must be > 0."}, status=400)

    organizer = body.get('organizer', '')
    tournament_name = body.get('tournament_name', '')
    venue_name = body.get('venue_name', '')
    facilities = body.get('facilities', '')

    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                sql_insert_ticket = """
                    INSERT INTO tickets (
                        sport_type, home_team, away_team, ticket_date_time, 
                        venue_city, price, total_capacity, remaining_capacity, category
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING ticket_id;
                """
                cursor.execute(sql_insert_ticket, [
                    sport_type, home_team, away_team, ticket_date_time, 
                    venue_city, price, total_capacity, total_capacity, category
                ])
                new_ticket_id = cursor.fetchone()[0]

                sql_insert_details = """
                    INSERT INTO match_details (
                        ticket_id, organizer, tournament_name, venue_name, facilities
                    ) VALUES (%s, %s, %s, %s, %s);
                """
                cursor.execute(sql_insert_details, [
                    new_ticket_id, organizer, tournament_name, venue_name, facilities
                ])

        invalidate_ticket_caches()
        
        index_new_ticket_in_es(new_ticket_id)

        return JsonResponse({
            "message": "Event created successfully.",
            "ticket_id": new_ticket_id
        }, status=201)        

    except Exception as e:
        print(f"Admin Create API Error: {e}")
        return JsonResponse({"error": "Database error occurred during ticket creation."}, status=500)