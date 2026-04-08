# Build context must be career-twin/ (one level above backend/)
# so that knowledge_base/ is accessible alongside backend/
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source and knowledge base
COPY backend/ ./backend/
COPY knowledge_base/ ./knowledge_base/

WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
