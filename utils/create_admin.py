from pymongo import MongoClient
from werkzeug.security import generate_password_hash
import os
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

# Connect to MongoDB
mongo_uri = os.getenv("MONGODB_URI")
client = MongoClient(mongo_uri)
db = client["sentimentDB"]
users = db["users"]

# Admin credentials
admin_email = os.getenv("ADMIN_EMAIL")  # Must match .env
password = "admin123"  # Choose your preferred password

# Hash the password
hashed_password = generate_password_hash(password)

# Check if admin already exists
if users.find_one({"email": admin_email}):
    print(f"Admin with email {admin_email} already exists.")
else:
    # Insert admin into DB
    users.insert_one({
        "email": admin_email,
        "password": hashed_password
    })
    print(f"Admin {admin_email} added successfully.")
