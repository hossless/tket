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