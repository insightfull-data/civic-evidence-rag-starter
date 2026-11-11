import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { pool } from "./db.js";
import { retrieveDocuments } from "./retrieval.js";
import { findNodeByName, traverseGraph } from "./graph.js";
import { summarizeGraph } from "./graph-utils.js";
import { composeAnswer } from "./answer.js";

const app = express();
const port = Number(process.env.PORT || 8080);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(root, "public")));

app.get("/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({ ok: true });
  } catch (error) {
    response.status(503).json({ ok: false, error: error.message });
  }
});

app.post("/api/ask", async (request, response) => {
  try {
    const question = String(request.body?.question || "").trim();
    const entity = String(request.body?.entity || "Central Station").trim();
    if (question.length < 5 || question.length > 500) {
      return response.status(400).json({ error: "Question must be between 5 and 500 characters." });
    }

    const startNode = await findNodeByName(entity);
    if (!startNode) return response.status(404).json({ error: "No matching graph entity was found." });

    const [documents, graphRows] = await Promise.all([
      retrieveDocuments(question),
      traverseGraph(startNode.id, process.env.MAX_GRAPH_HOPS || 4)
    ]);
    const graph = summarizeGraph(graphRows);
    const answer = await composeAnswer(question, startNode, graph, documents);

    response.json({
      question,
      answer,
      evidence: documents,
      graph,
      method: {
        retrieval: process.env.OPENAI_API_KEY ? "keyword + vector" : "Postgres full-text",
        graph: "bounded recursive traversal",
        generation: answer.mode
      }
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "The request could not be completed.", detail: error.message });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Civic Evidence RAG Starter listening on port ${port}`);
});
