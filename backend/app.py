from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import secrets
from transcription import transcribe_audio

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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
            return jsonify({'text': text})
        else:
            return jsonify({'error': 'Could not transcribe audio'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        # Cleanup uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)
        # cleanup converted wav if exists (handled in transcription.py ideally, but simplified here)

@app.route('/')
def home():
    return "EchoCare Backend is Running!"

if __name__ == '__main__':
    app.run(debug=True, port=5000)
