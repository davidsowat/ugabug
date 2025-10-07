// Bas-URL till din Cloudflare Worker (ändra via env)
export const API_BASE =
  import.meta.env.VITE_API_BASE || "https://api.trackcurator.org";

// (valfritt men trevligt) En förkonfad axios-instans
import axios from "axios";
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Hjälpare som kapslar dina endpoints
export function postAnalyze(payload) {
  return api.post("/analyze", payload);
}
export function postBatch(body) {
  return api.post("/batch", body);
}
