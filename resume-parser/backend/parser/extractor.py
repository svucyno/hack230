"""
NLP-based field extraction from raw resume text.
Uses regex patterns + optional spaCy NER.
Falls back gracefully when spaCy model is unavailable.
"""

import re
import json
import os
from typing import Any

# ── spaCy (optional) ──────────────────────────────────────
try:
    import spacy
    _nlp = spacy.load("en_core_web_sm")
    SPACY_AVAILABLE = True
except Exception:
    _nlp = None
    SPACY_AVAILABLE = False

# ── OpenAI (optional) ─────────────────────────────────────
try:
    from openai import OpenAI as _OpenAIClient
    _openai_key = os.getenv("OPENAI_API_KEY", "")
    OPENAI_AVAILABLE = bool(_openai_key)
    _openai_client = _OpenAIClient(api_key=_openai_key) if OPENAI_AVAILABLE else None
except Exception:
    OPENAI_AVAILABLE = False
    _openai_client = None

# ──────────────────────────────────────────────────────────
# Master skill dictionary
# ──────────────────────────────────────────────────────────
TECHNICAL_SKILLS = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "golang",
    "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "perl",
    "bash", "shell", "powershell", "dart", "lua", "haskell", "elixir",
    # Web
    "html", "css", "react", "reactjs", "react.js", "angular", "angularjs", "vue",
    "vuejs", "next.js", "nextjs", "nuxt", "svelte", "jquery", "bootstrap",
    "tailwind", "sass", "less", "webpack", "vite", "graphql", "rest", "restful",
    "fastapi", "django", "flask", "express", "node", "nodejs", "node.js",
    "spring", "springboot", "spring boot", "laravel", "rails", "asp.net",
    # Data / ML / AI
    "machine learning", "deep learning", "neural network", "nlp",
    "natural language processing", "computer vision", "tensorflow", "keras",
    "pytorch", "scikit-learn", "sklearn", "pandas", "numpy", "matplotlib",
    "seaborn", "plotly", "opencv", "hugging face", "transformers", "bert",
    "gpt", "llm", "langchain", "data science", "statistics", "data analysis",
    # Databases
    "sql", "mysql", "postgresql", "sqlite", "mongodb", "redis", "cassandra",
    "elasticsearch", "dynamodb", "firebase", "oracle", "ms sql", "mssql",
    # Cloud / DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
    "ci/cd", "jenkins", "github actions", "gitlab", "terraform", "ansible",
    "linux", "ubuntu", "git", "github", "gitlab", "bitbucket",
    # Mobile
    "android", "ios", "flutter", "react native", "xamarin", "ionic",
    # Security
    "cybersecurity", "penetration testing", "ethical hacking", "kali linux",
    "wireshark", "metasploit", "owasp", "cryptography",
    # Blockchain
    "blockchain", "ethereum", "solidity", "web3", "smart contracts",
    # Tools
    "jira", "confluence", "trello", "figma", "postman", "swagger",
    "excel", "tableau", "power bi", "jupyter", "vs code",
}

SOFT_SKILLS = {
    "communication", "leadership", "teamwork", "team work", "problem solving",
    "critical thinking", "time management", "adaptability", "creativity",
    "collaboration", "analytical", "attention to detail", "multitasking",
    "project management", "presentation", "negotiation", "mentoring",
    "decision making", "self-motivated", "organized", "flexible",
}

# ──────────────────────────────────────────────────────────
# Section header patterns
# ──────────────────────────────────────────────────────────
SECTION_HEADERS = {
    "education":      r"(education|academic|qualification|degree|schooling)",
    "experience":     r"(experience|employment|work history|professional background|career)",
    "skills":         r"(skill|technical|competenc|proficienc|expertise|tools|technologies)",
    "projects":       r"(project|portfolio|work sample)",
    "certifications": r"(certif|licens|credential|accreditat|course|training)",
    "internships":    r"(intern|trainee|apprentice)",
    "hobbies":        r"(hobbie|interest|passion|activity|extra.?curricul)",
    "achievements":   r"(achievement|award|honor|recognition|publication|accomplish)",
    "summary":        r"(summary|profile|objective|about|introduction)",
}


