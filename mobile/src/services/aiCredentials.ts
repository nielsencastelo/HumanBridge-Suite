/**
 * aiCredentials.ts
 * Persists AI provider credentials locally using AsyncStorage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@humanbridge:ai_credentials";
const API_URL_KEY = "@humanbridge:api_base_url";

export type AiProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "groq"
  | "together"
  | "mistral"
  | "deepseek"
  | "ollama"
  | "lmstudio"
  | "custom";

export interface AiCredentials {
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  label: string;
}

export const PROVIDER_DEFAULTS: Record<
  AiProvider,
  {
    label: string;
    baseUrl: string;
    modelPlaceholder: string;
    requiresKey: boolean;
  }
> = {
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    modelPlaceholder: "gpt-4o-mini",
    requiresKey: true,
  },
  anthropic: {
    label: "Anthropic (Claude)",
    baseUrl: "https://api.anthropic.com/v1",
    modelPlaceholder: "claude-3-5-haiku-20241022",
    requiresKey: true,
  },
  gemini: {
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    modelPlaceholder: "gemini-2.0-flash",
    requiresKey: true,
  },
  groq: {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    modelPlaceholder: "llama-3.1-8b-instant",
    requiresKey: true,
  },
  together: {
    label: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    modelPlaceholder: "meta-llama/Llama-3-8b-chat-hf",
    requiresKey: true,
  },
  mistral: {
    label: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
    modelPlaceholder: "mistral-small-latest",
    requiresKey: true,
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    modelPlaceholder: "deepseek-chat",
    requiresKey: true,
  },
  ollama: {
    label: "Ollama (local)",
    baseUrl: "http://localhost:11434/v1",
    modelPlaceholder: "phi4",
    requiresKey: false,
  },
  lmstudio: {
    label: "LM Studio (local)",
    baseUrl: "http://localhost:1234/v1",
    modelPlaceholder: "local-model",
    requiresKey: false,
  },
  custom: {
    label: "Personalizado",
    baseUrl: "",
    modelPlaceholder: "nome-do-modelo",
    requiresKey: true,
  },
};

export async function saveCredentials(creds: AiCredentials): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

export async function loadCredentials(): Promise<AiCredentials | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AiCredentials;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function saveApiBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(API_URL_KEY, url);
}

export async function loadApiBaseUrl(): Promise<string | null> {
  return AsyncStorage.getItem(API_URL_KEY);
}
