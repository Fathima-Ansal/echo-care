# EchoCare – Voice-Based Health Diary

## 📌 Project Overview

EchoCare is a **voice-based health diary system** designed to help elderly users record their daily health conditions easily using **voice input instead of typing**. The system converts spoken updates into text, analyzes them using **Natural Language Processing (NLP)**, and stores the records securely for future monitoring.

---

## ❗ Problem Statement

Many elderly individuals find it difficult to type daily health updates due to age-related challenges such as poor eyesight, limited motor skills, or unfamiliarity with digital devices. As a result, regular health tracking becomes inconvenient and inconsistent.

---

## 💡 Proposed Solution

EchoCare allows users to **speak their health updates**, which are then:

* Converted to text using **Speech-to-Text**
* Analyzed to detect **symptoms and emotional indicators**
* Stored securely in a database
* Monitored by caregivers through alerts and dashboards

This makes health logging **simple, accessible, and efficient**.

---

## ⚙️ Tech Stack

### Backend

* **Python**
* **FastAPI**
* Speech-to-Text (Whisper / Google Speech API)
* NLP (spaCy / NLTK)

### Database & Authentication

* **MongoDB** – Health data storage
* **Firebase Authentication** – Secure user login

### Frontend

* **React** or **Flutter**

---

## 🧠 System Architecture

1. User logs in using **Firebase Authentication**
2. User records health updates through voice
3. Voice is converted to text using Speech-to-Text
4. NLP analyzes text for symptoms and emotions
5. Processed data is stored in **MongoDB**
6. Alerts are generated for caregivers if unusual patterns are detected

---

## ✨ Features

* Voice-based health logging
* Secure authentication using Firebase
* Symptom and emotion detection using NLP
* MongoDB-based health record storage
* Caregiver alerts for repeated symptoms
* Simple and user-friendly interface

---

## 📂 Project Structure

```
EchoCare/
│
├── backend/
│   ├── main.py
│   ├── auth/
│   │   └── firebase_auth.py
│   ├── db/
│   │   └── mongodb.py
│   ├── services/
│   │   ├── speech_to_text.py
│   │   └── nlp_analysis.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   └── firebase.js
│
├── models/
├── dataset/
├── README.md
└── .gitignore
```

## 🚀 How to Run the Project

### Backend

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
npm install
npm start
```

---

## 🔐 Security & Privacy

* Firebase handles secure authentication
* MongoDB stores only necessary health data
* Sensitive credentials are protected using environment variables
* `.gitignore` prevents secrets from being uploaded

---

## 🎓 Academic Relevance

This project integrates:

* Machine Learning
* Natural Language Processing
* Cloud Authentication
* NoSQL Databases

It demonstrates real-world application of **AI in healthcare monitoring**.

---

## 🔮 Future Enhancements

* Multilingual voice support
* Emergency alert integration
* Mobile health analytics dashboard
* Advanced ML-based health trend prediction

---

## 👩‍💻 Team Members

* **Fathima A**
* Alka Roy
* Deva Krishna R
* Jalwa Jabbar

**Guide:** Prof. Kavitha N

---

## 📜 License

This project is developed for **academic purposes only**.

