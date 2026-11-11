import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, closePool } from "../src/db.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

try {
  const sql = await fs.readFile(path.join(root, "sql", "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("Database schema is ready.");
} finally {
  await closePool();
}
