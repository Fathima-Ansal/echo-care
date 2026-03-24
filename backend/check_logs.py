from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
uri = os.environ.get("MONGO_URI")
client = MongoClient(uri)
db = client["echocare_db"]
logs = list(db.health_logs.find().sort("timestamp", -1).limit(10))

print("-" * 50)
for l in logs:
    ts = l.get('timestamp')
    txt = l.get('text', '')
    rply = l.get('reply', '')
    sent = l.get('sentiment', 'N/A')
    sev = l.get('severity', 'N/A')
    print(f"[{ts}] User: {txt}")
    print(f"[{ts}] Companion: {rply}")
    print(f"      Sentiment: {sent} | Severity: {sev}")
    print("-" * 50)
