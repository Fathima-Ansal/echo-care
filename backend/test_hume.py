import os
import json
from dotenv import load_dotenv

load_dotenv()

hume_api_key = os.environ.get("HUME_API_KEY")
if not hume_api_key:
    print("NO HUME_API_KEY FOUND IN .env")
    exit(1)

print("Testing Hume API Key auth...")
try:
    from hume import HumeBatchClient
    from hume.models.config import ProsodyConfig
    
    client = HumeBatchClient(hume_api_key)
    
    # Create a dummy tiny sound file (just an empty wav header to test if API accepts it, or we use a URL)
    # Actually, let's use a public Hume sample URL to test the batch client cleanly!
    test_url = "https://hume-tutorials.s3.amazonaws.com/prosody/01-audio.wav"
    
    print(f"Submitting job with test audio: {test_url}")
    job = client.submit_job(urls=[test_url], configs=[ProsodyConfig()])
    print(f"Waiting for job {job.id} to complete...")
    job.await_complete()
    predictions = job.get_predictions()
    
    print("\nGot Predictions!")
    emotions = predictions[0]['results']['predictions'][0]['models']['prosody']['grouped_predictions'][0]['predictions'][0]['emotions']
    emotions.sort(key=lambda x: x['score'], reverse=True)
    top_emotion = emotions[0]['name']
    top_score = emotions[0]['score']
    
    print(f"SUCCESS! Top emotion detected: {top_emotion} ({top_score:.2f})")
except Exception as e:
    print(f"HUME TEST FAILED: {str(e)}")
