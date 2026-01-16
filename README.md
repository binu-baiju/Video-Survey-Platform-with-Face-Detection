# Video Survey Platform with Face Detection

A privacy-first video survey platform where users complete a 5-question Yes/No survey while their video is recorded with real-time face detection.

## 🏗️ Architecture Overview

### Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11+
- **Database**: PostgreSQL
- **Face Detection**: MediaPipe Face Detection (client-side)
- **Containerization**: Docker & Docker Compose

### System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Next.js   │ ──────> │   FastAPI   │ ──────> │ PostgreSQL  │
│  Frontend   │         │   Backend   │         │  Database   │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │
      │                        │
      │ (Media)                │ (Media Storage)
      │                        │
      └────────────────────────┘
                    │
            ┌───────┴───────┐
            │  Filesystem   │
            │  (Videos/     │
            │   Images)     │
            └───────────────┘
```

## 📋 Features

- ✅ Multi-step survey interface (5 Yes/No questions)
- ✅ Real-time face detection with visibility scoring (0-100)
- ✅ Single face validation (rejects no face or multiple faces)
- ✅ Video segment recording per question
- ✅ Face snapshot capture per question
- ✅ Automatic metadata capture (IP, User-Agent, Location)
- ✅ Privacy-first design (no PII collection)
- ✅ Export functionality (ZIP with metadata and media)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. Clone the repository:

```bash
git clone <your-repo-url>
cd "FRS Lab"
```

2. Start all services:

```bash
docker-compose up --build
```

3. Access the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

#### Database Setup

```bash
# Using Docker
docker run -d --name postgres-survey \
  -e POSTGRES_USER=survey_user \
  -e POSTGRES_PASSWORD=survey_pass \
  -e POSTGRES_DB=survey_db \
  -p 5432:5432 \
  postgres:15

