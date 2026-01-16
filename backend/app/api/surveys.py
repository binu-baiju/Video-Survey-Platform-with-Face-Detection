from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.survey import Survey, SurveyQuestion
from app.schemas.survey import SurveyCreate, SurveyResponse, QuestionCreate, QuestionResponse, SurveyPublish

router = APIRouter()


@router.get("/surveys", response_model=List[SurveyResponse])
async def list_surveys(db: Session = Depends(get_db)):
    """List all surveys with their questions."""
    surveys = db.query(Survey).order_by(Survey.created_at.desc()).all()
    
    # Load questions for each survey
    for survey in surveys:
        questions = db.query(SurveyQuestion).filter(
            SurveyQuestion.survey_id == survey.id
        ).order_by(SurveyQuestion.order).all()
        survey.questions = questions
    
    return surveys


@router.post("/surveys", response_model=SurveyResponse, status_code=status.HTTP_201_CREATED)
async def create_survey(survey_data: SurveyCreate, db: Session = Depends(get_db)):
    """Create a new survey."""
    survey = Survey(title=survey_data.title, is_active=False)
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return survey


@router.post("/surveys/{survey_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def add_question(
    survey_id: int,
    question_data: QuestionCreate,
    db: Session = Depends(get_db)
):
    """Add a question to a survey."""
    # Check if survey exists
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    # Check if survey already has 5 questions
    existing_questions = db.query(SurveyQuestion).filter(SurveyQuestion.survey_id == survey_id).count()
    if existing_questions >= 5:
        raise HTTPException(
            status_code=400,
            detail="Survey already has 5 questions. Maximum allowed is 5."
        )
    
    # Check if order already exists
    existing_order = db.query(SurveyQuestion).filter(
        SurveyQuestion.survey_id == survey_id,
        SurveyQuestion.order == question_data.order
    ).first()
    if existing_order:
        raise HTTPException(
            status_code=400,
            detail=f"Question with order {question_data.order} already exists"
        )
    
    question = SurveyQuestion(
        survey_id=survey_id,
        question_text=question_data.question_text,
        order=question_data.order
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("/surveys/{survey_id}", response_model=SurveyResponse)
async def get_survey(survey_id: int, db: Session = Depends(get_db)):
    """Get survey details with questions."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    # Load questions
    questions = db.query(SurveyQuestion).filter(
        SurveyQuestion.survey_id == survey_id
    ).order_by(SurveyQuestion.order).all()
    
    survey.questions = questions
    return survey


@router.post("/surveys/{survey_id}/publish", response_model=SurveyResponse)
async def publish_survey(
    survey_id: int,
    publish_data: SurveyPublish,
    db: Session = Depends(get_db)
):
    """Publish or unpublish a survey."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    # Check if survey has exactly 5 questions
    question_count = db.query(SurveyQuestion).filter(SurveyQuestion.survey_id == survey_id).count()
    if question_count != 5:
        raise HTTPException(
            status_code=400,
            detail=f"Survey must have exactly 5 questions. Currently has {question_count}."
        )
    
    survey.is_active = publish_data.is_active
    db.commit()
    db.refresh(survey)
    return survey


@router.delete("/surveys/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_survey(survey_id: int, db: Session = Depends(get_db)):
    """Delete a survey and all associated data (questions, submissions, answers, media files)."""
    from app.models.submission import SurveySubmission, MediaFile
    import os
    
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    # Get all submissions for this survey
    submissions = db.query(SurveySubmission).filter(
        SurveySubmission.survey_id == survey_id
    ).all()
    
    # Delete media files from filesystem
    for submission in submissions:
        media_files = db.query(MediaFile).filter(
            MediaFile.submission_id == submission.id
        ).all()
        for media_file in media_files:
            if os.path.exists(media_file.path):
                try:
                    os.remove(media_file.path)
                except Exception as e:
                    print(f"Error deleting media file {media_file.path}: {e}")
    
    # Delete survey (cascade will delete questions, submissions will be deleted via foreign key)
    # But we need to handle submissions manually since there's no cascade
    for submission in submissions:
        db.delete(submission)
    
    db.delete(survey)
    db.commit()
    
    return None
