FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY *.py ./
# Two processes: mask decoding is pure Python, so the photos of one Golden Plate read decode side by side.
CMD exec uvicorn app:app --host 0.0.0.0 --port ${PORT:-8080} --workers 2
