import os
import json
import redis
from django.http import JsonResponse
from django.db import IntegrityError, connection
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
from core.utils import (
    detect_contact_type,
    generate_user_token, 
    is_valid_username, 
    is_strong_password, 
    generate_otp,
    send_otp
)

redis_host = os.getenv('REDIS_HOST', '127.0.0.1')
cache = redis.Redis(host=redis_host, port=6379, db=0, decode_responses=True)

# API 2: User Signup (Two-Step Flow)
    # Request: Validates user input, checks for duplicates, and sends an OTP via Redis.
@csrf_exempt
def request_signup_otp(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    username = body.get('username')
    password = body.get('password')
    contact_info = body.get('contact_info')

    if not username or not password or not contact_info:
        return JsonResponse({"error": "username, password, and contact_info are required."}, status=400)

    if not is_valid_username(username):
        return JsonResponse({
            "error": "Username must be 3-30 characters, start/end with letter/number, and contain no consecutive special characters."
        }, status=400)

    is_strong, pwd_error = is_strong_password(password)
    if not is_strong:
        return JsonResponse({"error": pwd_error}, status=400)

    contact_type = detect_contact_type(contact_info)
    if not contact_type:
        return JsonResponse({"error": "contact_info must be a valid email or phone number."}, status=400)

    email = contact_info if contact_type == 'email' else None
    phone_number = contact_info if contact_type == 'phone_number' else None

    sql_check = """
        SELECT 1 FROM users 
        WHERE username = %s OR email = %s OR phone_number = %s;
    """
    with connection.cursor() as cursor:
        cursor.execute(sql_check, [username, email, phone_number])
        if cursor.fetchone():
            return JsonResponse({"error": "Username or contact info is already registered."}, status=409)

    if cache.exists(f"otp_cooldown:{contact_info}"):
        return JsonResponse({"error": "Please wait 60 seconds before requesting another OTP."}, status=429)

    hashed_password = make_password(password)
    otp = generate_otp()
    
    user_data = {
        "username": username,
        "password_hash": hashed_password,
        "otp": otp,
        "attempts": 0
    }
    
    cache.set(f"pending_user:{contact_info}", json.dumps(user_data), ex=120)
    cache.set(f"otp_cooldown:{contact_info}", "LOCKED", ex=60)

    send_otp(contact_info, contact_type, otp)

    return JsonResponse({"message": "OTP sent successfully. Please verify within 2 minutes."}, status=200)

    # Verify: Verifies the OTP, saves the user to PostgreSQL, and returns a JWT.
@csrf_exempt
def verify_signup_otp(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)
    
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)
    
    entered_otp = body.get('otp')
    contact_info = body.get('contact_info')

    if not entered_otp or not contact_info:
        return JsonResponse({"error": "otp and contact_info are required."}, status=400)
    
    cache_data_string = cache.get(f"pending_user:{contact_info}")
    if not cache_data_string:
        return JsonResponse({"error": "OTP expired or contact info not found. Please request a new one."}, status=404)
    
    cache_data = json.loads(cache_data_string)
    
    username = cache_data.get('username')
    password_hash = cache_data.get('password_hash')
    sent_otp = cache_data.get('otp')
    attempts = cache_data.get('attempts', 0)
    
    if attempts >= 3:
        cache.delete(f"pending_user:{contact_info}")
        return JsonResponse({"error": "Too many failed attempts. Please request a new OTP."}, status=403)
    
    if str(entered_otp) != str(sent_otp):
        cache_data['attempts'] = attempts + 1
        ttl = cache.ttl(f"pending_user:{contact_info}")
        if ttl > 0:
            cache.set(f"pending_user:{contact_info}", json.dumps(cache_data), ex=ttl)
        return JsonResponse({"error": f"OTP does not match. You have {3 - cache_data['attempts']} attempts left."}, status=400)
                
    contact_type = detect_contact_type(contact_info)
    if not contact_type:
        return JsonResponse({"error": "contact_info must be a valid email or phone number."}, status=400)
    
    email = contact_info if contact_type == 'email' else None
    phone_number = contact_info if contact_type == 'phone_number' else None
    
    sql = """
        INSERT INTO users (username, password_hash, email, phone_number, role, account_status)
        VALUES (%s, %s, %s, %s, 'Spectator', 'Active')
        RETURNING user_id, role;
    """
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, [username, password_hash, email, phone_number])
            user_row = cursor.fetchone()
            
            new_user_id = user_row[0]
            role = user_row[1]

        cache.delete(f"pending_user:{contact_info}")

        token = generate_user_token(new_user_id, role)

        return JsonResponse({
            "message": "User registered successfully.",
            "user_id": new_user_id,
            "token": token
        }, status=201)

    except IntegrityError:
        return JsonResponse({"error": "Database constraint violation."}, status=400)