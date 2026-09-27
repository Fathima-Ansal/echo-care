# EchoCare – Voice-Based Health Diary & AI-Powered Conversational Triage

EchoCare is an empathetic, voice-based health tracking system designed for elderly users who find typing updates challenging due to age-related impairments (such as poor eyesight, motor control loss, or unfamiliarity with digital screens). EchoCare accepts spoken health updates, transcribes them, performs AI-powered conversational triage and sentiment analysis, and keeps caregivers notified in real-time with automatic emergency escalation (via phone calls).

---

## ❗ Problem Statement

Elderly individuals frequently face barriers when interacting with traditional text-based digital health logs. Age-related limitations like poor eyesight, joint pain, or reduced motor coordination make keyboard entry slow, frustrating, and prone to errors. As a result, consistent health tracking is compromised, leading to missed warnings or delayed medical intervention.

---

## 💡 Solution: Voice-First Health Companion

EchoCare solves this by replacing manual typing with a natural voice interaction loop:
* **Voice-Based Input**: Users speak in their preferred language (e.g., Malayalam).
* **Automatic Transcription**: Spoken updates are transcribed into text instantly.
* **Empathetic Conversational Triage**: An AI companion responds in 1–2 caring sentences in the user's native language, using history-aware prompts to keep tracking natural.
* **Multimodal Sentiment Tracking**: The system cross-analyzes the text's semantic meaning and the acoustic emotion (prosody) of the speaker's voice to classify overall state.
* **Caregiver Portal & Real-time Alerts**: Caregivers are notified instantly of critical updates via visual/acoustic dashboard alerts and automated emergency phone calls if the SOS button is triggered.

---

## ⚙️ Real Implemented Tech Stack

Unlike generic templates, the codebase is fully developed with the following technologies:

### 1. Frontend
* **React 19** & **Vite**: Rapid, high-performance UI rendering and dev workflow.
* **Tailwind CSS v4**: Modern, responsive utility styling.
* **Framer Motion**: Smooth micro-animations for buttons and dialogs.
* **Lucide React**: Clean vector-based icons.
* **React Router DOM v7**: Client-side routing.
* **Print-to-PDF Engine**: Utilizes custom CSS printing rules (`window.print()`) to generate beautifully structured caregiver PDF health reports without layout breaking.

### 2. Backend
* **Python** & **Flask**: Lightweight web framework with `Flask-CORS` for cross-origin requests.
* **PyJWT**: Token-based security structure for authentication.
* **Bcrypt**: Secure, salted password hashing for database storage.

### 3. Speech, AI & Communication APIs
* **SpeechRecognition** & **Pydub**: Audio file ingest and Google Web Speech API interface (with automated `.wav` conversion supported by `ffmpeg`).
* **Groq API** (`llama-3.3-70b-versatile`): Generates brief, context-aware triage replies and performs text-based sentiment analysis.
* **gTTS (Google Text-to-Speech)**: Synthesizes the AI companion's reply into a localized spoken audio file (passed to the frontend as a Base64 stream).
* **Hume AI SDK** (Prosody Config): Acoustic emotion recognition that analyzes the pitch and tone of the audio. If markers like pain, distress, sadness, or anxiety are detected with high confidence, it overrides the text-based sentiment to **Negative (Critical)**.
* **Twilio API**: Placed in the backend to trigger real-world emergency phone calls to the caregiver when the elderly user initiates an SOS.

### 4. Database
* **MongoDB Atlas** (using `pymongo` driver): Cloud-hosted NoSQL storage for user credentials and conversation logs.

---

## 🧠 Core AI Conversational Triage Logic

The system utilizes custom-built conversational triage rules implemented via Groq:
1. **Empathetic & Human-like Tone**: The AI does not sound like a robot; it acknowledges user feelings before asking questions.
2. **Sentiment-First Safety**: If a user is in severe pain or distress (e.g., *"I need help"*), the AI stops asking triage questions and focuses entirely on reassurance and safety (instructing them to use the SOS button or contact their caretaker).
3. **Natural Multi-turn Triage**: For regular logs, it determines the **duration**, **location of pain/discomfort**, and **medication status** by asking exactly **one** natural question at a time (no bullet points or lists).
4. **Context & History Awareness**: Keeps track of the last 4 logs to avoid repeating questions already answered.
5. **Maximum Question Cap**: Limit of 3 questions per session to prevent exhausting the user.
6. **Native Language Continuity**: Replies in the exact same language (e.g., Malayalam, English) the user speaks.

