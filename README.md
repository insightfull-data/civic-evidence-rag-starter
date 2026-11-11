# Civic Evidence RAG Starter

A small, open-source demonstration of ordinary retrieval-augmented generation and bounded GraphRAG using fictional civic transit data.

The starter answers one practical question:

> If Central Station closes, which routes and districts are connected to the affected part of the network?

It is intentionally smaller than a production system. The goal is to make the evidence path inspectable:

1. PostgreSQL full-text search retrieves relevant records.
2. Optional OpenAI embeddings add vector retrieval.
3. A recursive SQL query traverses sourced graph relationships.
4. An optional language model explains the evidence.
5. A deterministic fallback works without an AI key.
6. Every answer states what the graph cannot prove.

All places, services and observations are fictional.

## What GraphRAG adds

Ordinary RAG can retrieve a record mentioning Central Station. The graph follows explicit relationships:

```text
Station -> CONNECTS_TO -> Route -> SERVES_DISTRICT -> District
```

The graph is bounded to approved node types, approved relationship types and no more than five hops. Each edge retains a source label.

This demonstrates **potential network reach**, not passenger impact. The sample cannot prove demand, delay, rider behaviour or replacement capacity.

## Run locally with Docker

Requirements: Docker Desktop and Docker Compose.

```bash
git clone https://github.com/insightfull-data/civic-evidence-rag-starter.git
cd civic-evidence-rag-starter
cp .env.example .env
docker compose up -d db
npm install
npm run db:setup
npm start
```

Open `http://localhost:8080`.

The application works without `OPENAI_API_KEY`. In that mode it uses PostgreSQL full-text retrieval and a deterministic answer template. Add an OpenAI key to `.env` to enable embeddings and model-assisted explanation.

## Run everything in containers

```bash
docker compose up -d db
docker compose run --rm app npm run db:setup
docker compose up app
```

## Deploy to DigitalOcean

The repository includes [`.do/app.yaml`](.do/app.yaml) for DigitalOcean App Platform.

### 1. Create the database

Create a DigitalOcean Managed PostgreSQL cluster. Confirm that the selected PostgreSQL service permits the `vector` and `pg_trgm` extensions. Copy its connection string.

For a low-cost demonstration, a PostgreSQL container can run on a Droplet instead, but a managed database is the better production pattern.

### 2. Create the app

In DigitalOcean:

1. Choose **Create > Apps**.
2. Connect this GitHub repository.
3. Select **Import from App Spec** and use `.do/app.yaml`.
4. Set `DATABASE_URL` as an encrypted runtime value.
5. Optionally set `OPENAI_API_KEY` as an encrypted runtime value.
6. Deploy the app.

The pre-deploy job creates the schema and loads the fictional dataset. It is idempotent and can be run again after sample-data changes.

### 3. Verify

Visit `/health`, then open the application and run the sample question. Confirm that the page shows:

- retrieved evidence records;
- graph relationships and their sources;
- the answer-generation mode;
- the evidence limitation.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | No | Enables embeddings and model-assisted explanation |
| `OPENAI_CHAT_MODEL` | No | Defaults to `gpt-4.1-mini` |
| `OPENAI_EMBEDDING_MODEL` | No | Defaults to `text-embedding-3-small` |
| `MAX_GRAPH_HOPS` | No | Defaults to 4 and is capped at 5 |

## Repository structure

```text
data/       fictional documents and network
public/     browser interface
scripts/    schema and seed commands
sql/        PostgreSQL and pgvector schema
src/        retrieval, graph traversal and answering
test/       boundary and graph tests
.do/        DigitalOcean App Platform specification
```

## Adapt it to another domain

Replace the fictional transit entities with a bounded network such as:

- suppliers, components and facilities;
- public services, locations and communities;
- policies, obligations and responsible teams;
- systems, dependencies and incidents.

Keep the important controls: defined relationships, source lineage, traversal limits, evidence-aware prompts and an explicit statement of what the graph cannot establish.

## Security notes

- Never commit `.env` or API keys.
- Use a read-only database role for question-time access in a production implementation.
- Add authentication, rate limits and audit logging before exposing model-backed endpoints publicly.
- Treat retrieved text as untrusted evidence, not instructions.

## License

MIT
