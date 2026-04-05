"""
Scoring engine — produces 0–100 scores per resume section.

Weights:
  Skills        30%
  Experience    25%  (boosted to projects if fresher)
  Education     20%
  Projects      15%
  Certifications 10%
"""

from __future__ import annotations
from typing import Any
import re


# ──────────────────────────────────────────────────────────
# Credible certification issuers (boost multiplier)
# ──────────────────────────────────────────────────────────
PREMIUM_ISSUERS = {
    "google", "microsoft", "aws", "amazon", "meta", "ibm",
    "oracle", "cisco", "redhat", "coursera", "edx",
}

# Degree level → base score
DEGREE_SCORES = {
    "phd":       100,
    "doctorate":  100,
    "m.tech":     90,
    "mtech":      90,
    "m.sc":       85,
    "msc":        85,
    "mba":        85,
    "master":     85,
    "b.tech":     75,
    "btech":      75,
    "b.e":        75,
    "be":         75,
    "b.sc":       65,
    "bsc":        65,
    "b.com":      55,
    "bcom":       55,
    "diploma":    50,
    "bachelor":   70,
}


def score_candidate(data: dict[str, Any]) -> dict[str, float]:
    """
    Compute section scores and weighted overall score.

    Args:
        data: Parsed resume dict from extractor.py

    Returns:
        Dict with keys: overall, skills, education, experience,
        projects, certifications  (all 0.0–100.0)
    """
    skills_score  = _score_skills(data.get("skills", {}))
    edu_score     = _score_education(data.get("education", []))
    exp_score     = _score_experience(data.get("experience", []), data.get("internships", []))
    proj_score    = _score_projects(data.get("projects", []))
    cert_score    = _score_certifications(data.get("certifications", []))

    is_fresher = _is_fresher(data.get("experience", []))

    if is_fresher:
        # Boost projects + internships for freshers; reduce exp weight
        overall = (
            skills_score  * 0.30 +
            edu_score     * 0.25 +
            proj_score    * 0.25 +
            exp_score     * 0.10 +   # mostly 0 anyway
            cert_score    * 0.10
        )
    else:
        overall = (
            skills_score  * 0.30 +
            exp_score     * 0.25 +
            edu_score     * 0.20 +
            proj_score    * 0.15 +
            cert_score    * 0.10
        )

    return {
        "overall":        round(min(overall, 100.0), 1),
        "skills":         round(skills_score, 1),
        "education":      round(edu_score, 1),
        "experience":     round(exp_score, 1),
        "projects":       round(proj_score, 1),
        "certifications": round(cert_score, 1),
    }


# ──────────────────────────────────────────────────────────
# Individual scorers
# ──────────────────────────────────────────────────────────

def _score_skills(skills: dict) -> float:
    technical = skills.get("technical", [])
    soft      = skills.get("soft", [])

    # 5 pts per technical skill, max 85; 3 pts per soft skill, max 15
    tech_score = min(len(technical) * 5, 85)
    soft_score = min(len(soft) * 3, 15)
    return min(tech_score + soft_score, 100)


def _score_education(education: list[dict]) -> float:
    if not education:
        return 30.0   # unknown — give partial credit

    best = 0.0
    for edu in education:
        deg = (edu.get("degree") or "").lower()
        for key, score in DEGREE_SCORES.items():
            if key in deg:
                base = score
                break
        else:
            base = 55.0  # unknown degree

        # GPA boost
        gpa_raw = str(edu.get("gpa") or "0").replace("%", "").strip()
        try:
            gpa_val = float(gpa_raw)
            if gpa_val > 10:       # percentage scale (e.g. 85%)
                gpa_val = gpa_val / 10
            gpa_boost = max(0, (gpa_val - 6.0) * 3)   # above 6.0 gets bonus
        except ValueError:
            gpa_boost = 0

        best = max(best, min(base + gpa_boost, 100))

    return best


def _score_experience(experience: list[dict], internships: list[dict]) -> float:
    if not experience and not internships:
        return 0.0

    score = 0.0

    # Full-time experience: 15 pts per year (rough estimate from duration)
    for exp in experience:
        months = _duration_to_months(exp.get("duration", ""))
        years  = months / 12
        score += min(years * 15, 35)

    # Internships: 7 pts each
    for intern in internships:
        months = _duration_to_months(intern.get("duration", ""))
        score += min((months / 12) * 7, 15)

    return min(score, 100)


def _score_projects(projects: list[dict]) -> float:
    if not projects:
        return 0.0

    score = 0.0
    for proj in projects:
        tech = proj.get("tech_stack", [])
        if isinstance(tech, str):
            tech = [t.strip() for t in tech.split(",") if t.strip()]
        # Base: 10 pts per project, up to 60; bonus for tech diversity
        score += 10 + min(len(tech) * 2, 10)

    return min(score, 100)


def _score_certifications(certifications: list[dict]) -> float:
    if not certifications:
        return 0.0

    score = 0.0
    for cert in certifications:
        issuer = (cert.get("issuer") or "").lower()
        if any(pi in issuer for pi in PREMIUM_ISSUERS):
            score += 20
        else:
            score += 12

    return min(score, 100)


# ──────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────

def _is_fresher(experience: list[dict]) -> bool:
    """Candidate is a fresher if they have no full-time work experience."""
    return len(experience) == 0


def _duration_to_months(duration_str: str) -> float:
    """Convert rough duration string to approximate months."""
    if not duration_str:
        return 0.0

    lo = duration_str.lower()

    # "2 years 3 months", "6 months", "1 year", etc.
    year_m  = re.search(r"(\d+(?:\.\d+)?)\s*year",  lo)
    month_m = re.search(r"(\d+(?:\.\d+)?)\s*month", lo)

    years  = float(year_m.group(1))  if year_m  else 0.0
    months = float(month_m.group(1)) if month_m else 0.0

    total = years * 12 + months

    # Fallback: try to infer from two year numbers in the string
    if total == 0:
        dates = re.findall(r"\b(19|20)(\d{2})\b", duration_str)
        if len(dates) >= 2:
            y1 = int(dates[0][0] + dates[0][1])
            y2 = int(dates[-1][0] + dates[-1][1])
            total = max((y2 - y1) * 12, 1)

    return total

