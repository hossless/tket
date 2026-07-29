import os
import re
import jwt
import redis
import random
import datetime
from functools import wraps
from django.db import connection
from django.conf import settings
from django.utils import timezone
from django.http import JsonResponse
from django.core.mail import send_mail
from elasticsearch import Elasticsearch # pyright: ignore[reportMissingImports]

redis_host = os.getenv('REDIS_HOST', '127.0.0.1')
cache = redis.Redis(host=redis_host, port=6379, db=0, decode_responses=True)

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

def jwt_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({"error": "Missing or invalid Authorization header. Expected 'Bearer <token>'."}, status=401)
            
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            
            request.user_id = payload.get('user_id')
            request.user_role = payload.get('role')
            
        except jwt.ExpiredSignatureError:
            return JsonResponse({"error": "Token has expired. Please log in again."}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({"error": "Invalid token."}, status=401)
            
        return view_func(request, *args, **kwargs)
        
    return _wrapped_view

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp(contact_info, contact_type, otp):
    if contact_type == 'email':
        subject = 'Your tket Verification Code'
        
        text_message = f'Welcome to tket!\nYour verification code is: {otp}\nThis code will expire in 2 minutes.'
        
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Plus+Jakarta+Sans:wght@700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 20px; background-color: #F7FAFC;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <div style="background-color: #B794F4; padding: 20px; text-align: center;">
              <h1 style="font-family: 'Plus Jakarta Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; margin: 0; font-size: 28px; letter-spacing: 1px;">tket</h1>
            </div>
            
            <div style="padding: 30px; font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1C1A27;">
              <h2 style="font-family: 'Plus Jakarta Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; margin-top: 0;">Welcome to the platform!</h2>
              <p style="font-size: 16px; line-height: 1.5;">Please use the verification code below to complete your registration:</p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #F7FAFC; border: 1px dashed #E2E8F0; border-radius: 6px; text-align: center;">
                <strong style="font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 32px; letter-spacing: 8px; color: #B794F4;">{otp}</strong>
              </div>
              
              <p style="font-size: 14px;">This code will expire in <strong>2 minutes</strong>.</p>
              <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
              <p style="font-size: 12px; color: #718096; text-align: center;">If you did not request this code, you can safely ignore this email.</p>
            </div>
            
          </div>
        </body>
        </html>
        """
        
        from_email = settings.EMAIL_HOST_USER
        recipient_list = [contact_info]
        
        try:
            send_mail(
                subject=subject, 
                message=text_message, 
                from_email=from_email, 
                recipient_list=recipient_list, 
                fail_silently=False, 
                html_message=html_message
            )
            print(f"[SUCCESS] Branded HTML email sent to {contact_info}")
        except Exception as e:
            print(f"[ERROR] Failed to send email: {e}")
            
    elif contact_type == 'phone_number':
        print(f"\n[SMS] To: {contact_info} | Message: Your tket login code is {otp}\n")

def calculate_cancellation_penalty(ticket_datetime, amount):
    now = timezone.now()
    
    if isinstance(ticket_datetime, str):
        from django.utils.dateparse import parse_datetime
        ticket_datetime = parse_datetime(ticket_datetime)

    if timezone.is_naive(ticket_datetime):
        ticket_datetime = timezone.make_aware(ticket_datetime)

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

def release_expired_reservations():
    with connection.cursor() as cursor:
        restore_sql = """
            UPDATE tickets t
            SET remaining_capacity = t.remaining_capacity + r.quantity
            FROM reservations r
            WHERE r.ticket_id = t.ticket_id
              AND r.reservation_status = 'Pending'
              AND r.reserved_at < NOW() - INTERVAL '10 minutes'
            RETURNING t.ticket_id, t.remaining_capacity; 
        """
        cursor.execute(restore_sql)
        updated_tickets = cursor.fetchall()
        
        if updated_tickets:
            for ticket_id, new_capacity in updated_tickets:
                update_es_ticket(ticket_id, remaining_capacity=new_capacity)
                
            invalidate_ticket_caches()
            
        cancel_sql = """
            UPDATE reservations
            SET reservation_status = 'Expired'
            WHERE reservation_status = 'Pending'
              AND reserved_at < NOW() - INTERVAL '10 minutes';
        """
        cursor.execute(cancel_sql) 

def invalidate_ticket_caches():
    keys_es = cache.keys("tickets_search_es:*")
    keys_sql = cache.keys("tickets_search:*") 
    
    all_keys = keys_es + keys_sql
    if all_keys:
        cache.delete(*all_keys)

def update_es_ticket(ticket_id, **kwargs):
    try:

        es = Elasticsearch(os.environ.get('ELASTICSEARCH_URL', 'http://elasticsearch:9200'))        
        es.update(
            index="tickets",
            id=ticket_id,
            doc=kwargs
        )
    except Exception as e:
        print(f"Failed to update ElasticSearch for ticket {ticket_id}: {e}")