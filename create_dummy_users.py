import os
from dotenv import load_dotenv
from pymongo import MongoClient
from werkzeug.security import generate_password_hash

# Load environment variables
load_dotenv()

mongo_uri = os.getenv("MONGODB_URI")
if not mongo_uri:
    print("Error: MONGODB_URI is not set in your .env file.")
    exit(1)

client = MongoClient(mongo_uri)
db = client['sentimentDB']
users_collection = db['users']

admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
user_email = "user@example.com"
default_password = "password123"

# Hashed password for the dummy accounts
hashed_password = generate_password_hash(default_password)

def create_user(email, password_hash, role_description):
    # Convert email to lowercase as standard in registration/login
    email_lower = email.lower()
    existing = users_collection.find_one({"email": email_lower})
    if existing:
        print(f"[-] {role_description} ({email_lower}) already exists in the database.")
    else:
        users_collection.insert_one({
            "email": email_lower,
            "password": password_hash
        })
        print(f"[+] Successfully created {role_description} account: {email_lower}")

print("Connecting to MongoDB...")
# Create Admin Account
create_user(admin_email, hashed_password, "Admin")

# Create Dummy User Account
create_user(user_email, hashed_password, "Regular User")

print(f"\nBoth accounts are configured with the password: {default_password}")
client.close()
