"use client";

import { useEffect, useState } from "react";
import {
  AiCredentials,
  AiProvider,
  PROVIDER_DEFAULTS,
  clearCredentials,
  loadApiBaseUrl,
  loadCredentials,
  saveApiBaseUrl,
  saveCredentials,
} from "@/lib/aiCredentials";
import { validateAiCredentials } from "@/lib/api";

const PROVIDERS = Object.entries(PROVIDER_DEFAULTS) as [
  AiProvider,
  (typeof PROVIDER_DEFAULTS)[AiProvider]
][];

export default function SettingsPage() {
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [provider, setProvider] = useState<AiProvider>("openai");
  const [baseUrl, setBaseUrl] = useState(PROVIDER_DEFAULTS.openai.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(PROVIDER_DEFAULTS.openai.modelPlaceholder);
  const [showKey, setShowKey] = useState(false);

  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedUrl = loadApiBaseUrl();
    if (savedUrl) setApiBaseUrl(savedUrl);

    const creds = loadCredentials();
    if (creds) {
      setProvider(creds.provider);
      setBaseUrl(creds.baseUrl);
      setApiKey(creds.apiKey);
      setModel(creds.model);
    }
    setLoaded(true);
  }, []);

  function handleProviderChange(p: AiProvider) {
    const def = PROVIDER_DEFAULTS[p];
    setProvider(p);
    setBaseUrl(def.baseUrl);
    setModel(def.modelPlaceholder);
    setStatus(null);
  }

  async function handleValidate() {
    if (!baseUrl || !model) {
      setStatus({ ok: false, text: "Preencha URL base e modelo antes de testar." });
      return;
    }
    setValidating(true);
    setStatus(null);
    try {
      const result = await validateAiCredentials({
        provider,
        base_url: baseUrl,
        api_key: apiKey,
        model,
      });
      setStatus({ ok: result.ok, text: result.message });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : "Erro ao validar." });
    } finally {
      setValidating(false);
    }
  }

  function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      if (apiBaseUrl.trim()) saveApiBaseUrl(apiBaseUrl.trim());
      const creds: AiCredentials = {
        provider,
        baseUrl,
        apiKey,
        model,
        label: PROVIDER_DEFAULTS[provider].label,
      };
      saveCredentials(creds);
      setStatus({ ok: true, text: "Configurações salvas no navegador." });
    } catch {
      setStatus({ ok: false, text: "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    clearCredentials();
    setApiKey("");
    setBaseUrl(PROVIDER_DEFAULTS[provider].baseUrl);
    setModel(PROVIDER_DEFAULTS[provider].modelPlaceholder);
    setStatus({ ok: true, text: "Credenciais removidas do navegador." });
  }

  const def = PROVIDER_DEFAULTS[provider];
  const isEditableUrl = provider === "custom" || provider === "ollama" || provider === "lmstudio";

  if (!loaded) {
    return (
      <main className="container" style={{ paddingTop: 60 }}>
        <p className="muted">Carregando…</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
      <section className="hero" style={{ paddingTop: 24 }}>
        <div className="kicker">Configurações</div>
        <h1>IA e servidor</h1>
        <p>
          Configure o endereço da API e as credenciais do provedor de IA de sua escolha.
          Os dados são salvos <strong>apenas neste navegador</strong> e enviados diretamente
          ao servidor para cada requisição.
        </p>
      </section>

      {/* ── Servidor ── */}
      <section className="card stack" style={{ marginTop: 18 }}>
        <h3>🌐 Servidor da API</h3>
        <label>
          URL base da API
          <input
            type="url"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder={
              process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
            }
          />
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          Deixe em branco para usar o valor padrão definido em{" "}
          <span className="mono">NEXT_PUBLIC_API_BASE_URL</span>.
        </p>
      </section>

      {/* ── Provedor de IA ── */}
      <section className="card stack" style={{ marginTop: 12 }}>
        <h3>🤖 Provedor de IA</h3>

        <label>Selecione o provedor</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {PROVIDERS.map(([key, info]) => (
            <button
              key={key}
              onClick={() => handleProviderChange(key)}
              className={`button${provider === key ? "" : " secondary"}`}
              style={{
                padding: "6px 16px",
                fontSize: 13,
                ...(provider === key ? {} : { opacity: 0.6 }),
              }}
            >
              {info.label}
            </button>
          ))}
        </div>

        <label>
          URL base
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={def.baseUrl || "https://api.example.com/v1"}
            disabled={!isEditableUrl}
            style={{ opacity: isEditableUrl ? 1 : 0.55 }}
          />
        </label>

        <label>
          Modelo
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={def.modelPlaceholder}
          />
        </label>

        {def.requiresKey && (
          <label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Token / API Key</span>
              <button
                className="button secondary"
                style={{ fontSize: 12, padding: "3px 10px" }}
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
            />
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              Armazenado somente neste navegador (localStorage). Nunca enviado a terceiros.
            </p>
          </label>
        )}
      </section>

      {/* ── Status ── */}
      {status && (
        <div
          className="notice"
          style={{
            marginTop: 12,
            borderColor: status.ok ? "var(--success)" : "var(--danger)",
            color: status.ok ? "var(--success)" : "var(--danger)",
          }}
        >
          {status.ok ? "✓ " : "✗ "}
          {status.text}
        </div>
      )}

      {/* ── Ações ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        <button
          className="button secondary"
          onClick={handleValidate}
          disabled={validating}
          style={{ minWidth: 180 }}
        >
          {validating ? "Testando…" : "Testar conexão com a IA"}
        </button>

        <button className="button" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>

        <button
          className="button secondary"
          onClick={handleClear}
          style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
        >
          Remover credenciais
        </button>
      </div>
    </main>
  );
}
