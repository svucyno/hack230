"""
FastAPI main application — Resume Parser API.

Endpoints:
  POST   /upload-resumes          → upload + parse + store N resumes
  GET    /candidates              → list all candidates
  GET    /candidate/{id}          → single candidate full detail
  GET    /candidate/{id}/score    → score breakdown
  GET    /candidate/{id}/jobs     → job suggestions
  GET    /batch-summary           → aggregate stats
  DELETE /candidate/{id}          → delete candidate + cascade
"""

import json
import os
from typing import List
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from models.database import (
    init_db, get_db,
    Candidate, Skill, Education, Experience, Project,
    Certification, Score, JobSuggestion,
)
from parser.pdf_parser  import extract_text_from_pdf_bytes
from parser.docx_parser import extract_text_from_docx_bytes
from parser.extractor   import extract_resume_data
from scorer.scoring_engine    import score_candidate, _is_fresher
from recommender.job_recommender import recommend_jobs

# ──────────────────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────────────────

app = FastAPI(
    title="Resume Parser API",
    description="Anti-Gravity Resume Parser — FastAPI Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()
    print("[startup] Database initialised.")


# ──────────────────────────────────────────────────────────
# Helper: build full candidate response dict
# ──────────────────────────────────────────────────────────

def _build_candidate_dict(candidate: Candidate) -> dict:
    """Serialize a Candidate ORM object to a response-friendly dict."""
    technical = [s.skill_name for s in candidate.skills if s.skill_type == "technical"]
    soft      = [s.skill_name for s in candidate.skills if s.skill_type == "soft"]

    education = [
        {"degree": e.degree, "institution": e.institution, "year": e.year, "gpa": e.gpa}
        for e in candidate.education
    ]
    experience = [
        {
            "company": ex.company, "role": ex.role, "duration": ex.duration,
            "description": ex.description, "is_internship": ex.is_internship,
        }
        for ex in candidate.experience
    ]
    internships = [e for e in experience if e["is_internship"]]
    work_exp    = [e for e in experience if not e["is_internship"]]

    projects = [
        {
            "name": p.name,
            "tech_stack": [t.strip() for t in p.tech_stack.split(",") if t.strip()],
            "description": p.description,
            "link": p.link,
        }
        for p in candidate.projects
    ]
    certifications = [
        {"name": c.name, "issuer": c.issuer, "year": c.year}
        for c in candidate.certifications
    ]

    scores = None
    if candidate.scores:
        s = candidate.scores
        scores = {
            "overall": s.overall,
            "skills": s.skills,
            "education": s.education,
            "experience": s.experience,
            "projects": s.projects,
            "certifications": s.certifications,
        }

    recommended     = []
    not_recommended = []
    for job in candidate.job_suggestions:
        entry = {
            "job_title":        job.job_title,
            "match_percentage": job.match_pct,
            "reason":           job.reason,
            "missing_skills":   json.loads(job.missing_skills  or "[]"),
            "required_skills":  json.loads(job.required_skills or "[]"),
            "matched_skills":   json.loads(job.matched_skills  or "[]"),
            "fit_type":         job.fit_type,
        }
        if job.fit_type == "recommended":
            recommended.append(entry)
        else:
            not_recommended.append(entry)

    recommended.sort(key=lambda x: x["match_percentage"], reverse=True)
    not_recommended.sort(key=lambda x: x["match_percentage"])

    return {
        "id":            candidate.id,
        "name":          candidate.name,
        "email":         candidate.email,
        "phone":         candidate.phone,
        "linkedin":      candidate.linkedin,
        "github":        candidate.github,
        "location":      candidate.location,
        "file_name":     candidate.file_name,
        "file_type":     candidate.file_type,
        "is_fresher":    candidate.is_fresher,
        "uploaded_at":   candidate.uploaded_at.isoformat() if candidate.uploaded_at else "",
        "skills":        {"technical": technical, "soft": soft},
        "education":     education,
        "experience":    work_exp,
        "internships":   internships,
        "projects":      projects,
        "certifications": certifications,
        "scores":        scores,
        "job_suggestions": {
            "recommended":     recommended,
            "not_recommended": not_recommended,
        },
    }


# ──────────────────────────────────────────────────────────
# Helper: persist parsed resume to DB
# ──────────────────────────────────────────────────────────

def _save_candidate(db: Session, data: dict, raw_text: str, filename: str, filetype: str) -> Candidate:
    skills_data = data.get("skills", {})
    experience  = data.get("experience", [])
    internships = data.get("internships", [])
    is_fresher  = _is_fresher(experience)

    # 1. Candidate record
    candidate = Candidate(
        name      = data.get("name", ""),
        email     = data.get("email", ""),
        phone     = data.get("phone", ""),
        linkedin  = data.get("linkedin", ""),
        github    = data.get("github", ""),
        location  = data.get("location", ""),
        raw_text  = raw_text[:5000],
        file_name = filename,
        file_type = filetype,
        is_fresher= is_fresher,
    )
    db.add(candidate)
    db.flush()  # get candidate.id

    # 2. Skills
    for sk in skills_data.get("technical", []):
        db.add(Skill(candidate_id=candidate.id, skill_name=sk, skill_type="technical"))
    for sk in skills_data.get("soft", []):
        db.add(Skill(candidate_id=candidate.id, skill_name=sk, skill_type="soft"))

    # 3. Education
    for edu in data.get("education", []):
        db.add(Education(
            candidate_id = candidate.id,
            degree       = edu.get("degree", ""),
            institution  = edu.get("institution", ""),
            year         = edu.get("year", ""),
            gpa          = edu.get("gpa", ""),
        ))

    # 4. Experience & Internships
    for exp in experience:
        db.add(Experience(
            candidate_id  = candidate.id,
            company       = exp.get("company", ""),
            role          = exp.get("role", ""),
            duration      = exp.get("duration", ""),
            description   = exp.get("description", ""),
            is_internship = False,
        ))
    for intern in internships:
        db.add(Experience(
            candidate_id  = candidate.id,
            company       = intern.get("company", ""),
            role          = intern.get("role", ""),
            duration      = intern.get("duration", ""),
            description   = intern.get("description", ""),
            is_internship = True,
        ))

    # 5. Projects
    for proj in data.get("projects", []):
        tech = proj.get("tech_stack", [])
        if isinstance(tech, list):
            tech = ", ".join(tech)
        db.add(Project(
            candidate_id = candidate.id,
            name         = proj.get("name", ""),
            tech_stack   = tech,
            description  = proj.get("description", ""),
            link         = proj.get("link", ""),
        ))

    # 6. Certifications
    for cert in data.get("certifications", []):
        db.add(Certification(
            candidate_id = candidate.id,
            name         = cert.get("name", ""),
            issuer       = cert.get("issuer", ""),
            year         = cert.get("year", ""),
        ))

    # 7. Scores
    scores = score_candidate(data)
    db.add(Score(
        candidate_id   = candidate.id,
        overall        = scores["overall"],
        skills         = scores["skills"],
        education      = scores["education"],
        experience     = scores["experience"],
        projects       = scores["projects"],
        certifications = scores["certifications"],
    ))

    # 8. Job suggestions
    jobs = recommend_jobs(skills_data)
    for job in jobs.get("recommended", []):
        db.add(JobSuggestion(
            candidate_id    = candidate.id,
            job_title       = job["job_title"],
            match_pct       = job["match_percentage"],
            fit_type        = "recommended",
            reason          = job["reason"],
            missing_skills  = json.dumps(job.get("missing_skills", [])),
            required_skills = json.dumps(job.get("required_skills", [])),
            matched_skills  = json.dumps(job.get("matched_skills", [])),
        ))
    for job in jobs.get("not_recommended", []):
        db.add(JobSuggestion(
            candidate_id    = candidate.id,
            job_title       = job["job_title"],
            match_pct       = job["match_percentage"],
            fit_type        = "not_recommended",
            reason          = job["reason"],
            missing_skills  = json.dumps(job.get("missing_skills", [])),
            required_skills = json.dumps(job.get("required_skills", [])),
            matched_skills  = json.dumps(job.get("matched_skills", [])),
        ))

    db.commit()
    db.refresh(candidate)
    return candidate


# ──────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────

@app.post("/upload-resumes")
async def upload_resumes(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload one or more PDF/DOCX resumes.
    Returns parsed candidate data for each file.
    """
    results = []
    errors  = []

    for file in files:
        filename = file.filename or "unknown"
        ext      = Path(filename).suffix.lower()

        try:
            file_bytes = await file.read()

            if ext == ".pdf":
                raw_text = extract_text_from_pdf_bytes(file_bytes, filename)
            elif ext in (".docx", ".doc"):
                raw_text = extract_text_from_docx_bytes(file_bytes, filename)
            elif ext == ".txt":
                raw_text = file_bytes.decode("utf-8", errors="replace")
            else:
                errors.append({"file": filename, "error": f"Unsupported file type: {ext}"})
                continue

            if not raw_text.strip():
                errors.append({"file": filename, "error": "Could not extract text from file."})
                continue

            parsed_data = extract_resume_data(raw_text, filename)
            candidate   = _save_candidate(db, parsed_data, raw_text, filename, ext.lstrip("."))
            results.append(_build_candidate_dict(candidate))

        except Exception as exc:
            errors.append({"file": filename, "error": str(exc)})
            print(f"[upload] Error processing '{filename}': {exc}")

    return JSONResponse({
        "parsed":  results,
        "errors":  errors,
        "total":   len(results),
    })


@app.get("/candidates")
def get_candidates(db: Session = Depends(get_db)):
    """Return all candidates (basic info + scores for card display)."""
    candidates = db.query(Candidate).order_by(Candidate.uploaded_at.desc()).all()
    return [_build_candidate_dict(c) for c in candidates]


@app.get("/candidate/{candidate_id}")
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Return full candidate profile."""
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return _build_candidate_dict(c)


@app.get("/candidate/{candidate_id}/score")
def get_candidate_score(candidate_id: int, db: Session = Depends(get_db)):
    """Return score breakdown for a candidate."""
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if not c.scores:
        raise HTTPException(status_code=404, detail="Scores not yet computed")
    s = c.scores
    return {
        "candidate_id":  candidate_id,
        "overall":       s.overall,
        "skills":        s.skills,
        "education":     s.education,
        "experience":    s.experience,
        "projects":      s.projects,
        "certifications": s.certifications,
    }


@app.get("/candidate/{candidate_id}/jobs")
def get_candidate_jobs(candidate_id: int, db: Session = Depends(get_db)):
    """Return job suggestions for a candidate."""
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    data = _build_candidate_dict(c)
    return data["job_suggestions"]


@app.get("/batch-summary")
def get_batch_summary(db: Session = Depends(get_db)):
    """Return aggregate stats across all uploaded candidates."""
    candidates = db.query(Candidate).all()
    if not candidates:
        return {"total": 0, "average_score": 0, "top_performer": None, "skill_distribution": {}}

    scores_list = [c.scores.overall for c in candidates if c.scores]
    avg_score   = round(sum(scores_list) / len(scores_list), 1) if scores_list else 0

    # Top performer
    top = max(candidates, key=lambda c: c.scores.overall if c.scores else 0)

    # Skill frequency
    skill_freq: dict[str, int] = {}
    for c in candidates:
        for sk in c.skills:
            if sk.skill_type == "technical":
                skill_freq[sk.skill_name] = skill_freq.get(sk.skill_name, 0) + 1

    top_skills = sorted(skill_freq.items(), key=lambda x: x[1], reverse=True)[:15]

    # Score distribution buckets
    buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for sc in scores_list:
        if sc <= 20:   buckets["0-20"]   += 1
        elif sc <= 40: buckets["21-40"]  += 1
        elif sc <= 60: buckets["41-60"]  += 1
        elif sc <= 80: buckets["61-80"]  += 1
        else:          buckets["81-100"] += 1

    # Fresher count
    fresher_count = sum(1 for c in candidates if c.is_fresher)

    return {
        "total":             len(candidates),
        "average_score":     avg_score,
        "max_score":         max(scores_list) if scores_list else 0,
        "min_score":         min(scores_list) if scores_list else 0,
        "fresher_count":     fresher_count,
        "experienced_count": len(candidates) - fresher_count,
        "top_performer":     {"id": top.id, "name": top.name, "score": top.scores.overall if top.scores else 0},
        "skill_distribution": dict(top_skills),
        "score_distribution": buckets,
    }


@app.delete("/candidate/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Delete a candidate and all related records."""
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(c)
    db.commit()
    return {"message": f"Candidate {candidate_id} deleted successfully."}


# ──────────────────────────────────────────────────────────
# Root health check
# ──────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "message": "Resume Parser API is running 🚀"}
