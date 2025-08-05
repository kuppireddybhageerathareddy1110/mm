
# utils/oauth.py
from flask import redirect, url_for, session
from authlib.integrations.flask_client import OAuth
import os

oauth = OAuth()

def configure_oauth(app):
    oauth.init_app(app)
    app.secret_key = os.getenv("SECRET_KEY")
    oauth.register(
        name='google',
        client_id=os.getenv('GOOGLE_CLIENT_ID'),
        client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
        access_token_url='https://oauth2.googleapis.com/token',
        access_token_params=None,
        authorize_url='https://accounts.google.com/o/oauth2/auth',
        authorize_params=None,
        api_base_url='https://www.googleapis.com/oauth2/v1/',
        userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
        client_kwargs={'scope': 'openid email profile'}
    )

def login_with_google():
    redirect_uri = url_for('google_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

def fetch_google_user():
    token = oauth.google.authorize_access_token()
    user_info = oauth.google.parse_id_token(token)
    return user_info