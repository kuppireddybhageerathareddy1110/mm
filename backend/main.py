import csv
import os
from collections import Counter
from datetime import datetime, timedelta
from io import StringIO
from typing import Any

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, Field
from pymongo import MongoClient

try:
    from lime.lime_text import LimeTextExplainer
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import make_pipeline
    HAS_LIME = True
except ImportError:
    HAS_LIME = False

from textblob import TextBlob
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

mongo_uri = os.getenv("MONGODB_URI")
client = MongoClient(mongo_uri) if mongo_uri else None
db = client["sentimentDB"] if client is not None else None
results_collection = db["results"] if db is not None else None
users_collection = db["users"] if db is not None else None

app = FastAPI(title="Sentiment Studio API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_ORIGIN,
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:3000",
        "http://localhost:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class AnalyzePayload(BaseModel):
    text: str = Field(min_length=1, max_length=10000)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    is_admin: bool


def ensure_database() -> None:
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is not configured. Set MONGODB_URI in .env.",
        )


def serialize_result(result: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(result["_id"]),
        "text": result.get("text", ""),
        "polarity": result.get("polarity", 0),
        "sentiment": result.get("sentiment", "Neutral"),
        "confidence": result.get("confidence", 0),
        "negative_words": result.get("negative_words", []),
        "lime_html": result.get("lime_html"),
        "user": result.get("user"),
        "created_at": result.get("created_at", datetime.utcnow()).isoformat(),
    }


def create_access_token(email: str) -> str:
    expires = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": email, "exp": expires}, SECRET_KEY, algorithm=ALGORITHM)


def current_user(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return email


def require_admin(email: str = Depends(current_user)) -> str:
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return email


def sentiment_for_text(text: str) -> dict[str, Any]:
    blob = TextBlob(text)
    polarity = round(blob.sentiment.polarity, 2)
    sentiment = "Positive" if polarity > 0 else "Negative" if polarity < 0 else "Neutral"
    confidence = round(abs(polarity) * 100)
    negative_words = [word.lower() for word in blob.words if TextBlob(word).sentiment.polarity < 0] if polarity < 0 else []
    return {
        "polarity": polarity,
        "sentiment": sentiment,
        "confidence": confidence,
        "negative_words": negative_words,
    }


def lime_explanation(text: str, email: str) -> str:
    if not HAS_LIME:
        return (
            "<div style='padding: 12px; background: rgba(243, 156, 18, 0.1); border: 1px solid #f39c12; border-radius: 6px; color: #f39c12; font-family: sans-serif; font-size: 14px; line-height: 1.5;'>"
            "<strong>LIME Explanation Unavailable:</strong> The <code>scikit-learn</code> and <code>lime</code> packages are not "
            "installed in this environment (this is expected when using Python 3.14 without a C++ compiler). "
            "The core sentiment scoring and history features remain fully functional!"
            "</div>"
        )
    ensure_database()
    sample_texts = [row["text"] for row in results_collection.find({"user": email}).limit(50)]
    if len(sample_texts) < 3:
        sample_texts = [
            "I love this product",
            "I hate this experience",
            "It is okay, nothing special",
        ]

    sample_labels = [
        1 if TextBlob(item).sentiment.polarity > 0 else -1 if TextBlob(item).sentiment.polarity < 0 else 0
        for item in sample_texts
    ]

    if len(set(sample_labels)) < 2:
        return "<p>Not enough diverse sentiment history to generate an explanation yet.</p>"

    pipeline = make_pipeline(TfidfVectorizer(), LogisticRegression(max_iter=1000))
    pipeline.fit(sample_texts, sample_labels)
    explainer = LimeTextExplainer(class_names=["Negative", "Neutral", "Positive"])
    return explainer.explain_instance(text, pipeline.predict_proba, num_features=10).as_html()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=TokenResponse)
def register(payload: UserPayload) -> TokenResponse:
    ensure_database()
    email = payload.email.lower()
    if users_collection.find_one({"email": email}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    users_collection.insert_one({"email": email, "password": generate_password_hash(payload.password)})
    return TokenResponse(access_token=create_access_token(email), email=email, is_admin=email == ADMIN_EMAIL)


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: UserPayload) -> TokenResponse:
    ensure_database()
    email = payload.email.lower()
    user = users_collection.find_one({"email": email})
    if not user or not check_password_hash(user["password"], payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login failed")
    return TokenResponse(access_token=create_access_token(email), email=email, is_admin=email == ADMIN_EMAIL)


@app.get("/api/me")
def me(email: str = Depends(current_user)) -> dict[str, Any]:
    return {"email": email, "is_admin": email == ADMIN_EMAIL}


@app.post("/api/analyze")
def analyze(payload: AnalyzePayload, email: str = Depends(current_user)) -> dict[str, Any]:
    ensure_database()
    text = payload.text.strip()
    metrics = sentiment_for_text(text)
    explanation = lime_explanation(text, email)
    document = {
        "text": text,
        **metrics,
        "lime_html": explanation,
        "user": email,
        "created_at": datetime.utcnow(),
    }
    inserted = results_collection.insert_one(document)
    document["_id"] = inserted.inserted_id
    return serialize_result(document)


@app.get("/api/history")
def history(
    email: str = Depends(current_user),
    limit: int = Query(10, ge=1, le=100),
    sort_by: str = "recent",
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    ensure_database()
    query: dict[str, Any] = {"user": email}
    if start_date and end_date:
        query["created_at"] = {
            "$gte": datetime.strptime(start_date, "%Y-%m-%d"),
            "$lte": datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59),
        }

    cursor = results_collection.find(query)
    if sort_by == "polarity":
        cursor = cursor.sort("polarity", -1)
    elif sort_by == "sentiment":
        cursor = cursor.sort("sentiment", 1)
    else:
        cursor = cursor.sort("_id", -1)

    rows = [serialize_result(row) for row in cursor.limit(limit)]
    counts = Counter(row["sentiment"] for row in rows)
    return {"results": rows, "summary": dict(counts)}


@app.delete("/api/history/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_result(result_id: str, email: str = Depends(current_user)) -> Response:
    ensure_database()
    results_collection.delete_one({"_id": ObjectId(result_id), "user": email})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/export.csv")
def export_csv(email: str = Depends(current_user)) -> Response:
    ensure_database()
    csv_file = StringIO()
    writer = csv.writer(csv_file)
    writer.writerow(["Text", "Polarity", "Sentiment", "Confidence"])
    for row in results_collection.find({"user": email}).sort("_id", -1):
        writer.writerow([row.get("text", ""), row.get("polarity", ""), row.get("sentiment", ""), row.get("confidence", "")])
    return Response(
        content=csv_file.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentiment_history.csv"},
    )


@app.get("/api/admin/results")
def admin_results(_: str = Depends(require_admin)) -> dict[str, Any]:
    ensure_database()
    rows = [serialize_result(row) for row in results_collection.find().sort("_id", -1).limit(250)]
    return {"results": rows}


@app.delete("/api/admin/results/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete(result_id: str, _: str = Depends(require_admin)) -> Response:
    ensure_database()
    results_collection.delete_one({"_id": ObjectId(result_id)})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
