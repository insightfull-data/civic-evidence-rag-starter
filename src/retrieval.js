import OpenAI from "openai";
import { pool } from "./db.js";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

export async function embedText(text) {
  if (!openai) return null;
  const response = await openai.embeddings.create({ model: embeddingModel, input: text });
  return response.data[0].embedding;
}

export async function retrieveDocuments(question, limit = 4) {
  const embedding = await embedText(question);
  const params = [question, limit];
  let vectorClause = "0";

  if (embedding) {
    params.push(`[${embedding.join(",")}]`);
    vectorClause = "1 - (embedding <=> $3::vector)";
  }

  const result = await pool.query(
    `SELECT id, title, content, source_name, as_of_date,
       ts_rank(search_vector, websearch_to_tsquery('english', $1)) AS keyword_score,
       ${vectorClause} AS vector_score
     FROM evidence_documents
     ORDER BY (ts_rank(search_vector, websearch_to_tsquery('english', $1)) * 0.6 + ${vectorClause} * 0.4) DESC,
              title ASC
     LIMIT $2`,
    params
  );

  return result.rows;
}
