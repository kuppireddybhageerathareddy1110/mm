
# utils/email.py
import smtplib
from email.mime.text import MIMEText
from flask import url_for

def send_reset_email(to_email, token):
    reset_link = url_for('reset_password', token=token, _external=True)
    body = f"Click the link to reset your password: {reset_link}"
    msg = MIMEText(body)
    msg['Subject'] = 'Password Reset Request'
    msg['From'] = 'noreply@example.com'
    msg['To'] = to_email

    # Simulated (print) or configure SMTP below
    print(f"Simulated email to {to_email}:\n{body}")
    # Example for real email:
    # with smtplib.SMTP('smtp.gmail.com', 587) as server:
    #     server.starttls()
    #     server.login('your_email', 'your_password')
    #     server.sendmail(msg['From'], [msg['To']], msg.as_string())

