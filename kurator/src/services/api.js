// Bas-URL till din Worker (styr via env i Pages)
export const API_BASE =
  import.meta.env.VITE_API_BASE || "https://api.trackcurator.org";

import axios from "axios";
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Helpers
export const postAnalyze = (payload) => api.post("/analyze", payload);
export const postBatch   = (body)    => api.post("/batch", body);
