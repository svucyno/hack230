import pdfplumber
import docx
import re
from skills import ALL_SKILLS, JOB_ROLES


# ---------- TEXT EXTRACTION ----------
def extract_text(file_path):
    text = ""

    if file_path.endswith(".pdf"):
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"

    elif file_path.endswith(".docx"):
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"

    return text


# ---------- NAME ----------
def extract_name(text):
    lines = text.split("\n")

    for line in lines[:15]:
        line = line.strip()

        if not line:
            continue

        if "@" in line or "linkedin" in line.lower() or "github" in line.lower():
            continue

        if re.match(r'^([A-Z][a-z]+)( [A-Z][a-z]+){1,3}$', line):
            return line

    return "Unknown"


# ---------- CATEGORY CHECK ----------
def is_category_line(line):
    pattern = r'(languages|frameworks|ai/ml|tools\s*/?\s*platforms|tools|libraries|databases|technologies|expertise)\s*:'
    return re.search(pattern, line.lower())


# ---------- SKILLS ----------
def extract_skills(text):

    lines = text.split("\n")

    skill_headers = [
        "skills", "technical skills", "skill summary",
        "tools", "technologies", "tech stack"
    ]

    stop_headers = [
        "projects", "experience", "education",
        "training", "internship", "achievements"
    ]

    capture = False
    extracted_text = ""

    i = 0
    while i < len(lines):

        line = lines[i]
        l = line.lower().strip()

        if any(h in l for h in skill_headers):
            capture = True
            i += 1
            continue

        if any(h in l for h in stop_headers):
            capture = False

        if capture:

            if is_category_line(line):

                if ":" in line:
                    extracted_text += " " + line.split(":", 1)[1]

                for j in range(1, 4):
                    if i + j < len(lines):
                        next_line = lines[i + j].strip()

                        if any(h in next_line.lower() for h in stop_headers):
                            break

                        extracted_text += " " + next_line

                i += 3

            else:
                extracted_text += " " + line

        i += 1

    combined = extracted_text.lower()
    combined = re.sub(r'\s+', ' ', combined)

    extracted = set()

    for skill in ALL_SKILLS:
        pattern = r'(?<!\w)' + re.escape(skill.lower()) + r'(?!\w)'
        if re.search(pattern, combined):
            extracted.add(skill)

    return sorted(list(extracted))


# ---------- EDUCATION ----------
def extract_education(text):
    education = []
    lines = text.split("\n")

    for i, line in enumerate(lines):
        l = line.lower()

        # ---------- SSC ----------
        if "ssc" in l or "10th" in l:
            name = ""
            score = ""

            for j in range(i+1, min(i+5, len(lines))):
                if not name:
                    name = lines[j].strip()
                if "percentage" in lines[j].lower() or "%" in lines[j]:
                    score = lines[j].strip()

            if name:
                education.append(f"SSC: {name}, {score}")

        # ---------- INTERMEDIATE ----------
        elif "intermediate" in l or "12th" in l:
            name = ""
            score = ""

            for j in range(i+1, min(i+5, len(lines))):
                if not name:
                    name = lines[j].strip()
                if "percentage" in lines[j].lower() or "%" in lines[j]:
                    score = lines[j].strip()

            if name:
                education.append(f"Intermediate: {name}, {score}")

        # ---------- B.TECH / DEGREE ----------
        elif "b.tech" in l or "bachelor" in l:
            name = ""
            score = ""

            for j in range(i+1, min(i+5, len(lines))):
                if not name:
                    name = lines[j].strip()
                if "cgpa" in lines[j].lower() or "%" in lines[j]:
                    score = lines[j].strip()

            if name:
                education.append(f"B.Tech: {name}, {score}")

    return education if education else ["NA"]


# ---------- EXPERIENCE ----------
def extract_experience(text):
    match = re.search(r'(\d+)\s+year', text.lower())

    if match:
        years = match.group(1)

        role_match = re.search(r'(data analyst|machine learning engineer|developer)', text.lower())
        role = role_match.group(1) if role_match else "Unknown Role"

        return f"{years} years experience as {role}"

    return "Fresher"


# ---------- PROJECTS ----------
def extract_projects(text):
    match = re.search(r'projects(.*?)(education|experience|training)', text.lower(), re.DOTALL)

    if match:
        return match.group(1).strip()

    match = re.search(r'internship(.*?)(education|experience|training)', text.lower(), re.DOTALL)

    if match:
        return match.group(1).strip()

    return "NA"


# ---------- JOB MATCH ----------
def match_job(skills):
    best_role = None
    best_score = 0
    best_missing = []

    for role, required in JOB_ROLES.items():

        matched = [s for s in skills if s in required]
        missing = [s for s in required if s not in skills]

        score = len(matched) / len(required)

        if score > best_score:
            best_score = score
            best_role = role
            best_missing = missing

    return best_role, int(best_score * 100), best_missing


# ---------- MAIN ----------
def process_resume(file_path):
    text = extract_text(file_path)
    text = re.sub(r'\n+', '\n', text)

    name = extract_name(text)
    skills = extract_skills(text)
    role, score, missing = match_job(skills)

    education = extract_education(text)
    experience = extract_experience(text)
    projects = extract_projects(text)

    return [{
        "name": name,
        "skills": skills,
        "role": role,
        "score": score,
        "missing": missing,
        "education": education,
        "experience": experience,
        "projects": projects
    }]