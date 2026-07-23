from django.db import connection
from django.http import JsonResponse
from core.utils import calculate_cancellation_penalty

# API 9: Chceck Cancellation Penalty
    # Calculates potential cancellation penalties and eligible refund amounts for a confirmed
    # reservation based on remaining time until event kickoff using core utility rules.
def check_cancellation_penalty(request, reservation_id):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)    

    with connection.cursor() as cursor:
        sql = """
            SELECT t.ticket_date_time, r.quantity, t.price
            FROM reservations r
            JOIN tickets t ON t.ticket_id = r.ticket_id
            WHERE r.reservation_id = %s
              AND r.reservation_status = 'Confirmed';
        """
        cursor.execute(sql, [reservation_id])
        raw_data = cursor.fetchone()
    
    if not raw_data:
        return JsonResponse({"error": "Confirmed reservation not found."}, status=404)
    
    date_time, quantity, price = raw_data
    amount = quantity * price
    penalty_percent, penalty_amount, refund_amount = calculate_cancellation_penalty(date_time, amount)
    
    formatted_response = {
        "reservation_id": reservation_id,
        "total_amount": float(amount),
        "penalty_percent": penalty_percent,
        "penalty_amount": penalty_amount,
        "refund_amount": refund_amount
    }

    return JsonResponse({"cancellation_penalty": formatted_response}, status=200)