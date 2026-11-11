import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const chatModel = process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";

export function buildDeterministicAnswer(startNode, graph, documents) {
  const routes = graph.nodes.filter((node) => node.type === "ROUTE").map((node) => node.name);
  const districts = graph.nodes.filter((node) => node.type === "DISTRICT").map((node) => node.name);
  return {
    summary: `${startNode.name} is connected through the sample graph to ${routes.length} surface routes and ${districts.length} districts within the selected traversal limit.`,
    findings: [
      routes.length ? `Connected routes: ${routes.join(", ")}.` : "No connected surface routes were found.",
      districts.length ? `Potential network reach: ${districts.join(", ")}.` : "No connected districts were found.",
      `${documents.length} evidence records were retrieved to provide definitions and limits.`
    ],
    limits: "A graph connection shows potential network reach. It does not prove passenger impact, rider choices, demand, delays or replacement capacity."
  };
}

export async function composeAnswer(question, startNode, graph, documents) {
  const fallback = buildDeterministicAnswer(startNode, graph, documents);
  if (!openai) return { ...fallback, mode: "deterministic" };

  const evidence = {
    startNode,
    graph,
    documents: documents.map(({ id, title, content, source_name, as_of_date }) => ({ id, title, content, source_name, as_of_date }))
  };
  const response = await openai.responses.create({
    model: chatModel,
    input: [
      {
        role: "system",
        content: "Answer only from the supplied evidence. Distinguish direct connections from potential downstream reach. Never claim passenger impact, demand, delays, rider choices or replacement capacity unless explicitly supplied. Return concise JSON with summary, findings (array), and limits."
      },
      { role: "user", content: `Question: ${question}\nEvidence: ${JSON.stringify(evidence)}` }
    ],
    text: { format: { type: "json_object" } }
  });

  try {
    return { ...JSON.parse(response.output_text), mode: "model-assisted" };
  } catch {
    return { ...fallback, mode: "deterministic-fallback" };
  }
}
