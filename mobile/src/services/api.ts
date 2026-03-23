/**
 * api.ts  –  HumanBridge Mobile API client
 *
 * Reads API base URL and AI credentials from AsyncStorage at call time so
 * that any settings change made on the Settings screen takes effect
 * immediately, without restarting the app.
 */
import { loadApiBaseUrl, loadCredentials } from "./aiCredentials";

const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function getBaseUrl(): Promise<string> {
  const saved = await loadApiBaseUrl();
  return (saved ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

/** Returns LLM credentials payload or null if none configured */
async function getLlmCredentials() {
  const creds = await loadCredentials();
  if (!creds || !creds.baseUrl || !creds.model) return null;
  return {
    provider: creds.provider,
    base_url: creds.baseUrl,
    api_key: creds.apiKey,
    model: creds.model,
  };
}

function extractErrorMessage(data: any): string {
  if (!data) return "Erro na API.";
  if (Array.isArray(data.detail)) {
    return data.detail.map((e: any) => e.msg ?? JSON.stringify(e)).join("; ");
  }
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.detail === "object" && data.detail !== null) {
    return JSON.stringify(data.detail);
  }
  if (typeof data.message === "string") return data.message;
  return JSON.stringify(data);
}

async function parseResponse(response: Response) {
  let data: any;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }
    return {};
  }
  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }
  return data;
}

// ─── AI Settings ────────────────────────────────────────────────────────────

export async function fetchProviders() {
  const base = await getBaseUrl();
  const response = await fetch(`${base}/ai-settings/providers`);
  return parseResponse(response);
}

export async function validateAiCredentials(creds: {
  provider: string;
  base_url: string;
  api_key: string;
  model: string;
}) {
  const base = await getBaseUrl();
  const response = await fetch(`${base}/ai-settings/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentials: creds }),
  });
  return parseResponse(response);
}

// ─── BridgeForm ─────────────────────────────────────────────────────────────

export async function analyzeBureaucracyText(rawText: string, contextNotes?: string) {
  const base = await getBaseUrl();
  const llm_credentials = await getLlmCredentials();

  const response = await fetch(`${base}/bureaucracy/analyze-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      raw_text: rawText,
      context_notes: contextNotes || null,
      llm_credentials,
    }),
  });
  return parseResponse(response);
}

// ─── ReadBuddy ───────────────────────────────────────────────────────────────

export async function createProfile(payload: {
  full_name: string;
  age?: number;
  grade_level?: string;
  language?: string;
}) {
  const base = await getBaseUrl();
  const response = await fetch(`${base}/readbuddy/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function listProfiles() {
  const base = await getBaseUrl();
  const response = await fetch(`${base}/readbuddy/profiles`);
  return parseResponse(response);
}

export async function analyzeReading(payload: {
  profile_id?: number;
  expected_text: string;
  transcript: string;
  duration_seconds: number;
  language?: string;
}) {
  const base = await getBaseUrl();
  const llm_credentials = await getLlmCredentials();

  const response = await fetch(`${base}/readbuddy/analyze-reading`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, llm_credentials }),
  });
  return parseResponse(response);
}

