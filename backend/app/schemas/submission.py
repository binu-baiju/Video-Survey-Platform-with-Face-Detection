from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SubmissionStart(BaseModel):
    pass  # Metadata extracted from request


class SubmissionStartResponse(BaseModel):
    submission_id: int
    survey_id: int
    message: str


class AnswerSubmit(BaseModel):
    question_id: int
    answer: str = Field(..., pattern="^(Yes|No)$")
    face_detected: bool
    face_score: Optional[float] = Field(None, ge=0, le=100)


class AnswerResponse(BaseModel):
    id: int
    submission_id: int
    question_id: int
    answer: str
    face_detected: bool
    face_score: Optional[float]

    class Config:
        from_attributes = True


class MediaUpload(BaseModel):
    type: str = Field(..., pattern="^(video|image)$")
    question_number: Optional[int] = Field(None, ge=1, le=5)


class MediaResponse(BaseModel):
    id: int
    submission_id: int
    type: str
    path: str
    created_at: datetime

    class Config:
        from_attributes = True


class SubmissionComplete(BaseModel):
    overall_score: Optional[float] = Field(None, ge=0, le=100)


class SubmissionResponse(BaseModel):
    id: int
    survey_id: int
    ip_address: str
    device: Optional[str]
    browser: Optional[str]
    os: Optional[str]
    location: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    overall_score: Optional[float]

    class Config:
        from_attributes = True


class ExportResponse(BaseModel):
    message: str
    download_url: str


class AnswerWithQuestion(BaseModel):
    id: int
    question_id: int
    question_text: str
    question_order: int
    answer: str
    face_detected: bool
    face_score: Optional[float]
    face_image_path: Optional[str]

    class Config:
        from_attributes = True


class SubmissionDetailResponse(BaseModel):
    id: int
    survey_id: int
    ip_address: str
    device: Optional[str]
    browser: Optional[str]
    os: Optional[str]
    location: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    overall_score: Optional[float]
    answers: List[AnswerWithQuestion] = []

    class Config:
        from_attributes = True


class SubmissionListResponse(BaseModel):
    submissions: List[SubmissionResponse]
