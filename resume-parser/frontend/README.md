# ResumeOrbit Frontend Setup

## To Fix Blank Page & Run App

### Option 1: Dev Server (Recommended - Full React Features)
```
cd \"d:/MY PROJECTS/New folder/HACK230/resume-parser/frontend\"
npm run dev
```
Visit `http://localhost:5173` - Shows space UI, upload resumes (needs backend).

### Option 2: Production Preview (Static Build)
```
cd \"d:/MY PROJECTS/New folder/HACK230/resume-parser/frontend\"
npm run preview
```
Visit `http://localhost:4173` - Production optimized.

### Option 3: Direct Open (Limited - No Server)
Open `frontend/index.html` - Now has fallback content if React fails (due to file:// modules).

## Backend Setup (for Upload)
```
cd \"d:/MY PROJECTS/New folder/HACK230/resume-parser/backend\"
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Test
1. Run frontend dev/preview.
2. Run backend.
3. Upload sample_resumes/*.txt on Launch Pad → Dashboard with scores.

Updated: Production build complete (dist/). index.html modified for static + fallback.
