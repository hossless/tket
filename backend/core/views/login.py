import json
from django.http import JsonResponse
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import check_password
from backend.core.utils import detect_contact_type, generate_user_token

# API 1: User Login
    # Authenticates a user using their username, email, or phone number along with their password.
    # Upon successful authentication, returns a JWT access token for subsequent authorized requests.
@csrf_exempt
def login(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    login_identifier = body.get('login_identifier')
    raw_password = body.get('password')

    if not login_identifier or not raw_password:
        return JsonResponse({"error": "Login identifier and password are required."}, status=400)

    login_method = detect_contact_type(login_identifier)
    if login_method is None:
        login_method = "username"
    
    sql = f"""
        SELECT user_id, password_hash, role, account_status
        FROM users 
        WHERE {login_method} = %s;
    """
    
    with connection.cursor() as cursor:
        cursor.execute(sql, [login_identifier])
        raw_data = cursor.fetchone()
        
        if not raw_data:
            return JsonResponse({"error": "Invalid login credentials."}, status=401)

    user_id, password_hash, role, account_status = raw_data

    if account_status != 'Active':
        return JsonResponse({"error": "Account is suspended or banned. Please contact support."}, status=403)

    if not check_password(raw_password, password_hash):
        return JsonResponse({"error": "Invalid login credentials."}, status=401)
    
    token = generate_user_token(user_id, role)
    
    user_data = {
        "user_id": user_id,
        "token": token
    }
    
    return JsonResponse({"message": "Logged in successfully", "user": user_data}, status=200)