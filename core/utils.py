import re

def is_valid_email(email):
    pattern = r"^[a-zA-Z0-9]+(?:[\.\_\+\-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:[\.\-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))

def is_valid_phone(phone_number):
    digit_count = sum(c.isdigit() for c in phone_number)
    if not (7 <= digit_count <= 15):
        return False
    
    pattern = r"^\+?[\d\s\-\(\)]+$"
    return bool(re.match(pattern, phone_number))

def is_valid_username(username):
    if not (3 <= len(username) <= 30):
        return False
        
    if ".." in username or "--" in username or "__" in username:
        return False
        
    pattern = r"^[a-zA-Z0-9][a-zA-Z0-9\.\-\_]*[a-zA-Z0-9]$"
    return bool(re.match(pattern, username))

from django.db import connection

def release_expired_reservations():

    with connection.cursor() as cursor:
        restore_sql = """
            UPDATE tickets t
            SET remaining_capacity = t.remaining_capacity + r.quantity
            FROM reservations r
            WHERE r.ticket_id = t.ticket_id
              AND r.reservation_status = 'Pending'
              AND r.created_at < NOW() - INTERVAL '10 minutes';
        """
        cursor.execute(restore_sql)
        
        cancel_sql = """
            UPDATE reservations
            SET reservation_status = 'Canceled'
            WHERE reservation_status = 'Pending'
              AND created_at < NOW() - INTERVAL '10 minutes';
        """
        cursor.execute(cancel_sql)