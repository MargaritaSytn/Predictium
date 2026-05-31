FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

COPY entrypoint.sh .
ENTRYPOINT ["sh", "entrypoint.sh"]
# Render injects $PORT at runtime; fall back to 8000 for local runs.
# Shell form (sh -c) is required so $PORT expands inside the container.
CMD ["sh", "-c", "gunicorn predictium.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 120"]
