import json
import redis
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
from core.utils import (
    detect_contact_type, 
    is_valid_username, 
    is_strong_password, 
    generate_otp,
    send_otp
)

cache = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)

# API 2: User Signup (Two-Step Flow)
    # Request: Validates user input, checks for duplicates, and sends an OTP via Redis.
    # Verify: Verifies the OTP, saves the user to PostgreSQL, and returns a JWT.
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

    hashed_password = make_password(password)
    otp = generate_otp()
    
    user_data = {
        "username": username,
        "password_hash": hashed_password,
        "otp": otp
    }
    
    cache.set(f"pending_user:{contact_info}", json.dumps(user_data), ex=120)

    send_otp(contact_info, contact_type, otp)

    return JsonResponse({"message": "OTP sent successfully. Please verify within 2 minutes."}, status=200)


@csrf_exempt
def verify_signup_otp(request):
    pass