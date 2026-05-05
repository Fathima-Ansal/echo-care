import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

def test_send():
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_email = os.environ.get('SMTP_EMAIL')
    smtp_password = os.environ.get('SMTP_PASSWORD')

    print(f"Server: {smtp_server}:{smtp_port}")
    print(f"Email: {smtp_email}")
    print(f"Pass Length: {len(smtp_password) if smtp_password else 0}")

    msg = MIMEMultipart()
    msg['From'] = smtp_email
    msg['To'] = smtp_email # send to self to test
    msg['Subject'] = "EchoCare Test Email"
    msg.attach(MIMEText("Test email content", 'plain'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.set_debuglevel(1)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
        print("EMAIL SENT SUCCESSFULLY!")
    except Exception as e:
        print(f"EMAIL FAILED: {e}")

if __name__ == '__main__':
    test_send()
