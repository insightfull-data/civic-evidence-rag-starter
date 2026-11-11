import { pool } from "./db.js";
import { normalizeHopLimit } from "./graph-utils.js";

export async function findNodeByName(name) {
  const result = await pool.query(
    `SELECT id, node_type, name FROM graph_nodes
     ORDER BY similarity(lower(name), lower($1)) DESC
     LIMIT 1`,
    [name]
  );
  return result.rows[0] || null;
}

export async function traverseGraph(startNodeId, maxHops = 4) {
  const hops = normalizeHopLimit(maxHops);
  const result = await pool.query(
    `WITH RECURSIVE walk AS (
       SELECT e.from_id, e.to_id, e.edge_type, e.source_name, 1 AS depth,
              ARRAY[e.from_id, e.to_id]::text[] AS visited
       FROM graph_edges e
       WHERE e.from_id = $1 OR e.to_id = $1
       UNION ALL
       SELECT e.from_id, e.to_id, e.edge_type, e.source_name, w.depth + 1,
              w.visited || CASE WHEN e.from_id = ANY(w.visited) THEN e.to_id ELSE e.from_id END
       FROM walk w
       JOIN graph_edges e ON e.from_id = w.to_id OR e.to_id = w.to_id
       WHERE w.depth < $2
         AND NOT (e.from_id = ANY(w.visited) AND e.to_id = ANY(w.visited))
     )
     SELECT DISTINCT w.depth, w.edge_type, w.source_name,
       f.id AS from_id, f.node_type AS from_type, f.name AS from_name,
       t.id AS to_id, t.node_type AS to_type, t.name AS to_name
     FROM walk w
     JOIN graph_nodes f ON f.id = w.from_id
     JOIN graph_nodes t ON t.id = w.to_id
     ORDER BY w.depth, w.edge_type, f.name, t.name`,
    [startNodeId, hops]
  );
  return result.rows;
}

