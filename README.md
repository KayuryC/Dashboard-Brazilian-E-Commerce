# Dashboard Giras - E-commerce Brasileiro (Olist)

Dashboard fullstack para analise estatistica e exploratoria de e-commerce brasileiro com base no dataset publico da Olist (Kaggle), cobrindo o periodo de **2016-09-04 a 2018-10-17**.

## Contexto academico (LAUDA)

Este projeto foi desenvolvido para a atividade de sala focada em:

- selecao de dataset no Kaggle
- analise exploratoria com Pandas
- tratamento e consolidacao dos dados
- construcao de dashboard interativo para gerar insights

No modulo de Estatistica e Probabilidade, a narrativa foi estruturada em 4 blocos:

- Bloco 1: como os dados se distribuem
- Bloco 2: como o processo funciona
- Bloco 3: o que influencia o resultado
- Bloco 4: qual o risco disso acontecer

## Stack

Backend:

- Python 3.12+
- FastAPI
- Pandas
- Uvicorn
- Pydantic

Frontend:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Leaflet / React-Leaflet

## Arquitetura de alto nivel

```text
dashboard-giras/
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   └── routes.py
│   ├── schemas/
│   │   └── dashboard.py
│   ├── services/
│   │   ├── data_loader.py
│   │   ├── preprocessing.py
│   │   ├── filters.py
│   │   ├── summary.py
│   │   ├── overview.py
│   │   ├── sales.py
│   │   ├── orders.py
│   │   ├── customers.py
│   │   ├── delivery.py
│   │   ├── reviews.py
│   │   ├── relationships.py
│   │   ├── dataset_study.py
│   │   └── modeling.py
│   ├── data/raw/
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── statistics/page.tsx
│   │   ├── statistics/bloco-1/page.tsx
│   │   ├── statistics/bloco-2/page.tsx
│   │   ├── statistics/bloco-3/page.tsx
│   │   ├── statistics/bloco-4/page.tsx
│   │   └── modeling/page.tsx
│   ├── components/
│   ├── lib/
│   ├── services/
│   └── package.json
└── README.md
```

## Como o sistema funciona (fluxo)

1. O backend carrega os CSVs do Olist.
2. A camada de preprocessing padroniza tipos, trata datas e cria colunas derivadas.
3. As tabelas sao unificadas em um dataset analitico consolidado.
4. Os servicos calculam KPIs, agregacoes, correlacoes e probabilidades.
5. O FastAPI expoe endpoints filtraveis (`state`, `city`, `start_date`, `end_date`).
6. O frontend Next.js consome os endpoints e renderiza os blocos analiticos com filtros globais.

## Partes principais do backend

`backend/services` (regra de negocio):

- `data_loader.py`: localiza e carrega CSVs, padroniza tipos iniciais.
- `preprocessing.py`: faz merges principais, cria colunas derivadas e mantem cache da base consolidada.
- `filters.py`: aplica filtros globais (`estado`, `cidade`, `periodo`) com normalizacao de texto.
- `summary.py`: endpoint agregado para carregar a visao executiva com menos round trips.
- `overview.py`: KPIs gerais (pedidos, receita, ticket, atraso, nota media).
- `sales.py`: agregacoes de receita por tempo, estado, cidade e categoria.
- `orders.py`: distribuicao de status com labels traduzidas para uso no frontend.
- `delivery.py`: analise de prazo real vs estimado, SLA e risco de entrega.
- `relationships.py`: correlacoes, scatter, boxplots e matriz de correlacao.

`backend/app/routes.py`:

- centraliza os endpoints da API (`/api/v1/*`), valida filtros e aplica `response_model` com Pydantic.

`backend/schemas/dashboard.py`:

- define o contrato de dados entre backend e frontend (tipos de resposta de cada endpoint).

## Partes principais do frontend

Rotas de pagina:

- `/`: Home com entrada dos modulos.
- `/statistics`: Resumo Executivo + Destaques.
- `/statistics/bloco-1`: distribuicao de ticket (estatistica descritiva).
- `/statistics/bloco-2`: desempenho logistico (tempo e atraso).
- `/statistics/bloco-3`: relacao entre variaveis (correlacao e impacto).
- `/statistics/bloco-4`: probabilidade e risco operacional.
- `/modeling`: regressao linear, previsao e validacao estatistica.

