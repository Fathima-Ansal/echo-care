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
import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
otps_collection = db["otps"]         # OTPs collection

# ---------------------------------------------------- #

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def send_otp_email(to_email, otp):
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_email = os.environ.get('SMTP_EMAIL')
    smtp_password = os.environ.get('SMTP_PASSWORD')

    if not smtp_email or not smtp_password:
        print("SMTP credentials not configured. OTP:", otp)
        return False

    msg = MIMEMultipart()
    msg['From'] = smtp_email
    msg['To'] = to_email
    msg['Subject'] = "Your EchoCare Verification Code"
    
    body = f"Welcome to EchoCare! Your verification code is: {otp}\nThis code will expire in 10 minutes."
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    if not data or 'email' not in data or 'otp' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
        
    email = data['email']
    otp = data['otp']
    
    otp_record = otps_collection.find_one({'email': email, 'otp': otp})
    if not otp_record:
        return jsonify({'error': 'Invalid or expired OTP'}), 400
        
    if datetime.utcnow() > otp_record['expires_at']:
        otps_collection.delete_one({'_id': otp_record['_id']})
        return jsonify({'error': 'OTP has expired'}), 400
        
    # Create the user officially now that they are verified
    if not users_collection.find_one({'email': email}):
        new_user = {
            'email': email,
            'password': otp_record.get('password', ''), # Handle legacy OTPs just in case
            'role': otp_record.get('role', 'caregiver'),
            'created_at': datetime.utcnow(),
            'is_verified': True
        }
        
        # Add optional elderly fields if they exist in the OTP record
        if 'caregiver_id' in otp_record:
            new_user['caregiver_id'] = otp_record['caregiver_id']
        if 'preferred_language' in otp_record:
            new_user['preferred_language'] = otp_record['preferred_language']
            
        users_collection.insert_one(new_user)
        
    otps_collection.delete_one({'_id': otp_record['_id']})
    
    return jsonify({'message': 'Email verified successfully'}), 200

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
    
    # Generate 6-digit OTP
    otp = ''.join(random.choices(string.digits, k=6))
    
    # Hold user data temporarily in OTP collection (expire in 10 mins)
    otps_collection.update_one(
        {'email': email},
        {'$set': {
            'otp': otp,
            'password': hashed_password.decode('utf-8'),
            'role': role,
            'expires_at': datetime.utcnow() + timedelta(minutes=10)
        }},
        upsert=True
    )
    
    # Send email
    send_otp_email(email, otp)
    
    return jsonify({'message': 'Registration successful. Please verify your email with the OTP sent.', 'requires_otp': True}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
        
    user = users_collection.find_one({'email': data['email']})
    
    if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Invalid email or password'}), 401
        
    if user.get('is_verified') is False:
        return jsonify({'error': 'Email not verified. Please verify your OTP.'}), 403
        
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

    # Generate 6-digit OTP
    otp = ''.join(random.choices(string.digits, k=6))
    
    # Hold user data temporarily in OTP collection
    otps_collection.update_one(
        {'email': email},
        {'$set': {
            'otp': otp,
            'password': hashed_password.decode('utf-8'),
            'role': 'elderly',
            'preferred_language': preferred_language,
            'caregiver_id': current_user['user_id'],
            'expires_at': datetime.utcnow() + timedelta(minutes=10)
        }},
        upsert=True
    )
    
    # Send email
    send_otp_email(email, otp)

    return jsonify({'message': 'Elderly user created. OTP verification required.', 'requires_otp': True}), 201


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
                    prompt_template = """
You are a caring, human-like AI health companion for elderly users. 
Your goal is to have a natural, empathetic conversation while keeping an eye on their health.

CONVERSATIONAL GUIDELINES:
1. **Be Human**: Do not sound like a robot. Use warm, caring language. Acknowledge what the user said before asking any questions.
2. **Sentiment-First Response**:
   - If the user is in pain, distressed, or urgent (e.g., "help me", "pain is bad"), focus ENTIRELY on reassurance and safety. 
   - Say things like: "I'm so sorry you're going through this. Please take a deep breath. I'm here. If it's very bad, please press the red SOS button so your caretaker can help immediately."
   - DO NOT ask triage questions in urgent situations.
3. **Natural Triage**:
   - For routine updates, naturally try to find out: how long it's been happening, where it hurts, and if they've taken medicine.
   - Ask only ONE thing at a time. Do not use lists like a), b), c). 
   - Example: "That sounds uncomfortable. How long has that been bothering you?"

STRICT RULES:
- Reply in the EXACT SAME LANGUAGE as the user!
- Limit reply to 1-2 natural sentences.
- NEVER repeat a question you've already asked in the history.
- Maximum 3 total questions per conversation.

CRITICAL JSON OUTPUT:
Return ONLY a JSON object:
{
  "reply": "Your natural human response",
  "sentiment": "Positive" or "Neutral" or "Negative"
}

Conversation History:
{history_text}

Current User message: "{user_text}"
Final JSON Output:"""
                    prompt = prompt_template.replace("{history_text}", history_text).replace("{user_text}", text)
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
                    # Note: Hume SDK v0.3.0 does not support direct local file submission via submit_job.
                    # We skip this for now to avoid the 'unexpected keyword argument files' error.
                    try:
                        job = hume_client.submit_job([], [ProsodyConfig()]) # No files argument in 0.3.0
                        job.await_complete()
                        predictions = job.get_predictions()
                        
                        if predictions and len(predictions) > 0:
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
                    except Exception as e:
                        print(f"Hume AI processing failed or skipped: {e}")
                except Exception as e:
                    print(f"Hume API connection or SDK error: {e}")


            # 🔥 Save to MongoDB
            log_entry = {
                "text": text,
                "reply": reply_text,
                "sentiment": sentiment_result,
                "audio_b64": audio_b64,
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
            for log in logs:
                log["elderly_name"] = current_user.get("email", "You")
        elif current_user['role'] == 'caregiver':
            # Get elderly users tied to this caregiver
            elderly_users = list(users_collection.find({"caregiver_id": current_user["user_id"]}))
            elderly_ids = [str(u["_id"]) for u in elderly_users]
            elderly_map = {str(u["_id"]): u.get("email", "Unknown") for u in elderly_users}
            
            # Fetch logs for these elderly users
            logs = list(logs_collection.find({"user_id": {"$in": elderly_ids}}).sort("timestamp", -1))
            for log in logs:
                log["elderly_name"] = elderly_map.get(str(log.get("user_id")), "Unknown User")
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

@app.route('/api/caretaker/profile', methods=['POST'])
@token_required
def update_caretaker_profile(current_user):
    if current_user['role'] != 'caregiver':
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    phone_number = data.get('phone_number')

    if not phone_number:
        return jsonify({'error': 'Phone number is required'}), 400

    from bson import ObjectId
    users_collection.update_one(
        {'_id': ObjectId(current_user['user_id'])},
        {'$set': {'phone_number': phone_number}}
    )
    
    return jsonify({'message': 'Profile updated successfully', 'phone_number': phone_number}), 200

@app.route('/api/sos', methods=['POST'])
@token_required
def trigger_sos(current_user):
    if current_user['role'] != 'elderly':
        return jsonify({'error': 'Only elderly users can trigger SOS'}), 403

    from bson import ObjectId
    elderly_user = users_collection.find_one({'_id': ObjectId(current_user['user_id'])})
    if not elderly_user or not elderly_user.get('caregiver_id'):
        return jsonify({'error': 'No associated caregiver found'}), 404

    caregiver = users_collection.find_one({'_id': ObjectId(elderly_user['caregiver_id'])})
    if not caregiver or not caregiver.get('phone_number'):
        return jsonify({'error': 'Caregiver does not have a registered phone number'}), 404

    to_number = caregiver['phone_number']
    
    # Twilio integration
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    twilio_number = os.environ.get('TWILIO_PHONE_NUMBER')

    if not all([account_sid, auth_token, twilio_number]):
         # We still return success for UI purposes if config is missing, but log error
         print("❌ Error: Missing Twilio credentials in your .env file.")
         return jsonify({'error': 'Twilio is not configured on the server. Please add credentials to .env.'}), 500

    from twilio.rest import Client
    try:
        client = Client(account_sid, auth_token)
        call = client.calls.create(
            twiml='<Response><Pause length="1"/><Say voice="alice">Emergency SOS has been triggered by an EchoCare user. Please check your dashboard immediately.</Say><Pause length="2"/><Say voice="alice">I repeat. Emergency SOS has been triggered. Please check your dashboard.</Say></Response>',
            to=to_number,
            from_=twilio_number
        )
        print(f"✅ Call successfully initiated to {to_number}! Call SID: {call.sid}")
        return jsonify({'message': 'SOS call initiated successfully'}), 200
    except Exception as e:
        print(f"❌ Failed to place Twilio call: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, use_reloader=False, port=5000)
