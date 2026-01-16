from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    questions = relationship("SurveyQuestion", back_populates="survey", cascade="all, delete-orphan")
    submissions = relationship("SurveySubmission", back_populates="survey")


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    question_text = Column(String, nullable=False)
    order = Column(Integer, nullable=False)  # 1-5

    survey = relationship("Survey", back_populates="questions")
    answers = relationship("SurveyAnswer", back_populates="question")
