"""
Database models and SQLAlchemy setup for Resume Parser.
Uses SQLite as the backing store — zero config required.
"""

import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    Text, DateTime, Boolean, ForeignKey
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DATABASE_URL = "sqlite:///./resume_parser.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # needed for SQLite + FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ──────────────────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────────────────

class Candidate(Base):
    __tablename__ = "candidates"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(200), default="")
    email       = Column(String(200), default="")
    phone       = Column(String(50),  default="")
    linkedin    = Column(String(300), default="")
    github      = Column(String(300), default="")
    location    = Column(String(200), default="")
    raw_text    = Column(Text,        default="")
    file_name   = Column(String(300), default="")
    file_type   = Column(String(10),  default="")
    is_fresher  = Column(Boolean,     default=False)
    uploaded_at = Column(DateTime,    default=datetime.datetime.utcnow)

    # Relationships
    skills          = relationship("Skill",         back_populates="candidate", cascade="all, delete")
    education       = relationship("Education",     back_populates="candidate", cascade="all, delete")
    experience      = relationship("Experience",    back_populates="candidate", cascade="all, delete")
    projects        = relationship("Project",       back_populates="candidate", cascade="all, delete")
    certifications  = relationship("Certification", back_populates="candidate", cascade="all, delete")
    scores          = relationship("Score",         back_populates="candidate", cascade="all, delete", uselist=False)
    job_suggestions = relationship("JobSuggestion", back_populates="candidate", cascade="all, delete")


class Skill(Base):
    __tablename__ = "skills"

    id           = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    skill_name   = Column(String(100), default="")
    skill_type   = Column(String(20),  default="technical")  # technical | soft

    candidate = relationship("Candidate", back_populates="skills")


class Education(Base):
    __tablename__ = "education"

    id           = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    degree       = Column(String(200), default="")
    institution  = Column(String(300), default="")
    year         = Column(String(10),  default="")
    gpa          = Column(String(20),  default="")

    candidate = relationship("Candidate", back_populates="education")


class Experience(Base):
    __tablename__ = "experience"

    id             = Column(Integer, primary_key=True, index=True)
    candidate_id   = Column(Integer, ForeignKey("candidates.id"))
    company        = Column(String(300), default="")
    role           = Column(String(200), default="")
    duration       = Column(String(100), default="")
    description    = Column(Text,        default="")
    is_internship  = Column(Boolean,     default=False)

    candidate = relationship("Candidate", back_populates="experience")


class Project(Base):
    __tablename__ = "projects"

    id           = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    name         = Column(String(300), default="")
    tech_stack   = Column(Text,        default="")   # comma-separated
    description  = Column(Text,        default="")
    link         = Column(String(500), default="")

    candidate = relationship("Candidate", back_populates="projects")


class Certification(Base):
    __tablename__ = "certifications"

    id           = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    name         = Column(String(300), default="")
    issuer       = Column(String(200), default="")
    year         = Column(String(10),  default="")

    candidate = relationship("Candidate", back_populates="certifications")


class Score(Base):
    __tablename__ = "scores"

    id             = Column(Integer, primary_key=True, index=True)
    candidate_id   = Column(Integer, ForeignKey("candidates.id"), unique=True)
    overall        = Column(Float, default=0.0)
    skills         = Column(Float, default=0.0)
    education      = Column(Float, default=0.0)
    experience     = Column(Float, default=0.0)
    projects       = Column(Float, default=0.0)
    certifications = Column(Float, default=0.0)

    candidate = relationship("Candidate", back_populates="scores")


class JobSuggestion(Base):
    __tablename__ = "job_suggestions"

    id             = Column(Integer, primary_key=True, index=True)
    candidate_id   = Column(Integer, ForeignKey("candidates.id"))
    job_title      = Column(String(200), default="")
    match_pct      = Column(Float,       default=0.0)
    fit_type       = Column(String(20),  default="recommended")  # recommended | not_recommended
    reason         = Column(Text,        default="")
    missing_skills = Column(Text,        default="")   # JSON string
    required_skills= Column(Text,        default="")   # JSON string
    matched_skills = Column(Text,        default="")   # JSON string

    candidate = relationship("Candidate", back_populates="job_suggestions")


# ──────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────

def init_db():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
