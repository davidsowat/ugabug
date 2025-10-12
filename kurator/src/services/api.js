const API_BASE = import.meta.env.VITE_API_BASE;

export async function callOpenAI(payload) {
  const response = await fetch(`${API_BASE}/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}
