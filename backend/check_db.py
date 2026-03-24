from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
uri = os.environ.get("MONGO_URI")
if not uri:
    print("MONGO_URI not found in .env")
    exit(1)

client = MongoClient(uri)
db = client["echocare_db"]
print("Collections:", db.list_collection_names())

users = list(db.users.find({}, {"password": 0}))
print("Users count:", len(users))
for u in users:
    print(u)

logs = list(db.health_logs.find().sort("timestamp", -1).limit(5))
print("Recent logs count:", len(logs))
for l in logs:
    print(l)
