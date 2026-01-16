from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class SurveySubmission(Base):
    __tablename__ = "survey_submissions"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    ip_address = Column(String, nullable=False)
    device = Column(String)
    browser = Column(String)
    os = Column(String)
    location = Column(String)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    overall_score = Column(Float, nullable=True)

    survey = relationship("Survey", back_populates="submissions")
    answers = relationship("SurveyAnswer", back_populates="submission", cascade="all, delete-orphan")
    media_files = relationship("MediaFile", back_populates="submission", cascade="all, delete-orphan")


class SurveyAnswer(Base):
    __tablename__ = "survey_answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("survey_submissions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("survey_questions.id"), nullable=False)
    answer = Column(String, nullable=False)  # "Yes" or "No"
    face_detected = Column(Boolean, default=False)
    face_score = Column(Float, nullable=True)  # 0-100
    face_image_path = Column(String, nullable=True)

    submission = relationship("SurveySubmission", back_populates="answers")
    question = relationship("SurveyQuestion", back_populates="answers")


class MediaFile(Base):
    __tablename__ = "media_files"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("survey_submissions.id"), nullable=False)
    type = Column(String, nullable=False)  # "video" or "image"
    path = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    submission = relationship("SurveySubmission", back_populates="media_files")
