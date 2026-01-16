from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.submission import SurveySubmission, SurveyAnswer, MediaFile
from app.models.survey import Survey, SurveyQuestion
from app.schemas.submission import (
    SubmissionStartResponse, AnswerSubmit, AnswerResponse,
    MediaResponse, SubmissionComplete, SubmissionResponse,
    SubmissionDetailResponse, SubmissionListResponse, AnswerWithQuestion
)
from app.utils.metadata import extract_metadata
from app.utils.media import save_media_file
from fastapi.responses import FileResponse, StreamingResponse
import os
import zipfile
import json
from io import BytesIO
from datetime import datetime

router = APIRouter()


@router.post("/surveys/{survey_id}/start", response_model=SubmissionStartResponse, status_code=status.HTTP_201_CREATED)
async def start_submission(survey_id: int, request: Request, db: Session = Depends(get_db)):
    """Start a new survey submission."""
    # Check if survey exists and is active
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    if not survey.is_active:
        raise HTTPException(status_code=400, detail="Survey is not published")
    
    # Extract metadata
    metadata = extract_metadata(request)
    
    # Create submission
    submission = SurveySubmission(
        survey_id=survey_id,
        ip_address=metadata["ip_address"],
        device=metadata["device"],
        browser=metadata["browser"],
        os=metadata["os"],
        location=metadata["location"]
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return SubmissionStartResponse(
        submission_id=submission.id,
        survey_id=survey_id,
        message="Submission started successfully"
    )


@router.post("/submissions/{submission_id}/answers", response_model=AnswerResponse, status_code=status.HTTP_201_CREATED)
async def submit_answer(
    submission_id: int,
    answer_data: AnswerSubmit,
    db: Session = Depends(get_db)
):
    """Submit an answer for a question."""
    # Check if submission exists
    submission = db.query(SurveySubmission).filter(SurveySubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Check if submission is already completed
    if submission.completed_at:
        raise HTTPException(status_code=400, detail="Submission already completed")
    
    # Check if question exists and belongs to the survey
    question = db.query(SurveyQuestion).filter(SurveyQuestion.id == answer_data.question_id).first()
    if not question or question.survey_id != submission.survey_id:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if answer already exists for this question
    existing_answer = db.query(SurveyAnswer).filter(
        SurveyAnswer.submission_id == submission_id,
        SurveyAnswer.question_id == answer_data.question_id
    ).first()
    
    if existing_answer:
        # Update existing answer
        existing_answer.answer = answer_data.answer
        existing_answer.face_detected = answer_data.face_detected
        existing_answer.face_score = answer_data.face_score
        db.commit()
        db.refresh(existing_answer)
        return existing_answer
    
    # Create new answer
    answer = SurveyAnswer(
        submission_id=submission_id,
        question_id=answer_data.question_id,
        answer=answer_data.answer,
        face_detected=answer_data.face_detected,
        face_score=answer_data.face_score
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


@router.post("/submissions/{submission_id}/media", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def upload_media(
    submission_id: int,
    file: UploadFile = File(...),
    type: str = Form(...),
    question_number: int = Form(None),
    db: Session = Depends(get_db)
):
    """Upload media file (video or image)."""
    # File size limits (in bytes)
    MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
    MAX_IMAGE_SIZE = 10 * 1024 * 1024    # 10MB
    
    # Check if submission exists
    submission = db.query(SurveySubmission).filter(SurveySubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Validate type
    if type not in ["video", "image"]:
        raise HTTPException(status_code=400, detail="Type must be 'video' or 'image'")
    
    # Validate file type matches declared type
    if type == "video" and file.content_type and not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Invalid video file type")
    if type == "image" and file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file type")
    
    # Read file content with size limit
    max_size = MAX_VIDEO_SIZE if type == "video" else MAX_IMAGE_SIZE
    file_content = b""
    total_size = 0
    
    # Stream read to avoid loading entire file into memory at once
    while True:
        chunk = await file.read(1024 * 1024)  # Read 1MB chunks
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size for {type} is {max_size // (1024 * 1024)}MB"
            )
        file_content += chunk
    
    # Save file
    file_path = save_media_file(
        file_content,
        submission_id,
        type,
        question_number
    )
    
    # Create media file record
    media_file = MediaFile(
        submission_id=submission_id,
        type=type,
        path=file_path
    )
    db.add(media_file)
    
    # If this is an image and we have a question_number, update the answer's face_image_path
    if type == "image" and question_number:
        # Find the question by order
        submission = db.query(SurveySubmission).filter(SurveySubmission.id == submission_id).first()
        if submission:
            question = db.query(SurveyQuestion).filter(
                SurveyQuestion.survey_id == submission.survey_id,
                SurveyQuestion.order == question_number
            ).first()
            if question:
                # Find the answer for this question
                answer = db.query(SurveyAnswer).filter(
                    SurveyAnswer.submission_id == submission_id,
                    SurveyAnswer.question_id == question.id
                ).first()
                if answer:
                    # Store relative path for URL access
                    from app.utils.media import get_media_root
                    media_root = get_media_root()
                    # Convert absolute path to relative path
                    if file_path.startswith(media_root):
                        relative_path = file_path[len(media_root):].lstrip(os.sep).replace(os.sep, "/")
                    else:
                        # If already relative, use as is
                        relative_path = file_path.replace(os.sep, "/")
                    answer.face_image_path = f"/api/media/{relative_path}"
    
    db.commit()
    db.refresh(media_file)
    
    return media_file


@router.post("/submissions/{submission_id}/complete", response_model=SubmissionResponse)
async def complete_submission(
    submission_id: int,
    complete_data: SubmissionComplete,
    db: Session = Depends(get_db)
):
    """Complete a survey submission."""
    # Check if submission exists
    submission = db.query(SurveySubmission).filter(SurveySubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Check if already completed
    if submission.completed_at:
        raise HTTPException(status_code=400, detail="Submission already completed")
    
    # Check if all 5 answers are submitted
    answer_count = db.query(SurveyAnswer).filter(SurveyAnswer.submission_id == submission_id).count()
    if answer_count < 5:
        raise HTTPException(
            status_code=400,
            detail=f"Submission must have 5 answers. Currently has {answer_count}."
        )
    
    # Update submission
    submission.completed_at = datetime.utcnow()
    submission.overall_score = complete_data.overall_score
    db.commit()
    db.refresh(submission)
    
    return submission


@router.get("/submissions/{submission_id}", response_model=SubmissionDetailResponse)
async def get_submission(submission_id: int, db: Session = Depends(get_db)):
    """Get a single submission with answers."""
    submission = db.query(SurveySubmission).filter(SurveySubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Get answers with questions
    answers = db.query(SurveyAnswer).filter(SurveyAnswer.submission_id == submission_id).all()
    questions = {q.id: q for q in db.query(SurveyQuestion).filter(
        SurveyQuestion.survey_id == submission.survey_id
    ).all()}
    
    # Build answer list with question text
    answer_list = []
    for answer in sorted(answers, key=lambda x: questions[x.question_id].order):
        question = questions[answer.question_id]
        answer_list.append(AnswerWithQuestion(
            id=answer.id,
            question_id=answer.question_id,
            question_text=question.question_text,
            question_order=question.order,
            answer=answer.answer,
            face_detected=answer.face_detected,
            face_score=answer.face_score,
            face_image_path=answer.face_image_path
        ))
    
    return SubmissionDetailResponse(
        id=submission.id,
        survey_id=submission.survey_id,
        ip_address=submission.ip_address,
        device=submission.device,
        browser=submission.browser,
        os=submission.os,
        location=submission.location,
        started_at=submission.started_at,
        completed_at=submission.completed_at,
        overall_score=submission.overall_score,
        answers=answer_list
    )


@router.get("/surveys/{survey_id}/submissions", response_model=SubmissionListResponse)
async def get_submissions_by_survey(survey_id: int, db: Session = Depends(get_db)):
    """Get all submissions for a survey."""
    # Check if survey exists
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    # Get all submissions for this survey
    submissions = db.query(SurveySubmission).filter(
        SurveySubmission.survey_id == survey_id
    ).order_by(SurveySubmission.started_at.desc()).all()
    
    return SubmissionListResponse(submissions=submissions)


@router.delete("/submissions/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_submission(submission_id: int, db: Session = Depends(get_db)):
    """Delete a submission and all associated data."""
    submission = db.query(SurveySubmission).filter(SurveySubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Delete associated media files from filesystem
    media_files = db.query(MediaFile).filter(MediaFile.submission_id == submission_id).all()
    for media_file in media_files:
        if os.path.exists(media_file.path):
            try:
                os.remove(media_file.path)
            except Exception as e:
                print(f"Error deleting media file {media_file.path}: {e}")
    
    # Delete submission (cascade will delete answers and media_file records)
    db.delete(submission)
    db.commit()
    
    return None


@router.get("/submissions/{submission_id}/export")
async def export_submission(submission_id: int, db: Session = Depends(get_db)):
    """Export submission as ZIP file."""
    # Get submission
    submission = db.query(SurveySubmission).filter(SurveySubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Get survey
    survey = db.query(Survey).filter(Survey.id == submission.survey_id).first()
    
    # Get answers with questions
    answers = db.query(SurveyAnswer).filter(SurveyAnswer.submission_id == submission_id).all()
    questions = {q.id: q for q in db.query(SurveyQuestion).filter(
        SurveyQuestion.survey_id == submission.survey_id
    ).all()}
    
    # Get media files
    media_files = db.query(MediaFile).filter(MediaFile.submission_id == submission_id).all()
    
    # Build metadata JSON
    responses = []
    for answer in sorted(answers, key=lambda x: questions[x.question_id].order):
        question = questions[answer.question_id]
        face_image_path = None
        
        # Find face image for this question
        for media in media_files:
            if media.type == "image" and f"_q{question.order}_" in media.path:
                face_image_path = f"/images/q{question.order}_face.png"
                break
        
        responses.append({
            "question": question.question_text,
            "answer": answer.answer,
            "face_detected": answer.face_detected,
            "score": answer.face_score,
            "face_image": face_image_path
        })
    
    metadata = {
        "submission_id": str(submission_id),
        "survey_id": str(submission.survey_id),
        "started_at": submission.started_at.isoformat() + "Z",
        "completed_at": submission.completed_at.isoformat() + "Z" if submission.completed_at else None,
        "ip_address": submission.ip_address,
        "device": submission.device,
        "browser": submission.browser,
        "os": submission.os,
        "location": submission.location,
        "responses": responses,
        "overall_score": submission.overall_score
    }
    
    # Create ZIP file - use ZIP_STORED (no compression) for faster generation
    # Compression saves space but takes time, ZIP_STORED is instant
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_STORED) as zip_file:
        # Add metadata.json
        zip_file.writestr("metadata.json", json.dumps(metadata, indent=2))
        
        # Pre-organize files for better performance
        video_files = [m for m in media_files if m.type == "video"]
        image_files = [m for m in media_files if m.type == "image"]
        
        # Add full session video only (assignment requirement - no question-specific videos)
        full_video = None
        for media in video_files:
            if os.path.exists(media.path) and os.path.getsize(media.path) > 0:
                if "full" in media.path.lower():
                    full_video = media.path
                    break
        
        if full_video:
            try:
                zip_file.write(full_video, "videos/full_session.mp4")
            except Exception as e:
                print(f"Error adding full video to ZIP: {e}")
        
        # Add face images
        for media in image_files:
            if os.path.exists(media.path) and os.path.getsize(media.path) > 0:
                # Determine question number from path
                question_num = None
                for answer in answers:
                    q = questions[answer.question_id]
                    if f"_q{q.order}_" in media.path:
                        question_num = q.order
                        break
                if question_num:
                    try:
                        zip_file.write(media.path, f"images/q{question_num}_face.png")
                    except Exception as e:
                        print(f"Error adding image {media.path} to ZIP: {e}")
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=submission_{submission_id}_export.zip"
        }
    )


@router.get("/submissions/{submission_id}/media/{media_id}")
async def get_media_file(
    submission_id: int,
    media_id: int,
    db: Session = Depends(get_db)
):
    """Serve a media file (image or video)."""
    # Check if submission exists
    submission = db.query(SurveySubmission).filter(SurveySubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Get media file
    media_file = db.query(MediaFile).filter(
        MediaFile.id == media_id,
        MediaFile.submission_id == submission_id
    ).first()
    
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    if not os.path.exists(media_file.path):
        raise HTTPException(status_code=404, detail="Media file not found on disk")
    
    # Determine media type
    media_type = "image/png" if media_file.type == "image" else "video/mp4"
    
    return FileResponse(
        media_file.path,
        media_type=media_type,
        filename=os.path.basename(media_file.path)
    )


@router.get("/media/{path:path}")
async def serve_media_file(path: str):
    """Serve media files by path."""
    from app.utils.media import get_media_root
    
    media_root = get_media_root()
    
    # Handle both relative paths (images/...) and full paths
    # Path comes as "images/submission_XX_qX_face_...png" from face_image_path
    if os.path.isabs(path) and path.startswith(media_root):
        # Full absolute path provided
        file_path = path
    else:
        # Relative path provided (e.g., "images/submission_XX_qX_face_...png")
        # Normalize path separators
        path = path.replace("\\", "/").lstrip("/")
        file_path = os.path.join(media_root, path)
    
    # Security check: ensure file is within media root
    abs_media_root = os.path.abspath(media_root)
    abs_file_path = os.path.abspath(file_path)
    if not abs_file_path.startswith(abs_media_root):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    
    # Determine media type from extension
    if file_path.endswith(('.png', '.jpg', '.jpeg', '.gif')):
        media_type = "image/png" if file_path.endswith('.png') else "image/jpeg"
    elif file_path.endswith(('.mp4', '.webm')):
        media_type = "video/mp4"
    else:
        media_type = "application/octet-stream"
    
    return FileResponse(
        file_path,
        media_type=media_type,
        filename=os.path.basename(file_path)
    )
