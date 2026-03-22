import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
twilio_number = os.environ.get('TWILIO_PHONE_NUMBER')
to_number = os.environ.get('MY_PHONE_NUMBER')

def test_sos_call():
    if not all([account_sid, auth_token, twilio_number, to_number]):
        print("❌ Error: Missing Twilio credentials in your .env file.")
        print("Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and MY_PHONE_NUMBER.")
        return

    print(f"Dialing {to_number} from {twilio_number}...")
    
    try:
        client = Client(account_sid, auth_token)

        call = client.calls.create(
            # TwiML is the set of instructions you give Twilio when a call connects. 
            # In this case, we use <Say> to read text aloud using an automated voice.
            twiml='<Response><Say voice="alice">Emergency SOS has been triggered by an EchoCare user. Please check your dashboard immediately.</Say></Response>',
            to=to_number,
            from_=twilio_number
        )

        print(f"✅ Call successfully initiated! Call SID: {call.sid}")
        print("Your phone should be ringing in a few seconds.")
        
    except Exception as e:
        print(f"❌ Failed to place call: {e}")

if __name__ == "__main__":
    test_sos_call()
