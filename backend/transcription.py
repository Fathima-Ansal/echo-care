import speech_recognition as sr
from pydub import AudioSegment
import os

def transcribe_audio(audio_file_path, language='ml-IN'):
    """
    Transcribes audio file to text using Google Speech Recognition.
    
    Args:
        audio_file_path (str): Path to the audio file.
        language (str): Language code (default: 'ml-IN' for Malayalam).
        
    Returns:
        str: Transcribed text or None if failed.
    """
    recognizer = sr.Recognizer()
    
    converted_path = None
    
    if not audio_file_path.endswith('.wav'):
        try:
            audio = AudioSegment.from_file(audio_file_path)
            wav_path = audio_file_path + ".wav"
            audio.export(wav_path, format="wav")
            audio_file_path = wav_path
            converted_path = wav_path
        except Exception as e:
            print(f"Error converting audio: {e}")
            return None

    try:
        with sr.AudioFile(audio_file_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data, language=language)
            return text
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand audio")
        return None
    except sr.RequestError as e:
        print(f"Could not request results from Google Speech Recognition service; {e}")
        return None
    finally:
        if converted_path and os.path.exists(converted_path):
            os.remove(converted_path)
