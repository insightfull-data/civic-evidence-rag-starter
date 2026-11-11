CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS evidence_documents (
  id text PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  source_name text NOT NULL,
  as_of_date date NOT NULL,
  embedding vector(1536),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED
);
CREATE INDEX IF NOT EXISTS evidence_documents_search_idx ON evidence_documents USING gin(search_vector);
CREATE INDEX IF NOT EXISTS evidence_documents_embedding_idx ON evidence_documents USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS graph_nodes (
  id text PRIMARY KEY,
  node_type text NOT NULL CHECK (node_type IN ('LINE','STATION','ROUTE','DISTRICT')),
  name text NOT NULL
);
CREATE INDEX IF NOT EXISTS graph_nodes_name_trgm_idx ON graph_nodes USING gin(lower(name) gin_trgm_ops);

CREATE TABLE IF NOT EXISTS graph_edges (
  id bigserial PRIMARY KEY,
  from_id text NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
  to_id text NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
  edge_type text NOT NULL CHECK (edge_type IN ('ON_LINE','NEXT_STATION','CONNECTS_TO','IN_DISTRICT','SERVES_DISTRICT')),
  source_name text NOT NULL,
  UNIQUE (from_id, to_id, edge_type)
);
CREATE INDEX IF NOT EXISTS graph_edges_from_idx ON graph_edges(from_id);
CREATE INDEX IF NOT EXISTS graph_edges_to_idx ON graph_edges(to_id);
