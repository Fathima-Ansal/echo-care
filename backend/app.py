from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import secrets
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
import bcrypt
import jwt
from functools import wraps
from dotenv import load_dotenv
from groq import Groq
from transcription import transcribe_audio
from gtts import gTTS
import base64
import io

# Load environment variables
load_dotenv()

# We configure client below dynamically or fail gracefully

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
        
    token_payload = {
        'user_id': str(user['_id']),
        'role': user['role'],
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }
    
    if 'preferred_language' in user:
        token_payload['preferred_language'] = user['preferred_language']
        
    token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm="HS256")
    
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
    preferred_language = data.get('preferred_language', 'ml-IN')

    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'User with this email/username already exists'}), 409

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    new_user = {
        'email': email,
        'password': hashed_password.decode('utf-8'),
        'role': 'elderly',
        'preferred_language': preferred_language,
        'caregiver_id': current_user['user_id'],
        'created_at': datetime.now(timezone.utc)
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
        user_language = current_user.get('preferred_language', 'ml-IN')
        
        # Perform transcription with Google Web Speech API
        text = transcribe_audio(filepath, language=user_language)

        if text:
            # Generate intelligent conversational triage reply using Groq
            reply_text = None
            api_key = os.environ.get("GROQ_API_KEY")
            if api_key and api_key != "your_groq_api_key_here":
                try:
                    # Fetch short conversation history to prevent repeating questions
                    recent_logs = list(logs_collection.find({"user_id": current_user['user_id']}).sort("timestamp", -1).limit(4))
                    recent_logs.reverse() # Chronological order
                    history_text = ""
                    for lg in recent_logs:
                        history_text += f"User: {lg.get('text', '')}\n"
                        if lg.get('reply'):
                            history_text += f"Companion: {lg.get('reply', '')}\n"

                    client = Groq(api_key=api_key)
                    prompt = f"""
You are a caring AI health companion for elderly users. 
Your task is to triage their health issue by gathering information about:
1. Duration of pain
2. Severity of pain
3. If they have taken any medicines

STRICT OUTPUT RULES:
- IMPORTANT: Review the Conversation History below. Ask ONLY ONE question at a time to gather the missing information. DO NOT repeat questions.
- MAXIMUM 3 QUESTIONS / STOPPING CONDITION: Once you have gathered all 3 pieces of information OR if you have already asked 3 questions, you MUST stop asking questions. You MUST end the conversation by saying exactly this sentence (translated to the user's language): "If the pain is increasing I suggest you to go to doctor." Do not add anything else after this sentence.
- You MUST reply in the EXACT SAME LANGUAGE as the user! If the user speaks Malayalam, reply natively in Malayalam script. If English, reply in English.
- OUTPUT ONLY THE DIRECT CONVERSATIONAL RESPONSE.
- DO NOT output any English translations, internal thoughts, explanations, or commentary. Never output "Is this translated as.." or "The next question is..".
- Keep the reply strictly to 1 or 2 sentences max.

Conversation History:
{history_text}

Current User message: "{text}"
Final Native Response:"""
                    response = client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[
                            {"role": "system", "content": "You are a brief, empathetic triage companion."},
                            {"role": "user", "content": prompt}
                        ]
                    )
                    reply_text = response.choices[0].message.content.strip()
                except Exception as e:
                    print(f"Error generating AI reply: {e}")
                    reply_text = f"Sorry, I am having trouble connecting to my companion core. (Debug: {str(e)})"
            else:
                reply_text = "Please add a GROQ_API_KEY to the backend .env file so I can reply properly."

            audio_b64 = None
            if reply_text and not reply_text.startswith("Sorry,"):
                try:
                    # Determine tts language
                    tts_lang = "ml" if "ml" in user_language.lower() else "en"
                    tts = gTTS(text=reply_text, lang=tts_lang)
                    fp = io.BytesIO()
                    tts.write_to_fp(fp)
                    fp.seek(0)
                    audio_b64 = base64.b64encode(fp.read()).decode('utf-8')
                except Exception as e:
                    print(f"Error generating TTS audio: {e}")

            # 🔥 Save to MongoDB
            log_entry = {
                "text": text,
                "reply": reply_text,
                "audio_b64": audio_b64, # Save audio if needed, or omit to save DB space. Omiting to save space.
                "language": user_language,
                "timestamp": datetime.now(timezone.utc),
                "user_id": current_user['user_id']
            }
            logs_collection.insert_one(log_entry)

            return jsonify({'text': text, 'reply': reply_text, 'audio_b64': audio_b64})
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
    app.run(debug=True, use_reloader=False, port=5000)
