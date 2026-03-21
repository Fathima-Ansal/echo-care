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
- You MUST reply in the EXACT SAME LANGUAGE as the user! (e.g., if the user speaks Hindi, reply in Hindi script; if Malayalam, reply in Malayalam script; etc.).

CRITICAL JSON OUTPUT REQUIRED:
You must output a strictly valid JSON object. Do NOT output markdown, explanations, or plain text outside the JSON.
The JSON must have EXACTLY these two keys:
1. "reply": Your direct conversational response (in the exact same language as the user), limited to 1 or 2 sentences max.
2. "sentiment": Analyze the "Current User message" and provide exactly one of these words: "Positive", "Neutral", or "Negative".

Conversation History:
{history_text}

Current User message: "{text}"
Final JSON Output:"""
                    response = client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[
                            {"role": "system", "content": "You are a brief, empathetic triage companion. You only respond in JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        response_format={"type": "json_object"}
                    )
                    import json
                    try:
                        reply_json = json.loads(response.choices[0].message.content.strip())
                        reply_text = reply_json.get("reply", "")
                        sentiment_result = reply_json.get("sentiment", "Neutral")
                    except Exception as e:
                        print(f"Error parsing JSON from Groq: {e}")
                        reply_text = response.choices[0].message.content.strip()
                        sentiment_result = "Neutral"
                except Exception as e:
                    print(f"Error generating AI reply: {e}")
                    reply_text = f"Sorry, I am having trouble connecting to my companion core. (Debug: {str(e)})"
                    sentiment_result = "Neutral"
            else:
                reply_text = "Please add a GROQ_API_KEY to the backend .env file so I can reply properly."
                sentiment_result = "Neutral"

            audio_b64 = None
            if reply_text and not reply_text.startswith("Sorry,"):
                try:
                    # Determine tts language
                    tts_lang = user_language.split('-')[0].lower()
                    tts = gTTS(text=reply_text, lang=tts_lang)
                    fp = io.BytesIO()
                    tts.write_to_fp(fp)
                    fp.seek(0)
                    audio_b64 = base64.b64encode(fp.read()).decode('utf-8')
                except Exception as e:
                    print(f"Error generating TTS audio: {e}")

            # 🧠 Hume AI Acoustic Emotion Recognition
            hume_api_key = os.environ.get("HUME_API_KEY")
            if hume_api_key and "your_key_here" not in hume_api_key:
                try:
                    from hume import HumeBatchClient
                    from hume.models.config import ProsodyConfig
                    print("Sending audio to Hume AI for prosody detection...")
                    hume_client = HumeBatchClient(hume_api_key)
                    job = hume_client.submit_job([], [ProsodyConfig()], files=[filepath])
                    job.await_complete()
                    predictions = job.get_predictions()
                    
                    if predictions and len(predictions) > 0:
                        try:
                            emotions_list = predictions[0]['results']['predictions'][0]['models']['prosody']['grouped_predictions'][0]['predictions'][0]['emotions']
                            emotions_list.sort(key=lambda x: x['score'], reverse=True)
                            top_emotion = emotions_list[0]['name']
                            top_score = emotions_list[0]['score']
                            print(f"Hume Top Acoustic Emotion: {top_emotion} ({top_score:.2f})")
                            
                            negative_markers = ["Pain", "Distress", "Sadness", "Anxiety", "Fear", "Disappointment", "Anger", "Horror", "Tiredness"]
                            positive_markers = ["Joy", "Amusement", "Excitement", "Triumph", "Relief", "Awe", "Admiration"]
                            
                            if top_emotion in negative_markers and top_score > 0.3:
                                sentiment_result = "Negative"
                                print("--> Acoustic Overridden: Negative")
                            elif top_emotion in positive_markers and top_score > 0.4:
                                sentiment_result = "Positive"
                                print("--> Acoustic Overridden: Positive")
                        except Exception as parse_e:
                            print(f"Error parsing Hume results: {parse_e}")
                except Exception as e:
                    print(f"Hume AI processing failed: {e}")


            # 🔥 Save to MongoDB
            log_entry = {
                "text": text,
                "reply": reply_text,
                "sentiment": sentiment_result,
                "audio_b64": audio_b64, # Save audio if needed, or omit to save DB space. Omiting to save space.
                "language": user_language,
                "timestamp": datetime.now(timezone.utc),
                "user_id": current_user['user_id']
            }
            logs_collection.insert_one(log_entry)

            return jsonify({'text': text, 'reply': reply_text, 'sentiment': sentiment_result, 'audio_b64': audio_b64})
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
