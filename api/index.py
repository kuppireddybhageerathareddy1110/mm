# api/index.py
from flask import Flask
# api/index.py
from app import app as application

# Vercel expects a WSGI-compatible `application` object
# Optionally define a handler if needed (for clarity or custom logic)
def handler(environ, start_response):
    return application(environ, start_response)
