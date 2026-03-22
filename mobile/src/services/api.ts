const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function parseResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Erro na API.");
  }
  return data;
}

export async function analyzeBureaucracyText(rawText: string, contextNotes?: string) {
  const response = await fetch(`${API_BASE_URL}/bureaucracy/analyze-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      raw_text: rawText,
      context_notes: contextNotes || null
    })
  });
  return parseResponse(response);
}

export async function createProfile(payload: {
  full_name: string;
  age?: number;
  grade_level?: string;
  language?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/readbuddy/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

export async function listProfiles() {
  const response = await fetch(`${API_BASE_URL}/readbuddy/profiles`);
  return parseResponse(response);
}

export async function analyzeReading(payload: {
  profile_id?: number;
  expected_text: string;
  transcript: string;
  duration_seconds: number;
  language?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/readbuddy/analyze-reading`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}
