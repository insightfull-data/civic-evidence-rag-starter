export function normalizeHopLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 4;
  return Math.min(Math.max(parsed, 1), 5);
}

export function summarizeGraph(rows) {
  const nodes = new Map();
  for (const row of rows) {
    nodes.set(row.from_id, { id: row.from_id, type: row.from_type, name: row.from_name });
    nodes.set(row.to_id, { id: row.to_id, type: row.to_type, name: row.to_name });
  }
  return {
    nodes: [...nodes.values()],
    edges: rows.map((row) => ({
      from: row.from_id,
      to: row.to_id,
      type: row.edge_type,
      source: row.source_name,
      depth: row.depth
    }))
  };
}
