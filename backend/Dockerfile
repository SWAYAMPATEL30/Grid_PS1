FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN addgroup --gid 1001 appgroup && adduser --uid 1001 --gid 1001 --disabled-password appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

# Create upload directory and set ownership
RUN mkdir -p /app/data/uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Production: 4 worker processes, each with uvicorn workers for async support
# Dev: use CMD override in docker-compose.yml
CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "--bind", "0.0.0.0:8000", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
