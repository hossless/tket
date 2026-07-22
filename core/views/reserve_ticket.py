import json
import redis
import string
import random
from django.db import connection
from django.db import transaction
from django.http import JsonResponse
from django.db import IntegrityError
from core.utils import release_expired_reservations
from django.views.decorators.csrf import csrf_exempt

cache = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)

# API 7: Reserve Ticket
    # Handles ticket reservation by checking capacity, deducting quantity within an atomic
    # transaction, creating a pending reservation record, and setting a 10-minute Redis lock.
@csrf_exempt
def reserve_ticket(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    release_expired_reservations()

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    user_id = body.get('user_id')
    ticket_id = body.get('ticket_id')
    quantity = body.get('quantity', 1)
    seat_info = body.get('seat_info')

    if not user_id or not ticket_id:
        return JsonResponse({"error": "Both user_id and ticket_id are required."}, status=400)

    try:
        quantity = int(quantity)
        if quantity <= 0:
            return JsonResponse({"error": "Quantity must be a positive integer."}, status=400)
    except (ValueError, TypeError):
        return JsonResponse({"error": "Quantity must be a valid integer."}, status=400)

    if not seat_info:
        section = random.choice(string.ascii_uppercase)
        seat_info = f"Section {section} - Seat {random.randint(1, 100)}"

    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                sql_check = "SELECT remaining_capacity FROM tickets WHERE ticket_id = %s;"
                cursor.execute(sql_check, [ticket_id])
                ticket_row = cursor.fetchone()

                if not ticket_row:
                    return JsonResponse({"error": "Ticket not found."}, status=404)

                remaining_capacity = ticket_row[0]

                if quantity > remaining_capacity:
                    return JsonResponse({"error": "Not enough tickets available."}, status=400)

                sql_update = """
                    UPDATE tickets 
                    SET remaining_capacity = remaining_capacity - %s 
                    WHERE ticket_id = %s;
                """
                cursor.execute(sql_update, [quantity, ticket_id])

                sql_insert = """
                    INSERT INTO reservations (user_id, ticket_id, quantity, seat_info, reservation_status)
                    VALUES (%s, %s, %s, %s, 'Pending')
                    RETURNING reservation_id;
                """
                cursor.execute(sql_insert, [user_id, ticket_id, quantity, seat_info])
                reservation_row = cursor.fetchone()
                reservation_id = reservation_row[0]

        cache.set(f"reservation_lock:{reservation_id}", "LOCKED", ex=600)

        return JsonResponse({
            "message": "Ticket reserved successfully.",
            "reservation_id": reservation_id,
            "quantity": quantity,
            "seat_info": seat_info,
            "status": "Pending"
        }, status=201)

    except IntegrityError:
        return JsonResponse({"error": "User does not exist or database constraint failed."}, status=400)
