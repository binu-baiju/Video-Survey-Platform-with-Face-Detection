#!/bin/bash

# Video Survey Platform Setup Script

echo "🚀 Setting up Video Survey Platform..."

# Create media directories
echo "📁 Creating media directories..."
mkdir -p backend/media/videos backend/media/images

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Build and start services
echo "🐳 Building and starting Docker containers..."
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec backend alembic upgrade head

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Access the frontend at: http://localhost:3000"
echo "2. Access the backend API docs at: http://localhost:8000/docs"
echo "3. Access the admin dashboard at: http://localhost:3000/admin"
echo ""
echo "To stop the services, run: docker-compose down"