# Run migrations
cd backend
alembic upgrade head
```

## 📁 Project Structure

```
.
├── frontend/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard
│   │   ├── survey/[id]/       # Public survey page
│   │   └── api/               # API routes (if needed)
│   ├── components/            # Reusable components
│   │   ├── Camera/            # Camera & face detection
│   │   ├── Survey/            # Survey components
│   │   └── UI/                # UI components
│   ├── lib/                   # Utilities & helpers
│   └── types/                 # TypeScript types
├── backend/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilities
│   ├── alembic/               # Database migrations
│   └── media/                 # Media storage
│       ├── videos/
│       └── images/
└── docker-compose.yml
```

## 🔌 API Endpoints

### Survey Management

- `POST /api/surveys` - Create a new survey
- `POST /api/surveys/{id}/questions` - Add questions to survey
- `GET /api/surveys/{id}` - Get survey details
- `POST /api/surveys/{id}/publish` - Publish survey

### Submission Flow

- `POST /api/surveys/{id}/start` - Start a survey submission
- `POST /api/submissions/{id}/answers` - Submit an answer
- `POST /api/submissions/{id}/media` - Upload media (video/image)
- `POST /api/submissions/{id}/complete` - Complete submission

### Export

- `GET /api/submissions/{submission_id}/export` - Export submission as ZIP

## 🗄️ Database Schema

- **Survey**: Survey metadata
- **SurveyQuestion**: Questions (exactly 5 per survey)
- **SurveySubmission**: Submission metadata
- **SurveyAnswer**: Individual answers with face scores
- **MediaFile**: Media file references

## 🔒 Privacy & Security

- No PII collection (name, email, phone)
- Only system metadata captured
- IP-based location (approximate)
- Media stored securely on filesystem
- CORS configured for frontend domain

## 🎯 Design Decisions & Trade-offs

### Face Detection (Client-side)

**Decision**: Use MediaPipe Face Detection in the browser
**Rationale**:

- Reduces server load
- Real-time feedback to users
- Privacy-friendly (processing happens locally)
- No external API dependencies

**Trade-off**: Requires modern browser with WebAssembly support

### Media Storage (Filesystem)

**Decision**: Store videos/images on filesystem, paths in database
**Rationale**:

- Simple and fast for MVP
- Easy to export as ZIP
- No additional service dependencies

**Trade-off**:

- Not scalable for high volume (should use S3/Object Storage in production)
- Requires volume mounts in Docker

### Location Detection (IP-based)

**Decision**: Use IP geolocation service
**Rationale**:

- Automatic, no user input needed
- Privacy-friendly (approximate location only)

**Trade-off**:

- Less accurate than GPS
- Requires external API call

## ⚠️ Known Limitations

1. **Face Detection**:

   - Requires good lighting conditions
   - May struggle with certain angles or occlusions
   - Browser compatibility (requires WebAssembly)

2. **Media Storage**:

   - Filesystem storage not suitable for production scale
   - No automatic cleanup of old media files
   - Single server limitation

3. **Location Accuracy**:

   - IP-based location is approximate (city-level)
   - May be inaccurate for VPN users

4. **Browser Compatibility**:

   - Requires modern browser with camera API support
   - MediaPipe requires WebAssembly support

5. **Concurrent Users**:
   - No rate limiting implemented
   - No queue system for high traffic

6. **Performance**:
   - Video uploads can be slow for large files (especially full session videos)
   - Submission process may take time due to sequential media uploads
   - ZIP generation can be slow for submissions with large video files
   - No client-side video compression before upload

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📝 Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://survey_user:survey_pass@localhost:5432/survey_db
MEDIA_ROOT=./media
IP_GEOLOCATION_API_KEY=your_api_key_here
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🔧 Development Notes

### Face Detection Library

The application uses MediaPipe Face Detection loaded from CDN. The library is dynamically imported in the browser to ensure compatibility with Next.js server-side rendering.

### Database Migrations

Run migrations manually if needed:

```bash
cd backend
alembic upgrade head
```

### Media Storage

Media files are stored in `backend/media/` directory:

- Videos: `backend/media/videos/`
- Images: `backend/media/images/`

Ensure these directories exist and have proper write permissions.

## 📊 File Size & Duration Limits

### Upload Limits

- **Videos**: Maximum 100MB per file
- **Images**: Maximum 10MB per file
- **Recommended Duration**: 30-60 seconds per question video (for optimal performance)

### Why These Limits?

- **100MB for videos**: Allows for high-quality recordings while preventing server overload
- **10MB for images**: Face snapshots are typically small PNG files
- **Duration**: Not enforced, but shorter videos (30-60s) provide better user experience

> **Note**: These limits are configurable in the backend code. For production, consider implementing client-side compression or cloud storage.

## 🐛 Troubleshooting

### Camera Access Issues

- Ensure you're using HTTPS or localhost (required for getUserMedia)
- Check browser permissions for camera access
- Try a different browser if issues persist

### File Upload Errors

- **"File too large"**: Reduce video quality or duration
- **Upload timeout**: Check network connection, try shorter videos
- **Memory errors**: Server may need more resources for very large files

### Face Detection Not Working

- Ensure you have a stable internet connection (MediaPipe loads from CDN)
- Check browser console for errors
- Verify WebAssembly is supported in your browser

### Database Connection Issues

- Verify PostgreSQL is running: `docker-compose ps`
- Check database credentials in `docker-compose.yml`
- View logs: `docker-compose logs db`

## 🤝 Contributing

This is a take-home assignment. For production use, consider:

- Adding authentication/authorization
- Implementing rate limiting
- Using cloud storage (S3, GCS)
- Adding comprehensive error logging
- Implementing retry mechanisms
- Adding monitoring and alerting
- Adding unit and integration tests
- Implementing WebSocket for real-time updates
- Adding video compression before upload

## 📄 License

MIT License

## 👤 Author

Built as a take-home assignment demonstrating full-stack development skills with:

- Clean architecture and separation of concerns
- Type-safe code (TypeScript + Pydantic)
- RESTful API design
- Modern UI/UX practices
- Docker containerization
- Database migrations