---

## 📂 Project Structure

```
EchoCare/
├── backend/
│   ├── app.py                 # Core Flask backend server (JWT auth, APIs, Groq, Hume, Twilio)
│   ├── transcription.py       # Speech-to-Text conversion (SpeechRecognition + Pydub)
│   ├── requirements.txt       # Python backend dependencies
│   ├── .env                   # Configuration & Secret API keys (ignored by git)
│   ├── uploads/               # Temporary storage folder for audio processing
│   ├── api.py                 # (Mock FastAPI test script)
│   ├── check_db.py            # Utility script to inspect MongoDB collections
│   ├── check_logs.py          # Utility script to check logged records
│   └── seed_db.py             # Script to seed sample entries into MongoDB
│
├── frontend/
│   ├── package.json           # Frontend dependency declarations (Vite, React, Tailwind)
│   ├── vite.config.js         # Vite configuration mapping
│   ├── tailwind.config.js     # Tailwind setup parameters
│   ├── index.html             # Main entry point template
│   ├── src/
│   │   ├── main.jsx           # React app mount
│   │   ├── App.jsx            # Router and navigation definitions
│   │   ├── App.css            # Custom CSS configurations
│   │   ├── components/
│   │   │   ├── VoiceButton.jsx      # Animated recording micro-interaction component
│   │   │   ├── VoiceRecorder.jsx    # Audio streaming handler
│   │   │   └── MedicationItem.jsx   # List container for medical events
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Global JWT authentication context
│   │   │   └── ThemeContext.jsx     # Dark mode context toggle
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Welcome/Splash portal
│   │   │   ├── Login.jsx            # User sign-in page
│   │   │   ├── Register.jsx         # Caregiver self-registration page
│   │   │   ├── ElderlyDashboard.jsx # Voice-first dashboard for elderly logging & SOS
│   │   │   └── CaretakerDashboard.jsx # Caregiver analytics dashboard & PDF generator
│   │   ├── utils/
│   │   │   └── wavEncoder.js        # Helper to encode raw audio channels into WAV files
│   │   └── assets/
│   └── public/
└── README.md                  # Detailed project documentation
```

---

## 🛠️ Configuration & Environment Setup

Before running the project, create a `.env` file inside the `backend/` directory with the following variables:

```env
SECRET_KEY=your_jwt_secret_token_here
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key_here
HUME_API_KEY=your_hume_api_key_here
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_outgoing_phone_number_here
```

---

## 🚀 How to Run the Project

### 1. Prerequisites
Ensure you have `Python 3.10+` and `Node.js 18+` installed on your machine. You will also need **FFmpeg** installed and added to your system's PATH (to allow `Pydub` to convert audio formats).

### 2. Run the Backend
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the Flask development server
python app.py
```
The backend server will launch at `http://127.0.0.1:5000/`.

### 3. Run the Frontend
```bash
# Navigate to the frontend directory
cd frontend

# Install npm packages
npm install

# Run the Vite development server
npm run dev
```
The application will be accessible at `http://localhost:5173/` (or the port specified in your console).

---

## 🔒 Security & Data Privacy

* **Authentication**: Handled via secure JSON Web Tokens (JWT) signed with a server-side secret key.
* **Cryptographic Storage**: User passwords are encrypted with dynamic salt rounds using `bcrypt` before storing.
* **Environment Separation**: Secrets, API keys, and connection strings are isolated in the `.env` configuration file and blocked from Git using `.gitignore`.
* **Access Control**: Users are restricted by roles:
  * Caregivers cannot access the voice dashboard or speak health logs.
  * Elderly users cannot view other logs, create accounts, or edit phone numbers.

---

## 👩‍💻 Team & Academic Metadata

* **Team Members**: Fathima A, Alka Roy, Deva Krishna R, Jalwa Jabbar
* **Project Guide**: Prof. Kavitha N
* **License**: Developed for academic purposes only.
