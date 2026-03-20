from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import secrets
from datetime import datetime, timedelta
from pymongo import MongoClient
import bcrypt
import jwt
from functools import wraps
from transcription import transcribe_audio

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default_secret_key_for_dev')

# ---------------- MongoDB Connection ---------------- #

MONGO_URI = "mongodb+srv://echocare_user:echocarepass@echocare-cluster.plr3b2d.mongodb.net/?retryWrites=true&w=majority&appName=EchoCare-cluster"

client = MongoClient(MONGO_URI)
db = client["echocare_db"]           # Database name
logs_collection = db["health_logs"]  # Collection name
users_collection = db["users"]       # Users collection

# ---------------------------------------------------- #

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Authentication Middleware ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
            
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data
        except Exception as e:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
        
    email = data['email']
    password = data['password']
    role = 'caregiver' # Force default to caregiver for self-registration

    
    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'User already exists'}), 409
        
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    new_user = {
        'email': email,
        'password': hashed_password.decode('utf-8'),
        'role': role,
        'created_at': datetime.utcnow()
    }
    
    users_collection.insert_one(new_user)
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
        
    user = users_collection.find_one({'email': data['email']})
    
    if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Invalid email or password'}), 401
        
    token = jwt.encode({
        'user_id': str(user['_id']),
        'role': user['role'],
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'token': token,
        'id': str(user['_id']),
        'role': user['role'],
        'email': user['email']
    }), 200

@app.route('/api/create-elderly', methods=['POST'])
@token_required
def create_elderly(current_user):
    if current_user['role'] != 'caregiver':
        return jsonify({'error': 'Unauthorized: Only caregivers can create elderly accounts.'}), 403

    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    email = data['email']
    password = data['password']

    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'User with this email/username already exists'}), 409

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    new_user = {
        'email': email,
        'password': hashed_password.decode('utf-8'),
        'role': 'elderly',
        'caregiver_id': current_user['user_id'],
        'created_at': datetime.utcnow()
    }

    users_collection.insert_one(new_user)
    return jsonify({'message': 'Elderly user created successfully'}), 201


@app.route('/api/transcribe', methods=['POST'])
@token_required
def transcribe(current_user):
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
                "timestamp": datetime.utcnow(),
                "user_id": current_user['user_id']
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
@token_required
def get_logs(current_user):
    try:
        if current_user['role'] == 'elderly':
            # Fetch logs for this elderly user
            logs = list(logs_collection.find({"user_id": current_user['user_id']}).sort("timestamp", -1))
        elif current_user['role'] == 'caregiver':
            # Get elderly users tied to this caregiver
            elderly_users = users_collection.find({"caregiver_id": current_user["user_id"]})
            elderly_ids = [str(u["_id"]) for u in elderly_users]
            # Fetch logs for these elderly users
            logs = list(logs_collection.find({"user_id": {"$in": elderly_ids}}).sort("timestamp", -1))
        else:
            return jsonify({'error': 'Unauthorized role'}), 403
            
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
