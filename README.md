# Personal Memory Hub

A personal database of "things my AI assistants should know about me", so Claude, GPT and others
can read the same context instead of me re-explaining it to each one.

**v1 (this repo):** FastAPI + PostgreSQL REST API for memories (CRUD, keyword search, tag filter),
and a React UI. The MCP server comes later.

```
memory-hub/
├── docker-compose.yml        # Postgres 16 (creates memory_hub + memory_hub_test)
├── backend/                  # FastAPI + SQLAlchemy 2 + psycopg 3
│   ├── app/
│   │   ├── main.py           # app, CORS, create tables on startup
│   │   ├── db.py             # engine, session dependency
│   │   ├── models.py         # Memory table
│   │   ├── schemas.py        # Pydantic request/response models
│   │   └── routers/memories.py
│   └── tests/                # pytest, runs against a real Postgres
└── frontend/                 # Vite + React 19 (plain JavaScript)
    └── src/
        ├── api.js            # fetch wrapper for the backend
        ├── App.jsx
        └── components/
            ├── MemoryForm.jsx    # done
            ├── TagFilter.jsx     # done
            ├── MemoryList.jsx    # ← PRACTICE 1 (you)
            ├── SearchBox.jsx     # ← PRACTICE 2 (you)
            └── __tests__/        # specs for the two practice components
```

## Run it

```bash
# 1. Database
docker compose up -d

# 2. Backend  (http://localhost:8000/docs for Swagger UI)
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
pytest -q                      # 13 tests, uses memory_hub_test

# 3. Frontend (http://localhost:5173, /api is proxied to :8000)
cd frontend
npm install
npm run dev
npm test                       # practice specs — they fail until you implement the components
```

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/memories?q=&tag=&limit=20&offset=0` | `{items, total}`, newest first |
| POST | `/api/memories` | `{title, content, tags?, source?}` → 201 |
| GET | `/api/memories/{id}` | 404 if missing |
| PATCH | `/api/memories/{id}` | only the fields you send are changed |
| DELETE | `/api/memories/{id}` | 204 |
| GET | `/api/tags` | `[{tag, count}]`, most used first |

## Practice components (for the NVIDIA Svelte/React round)

Each stub file lists its requirements at the top; each requirement has a test.

1. **`MemoryList.jsx`**: fetch on mount and when props change, loading / error + Retry / empty
   states, and the race condition (a slow old response must not overwrite a newer one).
   ~25 min.
2. **`SearchBox.jsx`**: controlled input + debounce with `setTimeout`, Escape to clear, timer
   cleanup on unmount. ~15 min.

Suggested loop: time-box it, talk out loud as if in the interview, then `npm test -- MemoryList`.
Bonus: rewrite one of them in Svelte afterwards and compare.

## Design notes (talking points)

- **Search uses `ILIKE`, not Postgres full-text search.** The built-in text-search parsers split on
  spaces, so Chinese text isn't broken into words. `ILIKE '%…%'` works for both languages but
  can't use a normal B-tree index. Next step: a `pg_trgm` GIN index (fast substring search), or
  embeddings with `pgvector` for semantic search.
- **LIKE wildcards are escaped**, so searching `50%` matches the literal text.
- **PATCH uses `exclude_unset`**: only fields the client sent are written, so two clients editing
  different fields don't overwrite each other's work.
- **Tags are a Postgres `text[]`**, filtered with `@>`. Fine for one user; a `tags` join table is
  the move if tags need metadata or rename-everywhere.
- **Tables are created on startup** (`create_all`). Switch to Alembic once the schema changes.

## Next steps

- [ ] MCP server exposing `search_memories` / `add_memory` so Claude/GPT can use the hub
- [ ] Auth (it's personal data: at least an API key before exposing it beyond localhost)
- [ ] Alembic migrations
- [ ] `pg_trgm` index, then semantic search with `pgvector`
- [ ] Import existing memories (Claude memory export, GPT memory)
