# Dashboard-Brazilian-E-Commerce

Full-stack data dashboard for analyzing Brazilian e-commerce data (2016-2018), built with FastAPI, Pandas, and Next.js.

## Stack

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

API disponivel em `http://localhost:8000`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponivel em `http://localhost:3000`.

Defina `NEXT_PUBLIC_API_URL` se o backend nao estiver em `http://localhost:8000`.
