from django.db import connection
from django.http import JsonResponse
from backend.core.utils import calculate_cancellation_penalty, jwt_required

# API 9: Check Cancellation Penalty
    # Calculates potential cancellation penalties and eligible refund amounts for a confirmed
    # reservation based on remaining time until event kickoff using core utility rules.
@jwt_required
def check_cancellation_penalty(request, reservation_id):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)    

    try:
        reservation_id = int(reservation_id)
    except ValueError:
        return JsonResponse({"error": "Invalid reservation ID format."}, status=400)

    user_id = request.user_id

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT t.ticket_date_time, r.quantity, t.price
                FROM reservations r
                JOIN tickets t ON t.ticket_id = r.ticket_id
                WHERE r.reservation_id = %s
                  AND r.user_id = %s
                  AND r.reservation_status = 'Confirmed';
            """
            cursor.execute(sql, [reservation_id, user_id])
            raw_data = cursor.fetchone()
    except Exception:
        return JsonResponse({"error": "Database error occurred."}, status=500)
    
    if not raw_data:
        return JsonResponse({"error": "Confirmed reservation not found or access denied."}, status=404)
    
    date_time, quantity, price = raw_data
    amount = round(float(quantity * price), 2)
    
    penalty_percent, penalty_amount, refund_amount = calculate_cancellation_penalty(date_time, amount)
    
    formatted_response = {
        "reservation_id": reservation_id,
        "total_amount": amount,
        "penalty_percent": penalty_percent,
        "penalty_amount": round(float(penalty_amount), 2),
        "refund_amount": round(float(refund_amount), 2)
    }

    return JsonResponse({"cancellation_penalty": formatted_response}, status=200)