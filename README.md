# Dashboard Giras

Stack definido:

- Backend: Python 3.12, FastAPI, Pandas, Uvicorn, Pydantic
- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Recharts

## Estrutura

```text
dashboard-giras/
├── backend/
│   ├── app/
│   ├── data/
│   ├── services/
│   ├── schemas/
│   └── main.py
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── services/
│
└── data/
    └── raw/
```

## Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API disponível em `http://localhost:8000`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponível em `http://localhost:3000`.

Defina `NEXT_PUBLIC_API_URL` se o backend não estiver em `http://localhost:8000`.