Componentes-chave:

- `components/filters/statistics-global-filters.tsx`: barra de filtros globais com botao aplicar/limpar.
- `components/navigation/hamburger-menu.tsx`: navegacao entre Home, modulo e blocos.
- `components/charts/*`: biblioteca visual dos graficos (Recharts).
- `components/maps/*`: mapa por estado com Leaflet.
- `services/api.ts`: camada de consumo de endpoints do backend.

Leitura da narrativa no modulo Estatistica e Probabilidade:

- Bloco 1 -> como os dados se distribuem.
- Bloco 2 -> como o processo de entrega funciona.
- Bloco 3 -> o que influencia o resultado.
- Bloco 4 -> qual o risco operacional.

## Dataset utilizado

Arquivos esperados em `backend/data/raw/`:

- `olist_orders_dataset.csv`
- `olist_order_items_dataset.csv`
- `olist_customers_dataset.csv`
- `olist_products_dataset.csv`
- `olist_order_reviews_dataset.csv`
- `olist_order_payments_dataset.csv`
- `product_category_name_translation.csv`

Observacao:

- O backend tenta primeiro `backend/data/raw`.
- Se nao existir, tenta `data/raw` na raiz do projeto.

## Endpoints principais

Saude e filtros:

- `GET /api/v1/health`
- `GET /api/v1/filters/date-range`

Resumo e operacao:

- `GET /api/v1/metrics/overview`
- `GET /api/v1/statistics/summary`
- `GET /api/v1/orders/by-status`
- `GET /api/v1/sales/monthly`
- `GET /api/v1/sales/by-state`
- `GET /api/v1/sales/by-city`
- `GET /api/v1/sales/by-category`

Blocos analiticos:

- `GET /api/v1/statistics/descriptive/order-values` (Bloco 1)
- `GET /api/v1/statistics/descriptive/delivery-time` (Bloco 2)
- `GET /api/v1/statistics/relationships` (Bloco 3)
- `GET /api/v1/statistics/probability/delivery-risk` (Bloco 4)

Modelagem estatistica:

- `GET /api/v1/modeling/summary` (regressao linear + previsao + testes de hipotese + IC)

Documentacao interativa:

- Swagger UI: `http://127.0.0.1:8000/docs`

## Inicializacao completa (backend + frontend)

Resumo rapido: voce precisa de **2 terminais** (um para API e outro para UI).

### 1) Backend (Terminal 1)

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Se `python3.12` nao existir no seu ambiente, use:

```bash
python3 -m venv .venv
```

Backend rodando em:

- `http://127.0.0.1:8000`

### 2) Frontend (Terminal 2)

```bash
cd frontend
npm install
export NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm run dev
```

Frontend rodando em:

- `http://127.0.0.1:3000`

## Execucao diaria (apos setup inicial)

Terminal 1 (backend):

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2 (frontend):

```bash
cd frontend
export NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm run dev
```

## Build de producao local

Frontend:

```bash
cd frontend
npm run build
npm run start
```

Backend:

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

## Troubleshooting rapido

Porta 8000 em uso:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
kill <PID>
```

Porta 3000 em uso:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
kill <PID>
```

Frontend sem comunicar com backend:

- confirmar backend ativo em `127.0.0.1:8000`
- confirmar `NEXT_PUBLIC_API_URL`
- confirmar que nao ha erro CORS ou erro 500 no backend

## Filtros globais

Todos os blocos do modulo de Estatistica e Probabilidade usam filtros globais:

- periodo inicial/final
- estado (UF)
- cidade (dependente do estado)

Exemplo de query:

```text
/api/v1/metrics/overview?state=SP&city=Sao%20Paulo&start_date=2018-01-01&end_date=2018-06-30
```

## Status atual do modulo Estatistica e Probabilidade

- Home de estatistica com resumo executivo e destaques
- Bloco 1 (Estatistica Descritiva)
- Bloco 2 (Tempo de Entrega)
- Bloco 3 (Relacao entre Variaveis)
- Bloco 4 (Probabilidade e Risco Operacional)

## Licenca e uso academico

Projeto desenvolvido para fins academicos e demonstracao de analise de dados.
