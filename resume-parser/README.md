# 🚀 ResumeOrbit — Anti-Gravity Resume Parser

A full-stack resume parsing web application with a stunning **deep-space anti-gravity UI**. Upload PDF/DOCX resumes, extract structured data with NLP, score candidates, and get AI-powered job fit recommendations.

![Space UI Theme](https://img.shields.io/badge/Theme-Anti--Gravity%20Space-7b2fff?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-00d4ff?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-00ff88?style=for-the-badge)

---

## ✨ Features

- **Multi-file upload** — PDF, DOCX, TXT support
- **NLP Extraction** — Name, Email, Phone, Skills, Education, Experience, Projects, Certifications
- **Smart Scoring** — Weighted 0–100% across 5 dimensions
- **Fresher Mode** — Auto-detects freshers and boosts project/internship weights
- **Job Recommendations** — Top 5 matching + Top 3 not-recommended across 16 roles
- **Space UI** — Glassmorphism, floating cards, glowing charts, flip job cards
- **Batch Summary** — Mission Complete screen with aggregate stats

---

## 🗂 Project Structure

```
resume-parser/
├── backend/
│   ├── main.py                 ← FastAPI app (7 endpoints)
│   ├── models/database.py      ← SQLAlchemy + SQLite
│   ├── parser/
│   │   ├── pdf_parser.py       ← PyMuPDF extraction
│   │   ├── docx_parser.py      ← python-docx extraction
│   │   └── extractor.py        ← NLP field extraction
│   ├── scorer/scoring_engine.py← Weighted candidate scoring
│   ├── recommender/job_recommender.py ← 16-role job matching
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         ← StarField, UploadZone, CandidateCard...
│   │   ├── pages/              ← Upload, Dashboard, CandidateProfile
│   │   ├── styles/globals.css  ← Full space design system
│   │   └── App.jsx
│   └── package.json
└── sample_resumes/             ← 2 test resumes (TXT)
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip

---

### 🐍 Backend Setup

```bash
cd resume-parser/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy language model
python -m spacy download en_core_web_sm

# (Optional) Configure OpenAI for better extraction
copy .env.example .env
# Then edit .env and add: OPENAI_API_KEY=your_key_here

# Start backend
uvicorn main:app --reload --port 8000
```

Backend API docs → http://localhost:8000/docs

---

### ⚛️ Frontend Setup

```bash
cd resume-parser/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend → http://localhost:5173

---

## 🧪 Testing with Sample Resumes

The `sample_resumes/` folder contains two test resumes:

1. **priya_sharma_resume.txt** — CS fresher with ML/Data Science skills
2. **arjun_mehta_resume.txt** — Experienced Full Stack Developer

Upload them via the Upload page to see the full parsing pipeline in action.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload-resumes` | Upload + parse N resumes |
| GET | `/candidates` | List all candidates |
| GET | `/candidate/{id}` | Full candidate profile |
| GET | `/candidate/{id}/score` | Score breakdown |
| GET | `/candidate/{id}/jobs` | Job suggestions |
| GET | `/batch-summary` | Aggregate stats |
| DELETE | `/candidate/{id}` | Delete candidate |

---

## 🎨 UI Pages

| Page | Route | Description |
|------|-------|-------------|
| Launch Pad | `/` | Wormhole portal upload zone |
| Mission Control | `/dashboard` | Floating candidate card grid |
| Profile Scan | `/candidate/:id` | Full deep-space profile |

---

## 🔑 Environment Variables

Create `backend/.env`:

```env
# Optional: GPT-4o-mini for better extraction quality
OPENAI_API_KEY=your_openai_api_key_here
```

If not set, the app uses **regex + spaCy** (fully offline, no API key needed).

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| Parsing | PyMuPDF, python-docx |
| NLP | spaCy (en_core_web_sm), regex, optional OpenAI |
| Frontend | React 18, Vite, Framer Motion |
| Styling | Custom CSS (glassmorphism + keyframes) |
| Charts | SVG + Framer Motion |
| Routing | React Router DOM v6 |
| Notifications | react-hot-toast |

---

## 🚀 Production Build

```bash
# Frontend
cd frontend && npm run build

# Serve with uvicorn (static files)
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 📝 License

MIT — Free to use, modify, and distribute.
