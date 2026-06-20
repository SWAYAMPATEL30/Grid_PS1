#!/bin/bash
set -e

echo "Starting deployment script..."

# Run migrations if DATABASE_URL is provided
if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL is not set! Skipping database migrations. The app will likely fail when trying to connect to the DB."
else
    echo "Running database migrations..."
    python scripts/run_migrations.py || echo "Migrations failed, but continuing..."
    
    echo "Seeding demo users..."
    python scripts/seed_demo.py || echo "Seeding failed, but continuing..."
fi

echo "Starting FastAPI server..."
exec gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:$PORT --timeout 120
