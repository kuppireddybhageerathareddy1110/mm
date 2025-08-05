import os
import csv
from io import StringIO
from datetime import datetime
from collections import Counter
from textblob import TextBlob
from lime.lime_text import LimeTextExplainer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from flask import Flask, render_template, request, redirect, url_for, session, abort, Response
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

# MongoDB connection
mongo_uri = os.getenv("MONGODB_URI")
client = MongoClient(mongo_uri)
db = client["sentimentDB"]
collection = db["results"]
users = db["users"]
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

@app.context_processor
def inject_admin_email():
    return dict(admin_email=ADMIN_EMAIL)

@app.route('/', methods=['GET', 'POST'])
def index():
    if 'user' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        try:
            text = request.form['text']
            blob = TextBlob(text)
            polarity = round(blob.sentiment.polarity, 2)
            sentiment = 'Positive' if polarity > 0 else 'Negative' if polarity < 0 else 'Neutral'
            confidence = round(abs(polarity) * 100)

            negative_words = [
                word.lower()
                for word in blob.words
                if TextBlob(word).sentiment.polarity < 0
            ] if polarity < 0 else []

            # LIME explanation setup
            explainer = LimeTextExplainer(class_names=["Negative", "Neutral", "Positive"])
            sample_texts = [r['text'] for r in collection.find({'user': session['user']}).limit(50)]
            if not sample_texts:
                sample_texts = ["I love this!", "I hate this!", "It's okay."]
            sample_labels = [
                1 if TextBlob(t).sentiment.polarity > 0 else -1 if TextBlob(t).sentiment.polarity < 0 else 0
                for t in sample_texts
            ]
            pipeline = make_pipeline(TfidfVectorizer(), LogisticRegression(max_iter=1000))
            pipeline.fit(sample_texts, sample_labels)

            exp = explainer.explain_instance(text, pipeline.predict_proba, num_features=10)
            lime_html = exp.as_html()

            # Insert into MongoDB
            collection.insert_one({
                'text': text,
                'polarity': polarity,
                'sentiment': sentiment,
                'confidence': confidence,
                'negative_words': negative_words,
                'created_at': datetime.utcnow(),
                'user': session['user'],
                'lime_html': lime_html
            })

            return render_template('results.html', text=text, polarity=polarity,
                                   sentiment=sentiment, confidence=confidence,
                                   negative_words=negative_words, user=session['user'],
                                   lime_html=lime_html)

        except Exception as e:
            app.logger.error("Error in index POST: %s", str(e))
            return "Server Error", 500

    return render_template('index.html', user=session['user'])

@app.route('/history', methods=['GET', 'POST'])
def history():
    if 'user' not in session:
        return redirect(url_for('login'))

    limit = int(request.form.get("limit", 10))
    chart_type = request.form.get("chart", "bar")
    sort_by = request.form.get("sort_by", "default")
    start_date = request.form.get("start_date", "")
    end_date = request.form.get("end_date", "")

    query = {"user": session['user']}

    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        query['created_at'] = {"$gte": start, "$lte": end}

    cursor = collection.find(query)

    if sort_by == "polarity":
        cursor = cursor.sort("polarity", -1)
    elif sort_by == "sentiment":
        cursor = cursor.sort("sentiment", 1)
    else:
        cursor = cursor.sort("_id", -1)

    results = list(cursor.limit(limit))
    sentiment_counts = Counter([r['sentiment'] for r in results])
    labels = list(sentiment_counts.keys())
    values = list(sentiment_counts.values())

    return render_template("history.html", results=results, labels=labels, values=values,
                           chart_type=chart_type, limit=limit, sort_by=sort_by,
                           start_date=start_date, end_date=end_date, user=session['user'])

@app.route('/delete/<id>', methods=['POST'])
def delete(id):
    if 'user' not in session:
        return redirect(url_for('login'))
    collection.delete_one({'_id': ObjectId(id), 'user': session['user']})
    return redirect(url_for('history'))

@app.route('/export_csv')
def export_csv():
    if 'user' not in session:
        return redirect(url_for('login'))
    results = list(collection.find({'user': session['user']}).sort('_id', -1))
    csv_file = StringIO()
    writer = csv.writer(csv_file)
    writer.writerow(["Text", "Polarity", "Sentiment", "Confidence"])
    for r in results:
        writer.writerow([r.get('text', ''), r.get('polarity', ''), r.get('sentiment', ''), r.get('confidence', '')])
    csv_file.seek(0)
    return Response(csv_file.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=sentiment_history.csv"})

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = generate_password_hash(request.form['password'])
        if users.find_one({'email': email}):
            return "Email already exists."
        users.insert_one({'email': email, 'password': password})
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = users.find_one({'email': email})
        if user and check_password_hash(user['password'], password):
            session['user'] = email
            return redirect(url_for('admin_dashboard') if email == ADMIN_EMAIL else url_for('index'))
        return "Login failed", 401
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

@app.route('/admin')
def admin_dashboard():
    if 'user' not in session or session['user'] != ADMIN_EMAIL:
        return abort(403)
    results = list(collection.find().sort('_id', -1))
    return render_template("admin.html", results=results, user=session['user'])

@app.route('/admin/delete/<id>', methods=['POST'])
def admin_delete(id):
    if 'user' not in session or session['user'] != ADMIN_EMAIL:
        return abort(403)
    collection.delete_one({'_id': ObjectId(id)})
    return redirect(url_for('admin_dashboard'))

# Required for Vercel
def handler(event, context):
    return app

# Local
if __name__ == '__main__':
    app.run(debug=True)
