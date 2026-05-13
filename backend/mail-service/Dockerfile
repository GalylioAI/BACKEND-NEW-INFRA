FROM python:3.12-slim

WORKDIR /app
COPY mail-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY mail-service .

CMD ["python", "main.py"]
