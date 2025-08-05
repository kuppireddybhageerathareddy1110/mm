# utils/auth.py
from werkzeug.security import generate_password_hash, check_password_hash
from flask import session

def hash_password(password):
    return generate_password_hash(password)

def check_password(hashed_password, user_password):
    return check_password_hash(hashed_password, user_password)

def login_user(user):
    session['user_id'] = str(user['_id'])
    session['email'] = user['email']
    session['is_admin'] = user.get('is_admin', False)

def logout_user():
    session.clear()

def current_user():
    return session.get('email')

def is_admin():
    return session.get('is_admin', False)