# api/index.py
from flask import Flask
from app import app as original_app  # Import from your existing app.py

app = original_app

def handler(environ, start_response):
    return app(environ, start_response)