# ──────────────────────────────────────────────────────────
# Main extraction entry point
# ──────────────────────────────────────────────────────────

def extract_resume_data(raw_text: str, filename: str = "") -> dict[str, Any]:
    """
    Extract structured data from raw resume text.

    If OPENAI_AVAILABLE, delegates to GPT for better accuracy.
    Otherwise uses regex + spaCy pipeline.

    Returns a dict matching the JSON output schema.
    """
    if OPENAI_AVAILABLE:
        try:
            return _extract_with_openai(raw_text)
        except Exception as exc:
            print(f"[extractor] OpenAI extraction failed, falling back: {exc}")

    return _extract_with_regex(raw_text)


# ──────────────────────────────────────────────────────────
# OpenAI extraction
# ──────────────────────────────────────────────────────────

def _extract_with_openai(raw_text: str) -> dict[str, Any]:
    """Use GPT-4o-mini to extract structured resume data."""
    prompt = f"""
You are a professional resume parser. Extract information from the resume below and return ONLY valid JSON.

Resume text:
---
{raw_text[:6000]}
---

Return this exact JSON structure (use empty strings/arrays if data is missing):
{{
  "name": "",
  "email": "",
  "phone": "",
  "linkedin": "",
  "github": "",
  "location": "",
  "skills": {{"technical": [], "soft": []}},
  "education": [{{"degree": "", "institution": "", "year": "", "gpa": ""}}],
  "experience": [{{"company": "", "role": "", "duration": "", "description": ""}}],
  "internships": [{{"company": "", "role": "", "duration": ""}}],
  "projects": [{{"name": "", "tech_stack": [], "description": "", "link": ""}}],
  "certifications": [{{"name": "", "issuer": "", "year": ""}}],
  "hobbies": [],
  "achievements": []
}}
"""
    response = _openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=2000,
    )
    content = response.choices[0].message.content.strip()
    # Strip markdown fences if present
    content = re.sub(r"^```(?:json)?\n?", "", content)
    content = re.sub(r"\n?```$", "", content)
    return json.loads(content)


# ──────────────────────────────────────────────────────────
# Regex + spaCy extraction
# ──────────────────────────────────────────────────────────

def _extract_with_regex(raw_text: str) -> dict[str, Any]:
    """Rule-based extraction using regex and optional spaCy NER."""
    text = raw_text.strip()
    lines = [l.strip() for l in text.splitlines() if l.strip()]

    sections = _split_into_sections(lines)

    return {
        "name":           _extract_name(lines, text),
        "email":          _extract_email(text),
        "phone":          _extract_phone(text),
        "linkedin":       _extract_linkedin(text),
        "github":         _extract_github(text),
        "location":       _extract_location(text, lines),
        "skills":         _extract_skills(text, sections.get("skills", "")),
        "education":      _extract_education(sections.get("education", "")),
        "experience":     _extract_experience(sections.get("experience", ""), internship=False),
        "internships":    _extract_experience(sections.get("internships", ""), internship=True),
        "projects":       _extract_projects(sections.get("projects", "")),
        "certifications": _extract_certifications(sections.get("certifications", "")),
        "hobbies":        _extract_hobbies(sections.get("hobbies", "")),
        "achievements":   _extract_achievements(sections.get("achievements", "")),
    }


def _split_into_sections(lines: list[str]) -> dict[str, str]:
    """Identify section boundaries and return dict of section_name → text."""
    sections: dict[str, list[str]] = {}
    current = "summary"
    for line in lines:
        lower = line.lower()
        found = False
        for section_name, pattern in SECTION_HEADERS.items():
            if re.search(pattern, lower) and len(line) < 60:
                current = section_name
                found = True
                break
        if not found:
            sections.setdefault(current, []).append(line)

    return {k: "\n".join(v) for k, v in sections.items()}


