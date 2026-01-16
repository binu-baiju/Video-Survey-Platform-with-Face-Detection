from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=1)
    order: int = Field(..., ge=1, le=5)


class QuestionResponse(BaseModel):
    id: int
    survey_id: int
    question_text: str
    order: int

    class Config:
        from_attributes = True


class SurveyCreate(BaseModel):
    title: str = Field(..., min_length=1)


class SurveyPublish(BaseModel):
    is_active: bool = True


class SurveyResponse(BaseModel):
    id: int
    title: str
    is_active: bool
    created_at: datetime
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True
