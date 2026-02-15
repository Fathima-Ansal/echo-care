from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import secrets
from datetime import datetime
from pymongo import MongoClient
from transcription import transcribe_audio

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ---------------- MongoDB Connection ---------------- #

MONGO_URI = "mongodb+srv://echocare_user:echocarepass@echocare-cluster.plr3b2d.mongodb.net/?retryWrites=true&w=majority&appName=EchoCare-cluster"

client = MongoClient(MONGO_URI)
db = client["echocare_db"]           # Database name
logs_collection = db["health_logs"]  # Collection name

# ---------------------------------------------------- #

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secrets.token_hex(8) + "_" + audio_file.filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    audio_file.save(filepath)

    try:
        # Perform transcription
        text = transcribe_audio(filepath, language='ml-IN')

        if text:
            # 🔥 Save to MongoDB
            logs_collection.insert_one({
                "text": text,
                "language": "ml-IN",
                "timestamp": datetime.utcnow()
            })

            return jsonify({'text': text})
        else:
            return jsonify({'error': 'Could not transcribe audio'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        # Cleanup uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)


@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        # Fetch all logs, sorted by newest first
        logs = list(logs_collection.find().sort("timestamp", -1))
        
        # Convert ObjectId to string for JSON serialization
        for log in logs:
            log["_id"] = str(log["_id"])
            
        return jsonify(logs)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/')
def home():
    return "EchoCare Backend is Running!"


if __name__ == '__main__':
    app.run(debug=True, port=5000)
