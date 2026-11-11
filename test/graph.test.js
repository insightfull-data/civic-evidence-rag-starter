import test from "node:test";
import assert from "node:assert/strict";
import { normalizeHopLimit, summarizeGraph } from "../src/graph-utils.js";
import { buildDeterministicAnswer } from "../src/answer.js";

test("graph hop limits remain bounded", () => {
  assert.equal(normalizeHopLimit("0"), 1);
  assert.equal(normalizeHopLimit("4"), 4);
  assert.equal(normalizeHopLimit("100"), 5);
  assert.equal(normalizeHopLimit("bad"), 4);
});

test("graph rows become a deduplicated evidence graph", () => {
  const graph = summarizeGraph([
    { depth: 1, edge_type: "CONNECTS_TO", source_name: "catalogue", from_id: "s", from_type: "STATION", from_name: "Central", to_id: "r", to_type: "ROUTE", to_name: "Route 10" },
    { depth: 2, edge_type: "SERVES_DISTRICT", source_name: "shapes", from_id: "r", from_type: "ROUTE", from_name: "Route 10", to_id: "d", to_type: "DISTRICT", to_name: "Northside" }
  ]);
  assert.equal(graph.nodes.length, 3);
  assert.equal(graph.edges.length, 2);
});

test("deterministic answer preserves the evidence boundary", () => {
  const answer = buildDeterministicAnswer(
    { name: "Central Station" },
    { nodes: [{ type: "ROUTE", name: "Route 10" }, { type: "DISTRICT", name: "Northside" }] },
    [{ id: "method" }]
  );
  assert.match(answer.summary, /1 surface routes and 1 districts/);
  assert.match(answer.limits, /does not prove passenger impact/);
});
