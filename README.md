# Predictium

Соціальна платформа прогнозів, де користувачі прогнозують реальні події за допомогою віртуальних токенів.

## Tech Stack
- **Backend:** Django 6 + DRF + JWT
- **Frontend:** React 19 + TypeScript + Vite
- **Database:** PostgreSQL (Neon)
- **Payments:** PayPal
- **Hosting:** Render (backend + frontend)

## Локальний запуск

### 1. Клонування

```bash
git clone https://github.com/your-username/Predictium.git
cd Predictium
```

### 2. Налаштування оточення

Скопіюй `.env.example` в `.env` та заповни значення:

```bash
cp .env.example .env
```

### 3. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Бекенд запуститься на http://localhost:8000

### 4. Frontend (в окремому терміналі)

```bash
cd frontend
npm install
npm run dev
```

Фронтенд запуститься на http://localhost:5173

Vite автоматично проксює `/api` запити на бекенд (`localhost:8000`).

### 5. Створення адміна (опціонально)

```bash
cd backend
source venv/bin/activate
python manage.py createsuperuser
```

Адмін-панель: http://localhost:8000/admin/
