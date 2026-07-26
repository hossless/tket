import json
import uuid
import redis
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection, transaction, IntegrityError
from core.utils import release_expired_reservations, jwt_required

cache = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)

# API 8: Payment for Ticket
    # Processes ticket payment by verifying active Redis TTL locks, recording transaction details
    # in PostgreSQL within an atomic transaction, updating reservation status to 'Confirmed',
    # and releasing the temporary Redis lock upon completion.
@csrf_exempt
@jwt_required
def payment_for_ticket(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    release_expired_reservations()

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    user_id = request.user_id
    raw_reservation_id = body.get('reservation_id')
    method = body.get('method', 'Credit Card')

    if not raw_reservation_id:
        return JsonResponse({"error": "reservation_id is required."}, status=400)

    try:
        reservation_id = int(raw_reservation_id)
    except (ValueError, TypeError):
        return JsonResponse({"error": "reservation_id must be a valid integer."}, status=400)

    allowed_methods = ['Credit Card', 'PayPal', 'Crypto', 'Bank Transfer', 'Wallet']
    if method not in allowed_methods:
        return JsonResponse({"error": f"Invalid payment method. Allowed methods: {', '.join(allowed_methods)}"}, status=400)

    cache_data = cache.get(f"reservation_lock:{reservation_id}")
    
    if not cache_data:
        return JsonResponse({"error": "Reservation expired or not found."}, status=410)

    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                sql_check = """
                    SELECT r.quantity, t.price 
                    FROM tickets t
                    JOIN reservations r ON t.ticket_id = r.ticket_id
                    WHERE r.reservation_id = %s
                      AND r.user_id = %s
                      AND r.reservation_status = 'Pending'
                    FOR UPDATE;
                """
                cursor.execute(sql_check, [reservation_id, user_id])
                reservation_row = cursor.fetchone()

                if not reservation_row:
                    return JsonResponse({"error": "Pending reservation not found or access denied."}, status=404)

                quantity = reservation_row[0]
                price = reservation_row[1]
                amount = round(float(quantity * price), 2)
                
                tracking_code = f"TRK-{uuid.uuid4().hex[:10].upper()}"
                
                sql_insert = """
                    INSERT INTO payments (reservation_id, amount, method, transaction_status, tracking_code)
                    VALUES (%s, %s, %s, 'Successful', %s);
                """
                cursor.execute(sql_insert, [reservation_id, amount, method, tracking_code])
                
                sql_update = """
                    UPDATE reservations 
                    SET reservation_status = 'Confirmed'
                    WHERE reservation_id = %s;
                """
                cursor.execute(sql_update, [reservation_id])

        cache.delete(f"reservation_lock:{reservation_id}")

        return JsonResponse({
            "message": "Payment successful.",
            "tracking_code": tracking_code,
            "amount": amount,
            "status": "Confirmed"
        }, status=200)

    except IntegrityError:
        return JsonResponse({"error": "Database constraint failed or invalid reservation."}, status=400)