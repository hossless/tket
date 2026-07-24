import re
import jwt
import redis
import random
import datetime
from django.conf import settings
from django.db import connection

cache = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)

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

def detect_contact_type(contact_info):
    if is_valid_email(contact_info):
        return 'email'
    if is_valid_phone(contact_info):
        return 'phone_number'
    return None

def is_strong_password(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
        
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
        
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
        
    if not re.search(r"[@$!%*?&#^_-]", password):
        return False, "Password must contain at least one special character (e.g., @, $, !, %, *, ?, &, #)."
        
    return True, ""

def generate_user_token(user_id, role='Spectator'):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1),
        'iat': datetime.datetime.now(datetime.timezone.utc)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def generate_otp():
    return str(random.randint(100000, 999999))

def release_expired_reservations():
    with connection.cursor() as cursor:
        restore_sql = """
            UPDATE tickets t
            SET remaining_capacity = t.remaining_capacity + r.quantity
            FROM reservations r
            WHERE r.ticket_id = t.ticket_id
              AND r.reservation_status = 'Pending'
              AND r.reserved_at < NOW() - INTERVAL '10 minutes';
        """
        cursor.execute(restore_sql)
        
        if cursor.rowcount > 0:
            invalidate_ticket_caches()
            
        cancel_sql = """
            UPDATE reservations
            SET reservation_status = 'Expired'
            WHERE reservation_status = 'Pending'
              AND reserved_at < NOW() - INTERVAL '10 minutes';
        """
        cursor.execute(cancel_sql)  
              
def calculate_cancellation_penalty(ticket_datetime, amount):
    now = datetime.now()
    if ticket_datetime.tzinfo:
        now = now.astimezone(ticket_datetime.tzinfo)

    time_diff = ticket_datetime - now
    hours_remaining = time_diff.total_seconds() / 3600

    if hours_remaining <= 0:
        penalty_percent = 100
    elif hours_remaining < 6:
        penalty_percent = 50
    elif hours_remaining < 24:
        penalty_percent = 30
    else:
        penalty_percent = 10
        
    penalty_amount = float(amount) * (penalty_percent / 100)
    refund_amount = float(amount) - penalty_amount
    
    return penalty_percent, round(penalty_amount, 2), round(refund_amount, 2)

def invalidate_ticket_caches():
    keys = cache.keys("tickets_search:*")
    if keys:
        cache.delete(*keys)