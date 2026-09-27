from pymongo import MongoClient
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://echocare_user:echocarepass@echocare-cluster.plr3b2d.mongodb.net/?retryWrites=true&w=majority&appName=EchoCare-cluster")
new_password = "password123"

hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

try:
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client["echocare_db"]
    users_collection = db["users"]

    user = users_collection.find_one({"email": "jalwajabbar@gmail.com"})
    
    if user:
        result = users_collection.update_one(
            {"email": "jalwajabbar@gmail.com"},
            {"$set": {"password": hashed}}
        )
        print(f"SUCCESS: Updated password for jalwajabbar@gmail.com to: '{new_password}'")
    else:
        new_user = {
            "email": "jalwajabbar@gmail.com",
            "password": hashed,
            "role": "caregiver",
            "phone_number": "+918086964133"
        }
        users_collection.insert_one(new_user)
        print(f"SUCCESS: Created new caregiver account for jalwajabbar@gmail.com with password: '{new_password}'")

except Exception as e:
    print(f"ERROR: {str(e)}")
