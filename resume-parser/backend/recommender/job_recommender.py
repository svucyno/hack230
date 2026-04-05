"""
Job recommendation engine.
Maps candidate skills to job roles and returns
top 5 recommended + top 3 not-recommended roles.
"""

from __future__ import annotations
from typing import Any

# ──────────────────────────────────────────────────────────
# Job role definitions
# Each role: required_skills (core), nice_to_have, category
# ──────────────────────────────────────────────────────────
JOB_ROLES: dict[str, dict] = {
    "Full Stack Developer": {
        "required":     ["html", "css", "javascript", "react", "node", "sql"],
        "nice":         ["typescript", "mongodb", "docker", "aws", "graphql"],
        "category":     "Web Development",
    },
    "Frontend Developer": {
        "required":     ["html", "css", "javascript", "react"],
        "nice":         ["typescript", "vue", "next.js", "tailwind", "figma"],
        "category":     "Web Development",
    },
    "Backend Developer": {
        "required":     ["python", "sql", "rest", "node"],
        "nice":         ["django", "fastapi", "docker", "redis", "postgresql"],
        "category":     "Web Development",
    },
    "Data Scientist": {
        "required":     ["python", "machine learning", "pandas", "numpy", "sql"],
        "nice":         ["tensorflow", "pytorch", "statistics", "deep learning", "r"],
        "category":     "Data & AI",
    },
    "ML Engineer": {
        "required":     ["python", "tensorflow", "machine learning", "deep learning"],
        "nice":         ["pytorch", "kubernetes", "docker", "mlflow", "aws"],
        "category":     "Data & AI",
    },
    "Data Analyst": {
        "required":     ["sql", "python", "excel", "statistics"],
        "nice":         ["tableau", "power bi", "pandas", "r", "matplotlib"],
        "category":     "Data & AI",
    },
    "DevOps Engineer": {
        "required":     ["docker", "kubernetes", "ci/cd", "linux", "git"],
        "nice":         ["aws", "terraform", "ansible", "jenkins", "python"],
        "category":     "Infrastructure",
    },
    "Cloud Engineer": {
        "required":     ["aws", "linux", "docker", "git"],
        "nice":         ["azure", "gcp", "terraform", "kubernetes", "python"],
        "category":     "Infrastructure",
    },
    "Cybersecurity Analyst": {
        "required":     ["cybersecurity", "linux", "python", "networking"],
        "nice":         ["penetration testing", "ethical hacking", "kali linux", "wireshark"],
        "category":     "Security",
    },
    "Mobile Developer": {
        "required":     ["android", "kotlin", "java"],
        "nice":         ["flutter", "swift", "react native", "firebase", "ios"],
        "category":     "Mobile",
    },
    "UI/UX Designer": {
        "required":     ["figma", "css", "html"],
        "nice":         ["javascript", "adobe xd", "sketch", "invision", "prototyping"],
        "category":     "Design",
    },
    "Business Analyst": {
        "required":     ["excel", "sql", "communication", "analytical"],
        "nice":         ["power bi", "tableau", "jira", "project management"],
        "category":     "Business",
    },
    "Product Manager": {
        "required":     ["project management", "communication", "analytical", "jira"],
        "nice":         ["sql", "figma", "agile", "scrum", "leadership"],
        "category":     "Business",
    },
    "QA Engineer": {
        "required":     ["python", "sql", "testing"],
        "nice":         ["selenium", "pytest", "postman", "jira", "ci/cd"],
        "category":     "Quality",
    },
    "Embedded Systems Engineer": {
        "required":     ["c", "c++", "linux"],
        "nice":         ["arduino", "rtos", "python", "matlab", "microcontroller"],
        "category":     "Embedded",
    },
    "Blockchain Developer": {
        "required":     ["solidity", "blockchain", "javascript", "web3"],
        "nice":         ["ethereum", "python", "smart contracts", "react"],
        "category":     "Blockchain",
    },
}


def recommend_jobs(
    skills: dict[str, list[str]],
    top_recommended: int = 5,
    top_not_recommended: int = 3,
) -> dict[str, list[dict]]:
    """
    Match candidate skills against all job roles.

    Returns:
        {
            "recommended":     [ {job_title, match_percentage, ...}, ... ],
            "not_recommended": [ {job_title, match_percentage, ...}, ... ]
        }
    """
    all_skills_lower = set(
        s.lower()
        for s in (skills.get("technical", []) + skills.get("soft", []))
    )

    scored_roles = []
    for job_title, role_data in JOB_ROLES.items():
        match_info = _compute_match(job_title, role_data, all_skills_lower)
        scored_roles.append(match_info)

    # Sort by match descending
    scored_roles.sort(key=lambda x: x["match_percentage"], reverse=True)

    recommended     = scored_roles[:top_recommended]
    not_recommended = scored_roles[-top_not_recommended:][::-1]  # worst first → reverse

    return {
        "recommended":     recommended,
        "not_recommended": not_recommended,
    }


# ──────────────────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────────────────

def _compute_match(
    job_title: str,
    role_data: dict,
    candidate_skills: set[str],
) -> dict[str, Any]:
    required      = role_data["required"]
    nice_to_have  = role_data["nice"]
    category      = role_data["category"]

    required_lower     = [s.lower() for s in required]
    nice_lower         = [s.lower() for s in nice_to_have]
    all_required_lower = set(required_lower + nice_lower)

    # Matched / missing skills
    matched_required  = [s for s in required_lower  if _skill_in_set(s, candidate_skills)]
    matched_nice      = [s for s in nice_lower       if _skill_in_set(s, candidate_skills)]
    missing_required  = [s for s in required_lower  if not _skill_in_set(s, candidate_skills)]
    missing_nice      = [s for s in nice_lower       if not _skill_in_set(s, candidate_skills)]

    # Score: required skills = 70% weight, nice-to-have = 30%
    req_score  = (len(matched_required) / len(required_lower) * 70)  if required_lower  else 0
    nice_score = (len(matched_nice)     / len(nice_lower)     * 30)  if nice_lower       else 0

    match_pct = round(max(req_score + nice_score, 1.0), 1)

    # Build reason text
    if match_pct >= 60:
        matched_str = ", ".join(matched_required[:3]) if matched_required else "some relevant skills"
        reason = f"{matched_str} {'are' if len(matched_required) != 1 else 'is'} directly relevant to this role."
    else:
        missing_str = ", ".join(missing_required[:3]) if missing_required else "core required skills"
        reason = f"Missing critical skills: {missing_str}."

    return {
        "job_title":        job_title,
        "match_percentage": match_pct,
        "category":         category,
        "required_skills":  required,
        "matched_skills":   [s.title() for s in (matched_required + matched_nice)],
        "missing_skills":   [s.title() for s in (missing_required + missing_nice[:2])],
        "reason":           reason,
        "fit_type":         "recommended" if match_pct >= 40 else "not_recommended",
    }


def _skill_in_set(skill: str, candidate_skills: set[str]) -> bool:
    """Check if skill (or partial match) is in the candidate's skill set."""
    if skill in candidate_skills:
        return True
    # Partial match: "node" matches "node.js"
    for cs in candidate_skills:
        if skill in cs or cs in skill:
            return True
    return False
