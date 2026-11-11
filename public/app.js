const question = document.querySelector("#question");
const askButton = document.querySelector("#ask");
const status = document.querySelector("#status");
const result = document.querySelector("#result");

function setStatus(message) {
  status.textContent = message;
  status.hidden = !message;
}

function render(payload) {
  document.querySelector("#mode").textContent = payload.answer.mode;
  document.querySelector("#summary").textContent = payload.answer.summary;
  document.querySelector("#findings").innerHTML = payload.answer.findings.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  document.querySelector("#limits").textContent = payload.answer.limits;
  document.querySelector("#method").innerHTML = Object.entries(payload.method).map(([key,value]) => `<span><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</span>`).join("");
  const names = new Map(payload.graph.nodes.map((node) => [node.id, node.name]));
  document.querySelector("#graph").innerHTML = payload.graph.edges.map((edge) => `<div class="edge">${escapeHtml(names.get(edge.from))} <strong>→ ${escapeHtml(edge.type)} →</strong> ${escapeHtml(names.get(edge.to))}<small> · ${escapeHtml(edge.source)}</small></div>`).join("");
  document.querySelector("#documents").innerHTML = payload.evidence.map((doc) => `<div class="document"><strong>${escapeHtml(doc.title)}</strong><small>${escapeHtml(doc.source_name)} · as of ${escapeHtml(String(doc.as_of_date).slice(0,10))}</small></div>`).join("");
  result.hidden = false;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]);
}

askButton.addEventListener("click", async () => {
  askButton.disabled = true;
  result.hidden = true;
  setStatus("Following the evidence paths…");
  try {
    const response = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: question.value, entity: "Central Station" }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Request failed.");
    render(payload);
    setStatus("");
  } catch (error) {
    setStatus(error.message);
  } finally {
    askButton.disabled = false;
  }
});
