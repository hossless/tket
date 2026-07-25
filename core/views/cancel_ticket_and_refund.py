import json
from django.http import JsonResponse
from django.db import connection, transaction
from django.views.decorators.csrf import csrf_exempt
from core.utils import (
    calculate_cancellation_penalty,
    invalidate_ticket_caches,
    jwt_required
)

# API 12: Cancel Reservation
    # Allows an authenticated user to cancel a confirmed reservation.
    # Calculates the penalty based on the time remaining until the event,
    # updates the reservation status, restores ticket capacity, and clears the ticket cache.
@csrf_exempt
@jwt_required
def cancel_ticket_and_refund(request):
    if request.method != 'PATCH':
        return JsonResponse({"error": "Method not allowed. Use PATCH."}, status=405)

    user_id = request.user_id

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    reservation_id = body.get("reservation_id")

    if not reservation_id:
        return JsonResponse({"error": "Reservation id is required."}, status=400)

    with transaction.atomic():
        with connection.cursor() as cursor:
            sql_get_res = """
                SELECT t.ticket_date_time, r.quantity, t.price, t.ticket_id
                FROM reservations r
                JOIN tickets t ON t.ticket_id = r.ticket_id
                WHERE r.reservation_id = %s
                  AND r.user_id = %s
                  AND r.reservation_status = 'Confirmed';
            """
            cursor.execute(sql_get_res, [reservation_id, user_id])
            res_row = cursor.fetchone()

            if not res_row:
                return JsonResponse({"error": "Confirmed reservation not found or access denied."}, status=404)

            date_time, quantity, price, ticket_id = res_row
            amount = quantity * price
            
            penalty_percent, penalty_amount, refund_amount = calculate_cancellation_penalty(date_time, amount)

            sql_update_res = """
                UPDATE reservations
                SET reservation_status = 'Canceled', canceled_by = %s
                WHERE reservation_id = %s;
            """
            cursor.execute(sql_update_res, [user_id, reservation_id])
            
            sql_restore = """
                UPDATE tickets
                SET remaining_capacity = remaining_capacity + %s
                WHERE ticket_id = %s;
            """
            cursor.execute(sql_restore, [quantity, ticket_id])
            
    invalidate_ticket_caches()

    response_data = {
        "reservation_id": reservation_id,
        "ticket_id": ticket_id,
        "penalty_percent": penalty_percent,
        "penalty_amount": penalty_amount,
        "refund_amount": refund_amount
    }

    return JsonResponse({
        "message": "Reservation canceled successfully.",
        "cancellation_details": response_data
    }, status=200)