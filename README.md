# Sentiment Studio

Sentiment Studio is a Next.js + FastAPI rewrite of the original Flask sentiment analysis app. It keeps the core product behavior: user accounts, TextBlob sentiment scoring, LIME explanations, MongoDB history, CSV export, and an admin review view.

## Stack

- Frontend: Next.js, React, TypeScript, Recharts, lucide-react
- Backend: FastAPI, MongoDB, TextBlob, LIME, scikit-learn
- Auth: JWT bearer tokens

## Project Structure

```text
backend/              FastAPI application
frontend/             Next.js application
api/index.py          Vercel Python entrypoint for FastAPI
requirements.txt      Python dependencies
.env.example          Environment variable template
```

## Environment

Create `.env` in the repository root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
SECRET_KEY=change-me
ADMIN_EMAIL=admin@example.com
FRONTEND_ORIGIN=http://localhost:3000
```

Do not commit `.env`.

## Run Locally

Install backend dependencies:

```bash
python -m pip install -r requirements.txt
```

Run FastAPI:

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Install and run the frontend:

```bash
cd frontend
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000`.

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `POST /api/analyze`
- `GET /api/history`
- `DELETE /api/history/{result_id}`
- `GET /api/export.csv`
- `GET /api/admin/results`
- `DELETE /api/admin/results/{result_id}`

## Notes

The Next.js dev server proxies `/api/*` requests to `http://127.0.0.1:8000` by default. Set `NEXT_PUBLIC_API_URL` if your FastAPI server runs elsewhere.
