from pymongo import MongoClient
import datetime

# Connection URI from app.py
MONGO_URI = "mongodb+srv://echocare_user:echocarepass@echocare-cluster.plr3b2d.mongodb.net/?retryWrites=true&w=majority&appName=EchoCare-cluster"

client = MongoClient(MONGO_URI)
db = client["echocare_db"]
logs_collection = db["health_logs"]

# Malayalam sample text
# "Feeling a bit feverish" -> "പനി പോലെ തോന്നുന്നു"
sample_log = {
    "text": "പനി പോലെ തോന്നുന്നു",
    "language": "ml-IN",
    "timestamp": datetime.datetime.utcnow()
}

try:
    result = logs_collection.insert_one(sample_log)
    print(f"Inserted log with ID: {result.inserted_id}")
except Exception as e:
    print(f"Error inserting log: {e}")
