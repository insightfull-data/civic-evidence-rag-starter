import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { pool, closePool } from "../src/db.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const documents = JSON.parse(await fs.readFile(path.join(root, "data", "documents.json"), "utf8"));
const network = JSON.parse(await fs.readFile(path.join(root, "data", "network.json"), "utf8"));
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

try {
  await pool.query("BEGIN");
  await pool.query("TRUNCATE graph_edges, graph_nodes, evidence_documents CASCADE");

  let embeddings = [];
  if (openai) {
    const result = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      input: documents.map((item) => `${item.title}\n${item.content}`)
    });
    embeddings = result.data.map((item) => item.embedding);
  }

  for (const [index, document] of documents.entries()) {
    const embedding = embeddings[index] ? `[${embeddings[index].join(",")}]` : null;
    await pool.query(
      `INSERT INTO evidence_documents (id, title, content, source_name, as_of_date, embedding)
       VALUES ($1, $2, $3, $4, $5, $6::vector)`,
      [document.id, document.title, document.content, document.source, document.asOf, embedding]
    );
  }
  for (const node of network.nodes) {
    await pool.query("INSERT INTO graph_nodes (id, node_type, name) VALUES ($1, $2, $3)", [node.id, node.type, node.name]);
  }
  for (const edge of network.edges) {
    await pool.query(
      "INSERT INTO graph_edges (from_id, to_id, edge_type, source_name) VALUES ($1, $2, $3, $4)",
      [edge.from, edge.to, edge.type, edge.source]
    );
  }
  await pool.query("COMMIT");
  console.log(`Seeded ${documents.length} documents, ${network.nodes.length} nodes and ${network.edges.length} edges.`);
} catch (error) {
  await pool.query("ROLLBACK");
  throw error;
} finally {
  await closePool();
}
