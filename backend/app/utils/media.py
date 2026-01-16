import os
import uuid
from pathlib import Path
from typing import Optional
from datetime import datetime


def get_media_root() -> str:
    """Get media root directory from environment."""
    return os.getenv("MEDIA_ROOT", "./media")


def ensure_media_directories():
    """Ensure media directories exist."""
    media_root = get_media_root()
    Path(f"{media_root}/videos").mkdir(parents=True, exist_ok=True)
    Path(f"{media_root}/images").mkdir(parents=True, exist_ok=True)


def get_media_path(submission_id: int, media_type: str, question_number: Optional[int] = None) -> str:
    """Generate media file path."""
    ensure_media_directories()
    media_root = get_media_root()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    
    if media_type == "video":
        if question_number:
            filename = f"submission_{submission_id}_q{question_number}_{timestamp}_{unique_id}.mp4"
        else:
            filename = f"submission_{submission_id}_full_{timestamp}_{unique_id}.mp4"
        return f"{media_root}/videos/{filename}"
    elif media_type == "image":
        if question_number:
            filename = f"submission_{submission_id}_q{question_number}_face_{timestamp}_{unique_id}.png"
        else:
            filename = f"submission_{submission_id}_face_{timestamp}_{unique_id}.png"
        return f"{media_root}/images/{filename}"
    else:
        raise ValueError(f"Invalid media type: {media_type}")


def save_media_file(file_content: bytes, submission_id: int, media_type: str, question_number: Optional[int] = None) -> str:
    """Save media file and return path."""
    file_path = get_media_path(submission_id, media_type, question_number)
    
    # Ensure directory exists
    Path(file_path).parent.mkdir(parents=True, exist_ok=True)
    
    # Write file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    return file_path
