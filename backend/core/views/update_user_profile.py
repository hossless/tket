import os
import re
import json
import redis
from django.db import connection
from django.http import JsonResponse
from django.db import IntegrityError
from django.views.decorators.csrf import csrf_exempt
from backend.core.utils import (
    is_valid_email,
    is_valid_phone,
    is_valid_username,
    jwt_required
)

redis_host = os.getenv('REDIS_HOST', '127.0.0.1')
cache = redis.Redis(host=redis_host, port=6379, db=0, decode_responses=True)

# API 3: Update User Profile
    # Updates profile details for a given user using dynamic SQL fields
    # and syncs the updated profile directly into the Redis cache.
@csrf_exempt
@jwt_required
def update_user_profile(request):
    if request.method != 'PATCH':
        return JsonResponse({"error": "Method not allowed. Use PATCH."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    user_id = request.user_id

    allowed_columns = ["first_name", "last_name", "username", "phone_number", "email", "city"]
    set_clauses = []
    values = []

    for key, value in body.items():
        if key in allowed_columns:
            if not isinstance(value, str):
                return JsonResponse({"error": f"Field '{key}' must be a string."}, status=400)

            str_value = value.strip()
            if str_value == "":
                return JsonResponse({"error": f"Field '{key}' cannot be empty."}, status=400)

            if key == "email" and not is_valid_email(str_value):
                return JsonResponse({"error": "Invalid email format."}, status=400)
            
            if key == "phone_number" and not is_valid_phone(str_value):
                return JsonResponse({"error": "Invalid phone number format."}, status=400)
            
            if key == "username" and not is_valid_username(str_value):
                return JsonResponse({"error": "Invalid username format."}, status=400)

            set_clauses.append(f"{key} = %s")
            
            if key == "phone_number":
                str_value = re.sub(r"[^\d\+]", "", str_value)
                
            values.append(str_value)

    if not set_clauses:
        return JsonResponse({"error": "No valid fields provided for update."}, status=400)

    set_string = ", ".join(set_clauses)
    
    sql = f"""
        UPDATE users 
        SET {set_string} 
        WHERE user_id = %s 
        RETURNING user_id, username, email, phone_number, first_name, last_name, city;
    """
    values.append(user_id)

    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, values)
            raw_data = cursor.fetchone()
    except IntegrityError:
        return JsonResponse({"error": "Username, email, or phone number already exists."}, status=409)

    if not raw_data:
        return JsonResponse({"error": "User not found."}, status=404)

    user_dict = {
        "user_id": raw_data[0],
        "username": raw_data[1],
        "email": raw_data[2],
        "phone_number": raw_data[3],
        "first_name": raw_data[4],
        "last_name": raw_data[5],
        "city": raw_data[6]
    }

    cache.set(f"user_profile:{user_id}", json.dumps(user_dict), ex=3600)

    return JsonResponse({"message": "Profile updated successfully.", "user": user_dict}, status=200)