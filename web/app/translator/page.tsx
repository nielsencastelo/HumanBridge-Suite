"use client";

import { useState } from "react";
import { analyzeBureaucracyFile, analyzeBureaucracyText } from "@/lib/api";
import type { BureaucracyResponse } from "@/types";

export default function TranslatorPage() {
  const [rawText, setRawText] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BureaucracyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = file
        ? await analyzeBureaucracyFile(file, contextNotes)
        : await analyzeBureaucracyText(rawText, contextNotes);

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
      <section className="hero" style={{ paddingTop: 24 }}>
        <div className="kicker">BridgeForm</div>
        <h1>Tradutor universal de burocracia</h1>
        <p>
          Cole um comunicado, notificação, laudo simples, cobrança ou formulário textual.
          O sistema devolve linguagem clara, ações imediatas, riscos e ajuda para preenchimento.
        </p>
      </section>

      <section className="grid grid-2">
        <div className="card stack">
          <label>
            Texto bruto do documento
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui o texto do documento..."
            />
          </label>

          <label>
            Ou envie um arquivo (TXT, PDF, DOCX; imagem depende de OCR local)
            <input
              type="file"
              accept=".txt,.pdf,.docx,.md,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <label>
            Observações de contexto
            <textarea
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="Ex.: isso é para renovação de benefício do meu pai."
            />
          </label>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              className="button"
              onClick={handleAnalyze}
              disabled={loading || (!rawText.trim() && !file)}
            >
              {loading ? "Analisando..." : "Analisar documento"}
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setRawText("");
                setContextNotes("");
                setFile(null);
                setResult(null);
                setError("");
              }}
            >
              Limpar
            </button>
          </div>

          {error ? <div className="notice" style={{ borderColor: "var(--danger)" }}>{error}</div> : null}
        </div>

        <div className="card">
          <h3>O que esta tela entrega</h3>
          <ul className="list">
            <li>Resumo simples em português.</li>
            <li>Prazos extraídos do texto.</li>
            <li>Lista de documentos citados.</li>
            <li>Riscos se a pessoa ignorar o documento.</li>
            <li>Perguntas prontas para atendimento.</li>
          </ul>
        </div>
      </section>

      {result ? (
        <section className="result-grid" style={{ marginTop: 18 }}>
          <div className="stack">
            <div className="card">
              <div className="badge">{result.detected_document_type}</div>
              <h2 style={{ marginTop: 14 }}>{result.main_topic}</h2>
              <p>{result.plain_language_summary}</p>
            </div>

            <div className="card">
              <h3>O que fazer agora</h3>
              <ul className="list">
                {result.what_you_need_to_do_now.map((item, index) => (
                  <li key={`${item.title}-${index}`}>
                    <strong>{item.title}</strong> — {item.why_it_matters} ({item.priority})
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>Ajuda para preenchimento</h3>
              <ul className="list">
                {result.fill_help.map((item, index) => (
                  <li key={`${item.field_name}-${index}`}>
                    <strong>{item.field_name}</strong>: {item.what_to_fill}
                    {item.example_value ? ` Ex.: ${item.example_value}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="stack">
            <div className="card">
              <h3>Prazos</h3>
              <ul className="list">
                {result.deadlines.length ? (
                  result.deadlines.map((item, index) => (
                    <li key={`${item.raw_text}-${index}`}>
                      {item.raw_text}
                      {item.normalized_date ? ` → ${item.normalized_date}` : ""}
                    </li>
                  ))
                ) : (
                  <li>Nenhum prazo explícito encontrado.</li>
                )}
              </ul>
            </div>

            <div className="card">
              <h3>Documentos exigidos</h3>
              <ul className="list">
                {result.required_documents.length ? (
                  result.required_documents.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)
                ) : (
                  <li>Nenhum documento específico detectado.</li>
                )}
              </ul>
            </div>

            <div className="card">
              <h3>Riscos e perguntas úteis</h3>
              <p><strong>Urgência:</strong> {result.urgency}</p>
              <ul className="list">
                {result.risks_if_ignored.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
              </ul>
              <hr style={{ borderColor: "var(--line)", opacity: 0.35 }} />
              <ul className="list">
                {result.questions_to_ask.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