def _extract_name(lines: list[str], text: str) -> str:
    """Heuristic: first non-empty line that looks like a name."""
    # spaCy PERSON entity from first 300 chars
    if SPACY_AVAILABLE and _nlp:
        doc = _nlp(text[:300])
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                return ent.text.strip()

    # Fallback: first line with only letters and spaces, not too long
    for line in lines[:5]:
        if re.match(r"^[A-Za-z\s\.\-]+$", line) and 3 < len(line) < 50:
            return line.strip()
    return ""


def _extract_email(text: str) -> str:
    m = re.search(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    return m.group(0) if m else ""


def _extract_phone(text: str) -> str:
    m = re.search(
        r"(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{2,4}\)?[\s\-]?)?\d{3,4}[\s\-]?\d{4}", text
    )
    return m.group(0).strip() if m else ""


def _extract_linkedin(text: str) -> str:
    m = re.search(r"linkedin\.com/in/[A-Za-z0-9\-_]+", text, re.IGNORECASE)
    return m.group(0) if m else ""


def _extract_github(text: str) -> str:
    m = re.search(r"github\.com/[A-Za-z0-9\-_]+", text, re.IGNORECASE)
    return m.group(0) if m else ""


def _extract_location(text: str, lines: list[str]) -> str:
    """Look for city, state / country combos."""
    m = re.search(
        r"\b([A-Z][a-zA-Z\s]+),\s*([A-Z][a-zA-Z\s]{2,})\b", text
    )
    if m:
        return m.group(0).strip()

    # spaCy GPE entities
    if SPACY_AVAILABLE and _nlp:
        doc = _nlp(text[:400])
        for ent in doc.ents:
            if ent.label_ in ("GPE", "LOC"):
                return ent.text.strip()
    return ""


def _extract_skills(full_text: str, skills_section: str) -> dict[str, list[str]]:
    """Match against known skill dictionaries from full text."""
    combined = (skills_section + " " + full_text).lower()
    technical = sorted({
        s.title() for s in TECHNICAL_SKILLS if s in combined
    })
    soft = sorted({
        s.title() for s in SOFT_SKILLS if s in combined
    })
    return {"technical": technical, "soft": soft}


def _extract_education(section_text: str) -> list[dict]:
    """Extract education entries from the education section."""
    entries = []
    if not section_text:
        return entries

    year_pattern = r"\b(19|20)\d{2}\b"
    gpa_pattern  = r"(?:cgpa|gpa|percentage|%|score)[\s:]*([0-9.]+)"

    # Split by double newlines or bullet points
    chunks = re.split(r"\n{2,}|(?=\b(?:b\.?tech|b\.?e|m\.?tech|m\.?sc|b\.?sc|mba|phd|bachelor|master|diploma)\b)",
                      section_text, flags=re.IGNORECASE)

    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk or len(chunk) < 10:
            continue

        # Degree
        deg_m = re.search(
            r"(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?Sc|B\.?Sc|B\.?Com|MBA|PhD|Diploma|Bachelor|Master)[^,\n]*",
            chunk, re.IGNORECASE
        )
        degree = deg_m.group(0).strip() if deg_m else _first_meaningful_line(chunk)

        # Institution
        inst_m = re.search(r"(University|Institute|College|School|IIT|NIT)[^\n,]*", chunk, re.IGNORECASE)
        institution = inst_m.group(0).strip() if inst_m else ""

        # Year
        year_m = re.search(year_pattern, chunk)
        year = year_m.group(0) if year_m else ""

        # GPA
        gpa_m = re.search(gpa_pattern, chunk, re.IGNORECASE)
        gpa = gpa_m.group(1) if gpa_m else ""

        if degree or institution:
            entries.append({
                "degree": degree,
                "institution": institution,
                "year": year,
                "gpa": gpa,
            })

    return entries[:5]


def _extract_experience(section_text: str, internship: bool = False) -> list[dict]:
    """Extract work experience or internship entries."""
    entries = []
    if not section_text:
        return entries

    chunks = re.split(r"\n{2,}", section_text)
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk or len(chunk) < 15:
            continue

        lines = chunk.splitlines()
        company  = lines[0] if lines else ""
        role     = lines[1] if len(lines) > 1 else ""

        # Duration pattern
        dur_m = re.search(
            r"(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4})"
            r"\s*[-–to]+\s*"
            r"(Present|Current|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
            r"[a-z]*[\s,]+\d{4})",
            chunk, re.IGNORECASE
        )
        duration = dur_m.group(0) if dur_m else ""
        desc = "\n".join(lines[2:]) if len(lines) > 2 else ""

        entries.append({
            "company":     company,
            "role":        role,
            "duration":    duration,
            "description": desc,
        })

    return entries[:10]


def _extract_projects(section_text: str) -> list[dict]:
    entries = []
    if not section_text:
        return entries

    chunks = re.split(r"\n{2,}|\n(?=[•\-*]|\d+\.)", section_text)
    for chunk in chunks:
        chunk = chunk.strip().lstrip("•-*0123456789. ")
        if not chunk or len(chunk) < 10:
            continue

        lines = chunk.splitlines()
        name = lines[0].strip() if lines else ""

        # Find tech stack in parentheses or after colon
        tech_m = re.search(r"(?:tech|stack|tool|built with|using)[:\s]+([^\n]+)", chunk, re.IGNORECASE)
        tech_raw = tech_m.group(1) if tech_m else ""
        tech_list = [t.strip() for t in re.split(r"[,|]", tech_raw) if t.strip()]

        # Fall back: extract known skills from chunk
        if not tech_list:
            lo = chunk.lower()
            tech_list = [s.title() for s in TECHNICAL_SKILLS if s in lo][:6]

        # Link
        link_m = re.search(r"(https?://[^\s]+|github\.com/[^\s]+)", chunk)
        link = link_m.group(0) if link_m else ""

        desc = "\n".join(lines[1:]) if len(lines) > 1 else chunk

        entries.append({
            "name":       name,
            "tech_stack": tech_list,
            "description": desc[:300],
            "link":        link,
        })

    return entries[:8]


def _extract_certifications(section_text: str) -> list[dict]:
    entries = []
    if not section_text:
        return entries

    known_issuers = [
        "google", "microsoft", "aws", "amazon", "coursera", "udemy",
        "edx", "ibm", "meta", "oracle", "cisco", "redhat", "linkedin"
    ]

    for line in section_text.splitlines():
        line = line.strip().lstrip("•-*0123456789. ")
        if not line or len(line) < 5:
            continue

        year_m = re.search(r"\b(19|20)\d{2}\b", line)
        year = year_m.group(0) if year_m else ""

        issuer = ""
        for iss in known_issuers:
            if iss in line.lower():
                issuer = iss.title()
                break

        name = re.sub(r"\b(19|20)\d{2}\b", "", line).strip(" |-")

        entries.append({"name": name, "issuer": issuer, "year": year})

    return entries[:10]


def _extract_hobbies(section_text: str) -> list[str]:
    if not section_text:
        return []
    hobbies = []
    for item in re.split(r"[,\n•\-*]", section_text):
        item = item.strip().lstrip("•-*0123456789. ")
        if item and 2 < len(item) < 50:
            hobbies.append(item)
    return hobbies[:10]


def _extract_achievements(section_text: str) -> list[str]:
    if not section_text:
        return []
    achievements = []
    for line in section_text.splitlines():
        line = line.strip().lstrip("•-*0123456789. ")
        if line and len(line) > 5:
            achievements.append(line)
    return achievements[:10]


def _first_meaningful_line(text: str) -> str:
    for line in text.splitlines():
        line = line.strip()
        if line and len(line) > 3:
            return line
    return ""
