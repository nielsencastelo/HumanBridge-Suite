"use client";

import { useEffect, useState } from "react";
import { analyzeReading, createProfile, listProfiles } from "@/lib/api";
import type { Profile, ReadingResponse } from "@/types";
import { Metric } from "@/components/Metric";

export default function ReadBuddyPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | "">("");
  const [profileName, setProfileName] = useState("");
  const [profileAge, setProfileAge] = useState("");
  const [profileGrade, setProfileGrade] = useState("3º ano");

  const [expectedText, setExpectedText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("25");

  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReadingResponse | null>(null);

  async function loadProfiles() {
    try {
      const data = await listProfiles();
      setProfiles(data.items);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function handleCreateProfile() {
    setSavingProfile(true);
    setError("");
    try {
      const created = await createProfile({
        full_name: profileName,
        age: profileAge ? Number(profileAge) : undefined,
        grade_level: profileGrade,
        language: "pt-BR"
      });
      await loadProfiles();
      setSelectedProfileId(created.id);
      setProfileName("");
      setProfileAge("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAnalyzeReading() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await analyzeReading({
        profile_id: selectedProfileId === "" ? undefined : Number(selectedProfileId),
        expected_text: expectedText,
        transcript,
        duration_seconds: Number(durationSeconds),
        language: "pt-BR"
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao analisar leitura.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
      <section className="hero" style={{ paddingTop: 24 }}>
        <div className="kicker">ReadBuddy</div>
        <h1>Tutor de leitura guiada</h1>
        <p>
          Analise leitura oral com foco em precisão, velocidade, erros recorrentes,
          compreensão e microexercícios para a próxima sessão.
        </p>
      </section>

      <section className="grid grid-2">
        <div className="card stack">
          <h3>Criar perfil rápido</h3>
          <label>
            Nome do aluno
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Ex.: Ana Clara" />
          </label>
          <label>
            Idade
            <input value={profileAge} onChange={(e) => setProfileAge(e.target.value)} placeholder="8" />
          </label>
          <label>
            Série
            <select value={profileGrade} onChange={(e) => setProfileGrade(e.target.value)}>
              <option>1º ano</option>
              <option>2º ano</option>
              <option>3º ano</option>
              <option>4º ano</option>
              <option>5º ano</option>
            </select>
          </label>
          <button className="button" onClick={handleCreateProfile} disabled={savingProfile || !profileName.trim()}>
            {savingProfile ? "Salvando..." : "Salvar perfil"}
          </button>

          <label>
            Perfil ativo
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Sem perfil</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name} · {profile.grade_level}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="card stack">
          <h3>Analisar leitura</h3>
          <label>
            Texto esperado
            <textarea
              value={expectedText}
              onChange={(e) => setExpectedText(e.target.value)}
              placeholder="Cole o texto correto que o aluno deveria ler."
            />
          </label>
          <label>
            Transcrição do que o aluno falou
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Cole a transcrição manual ou automática da leitura."
            />
          </label>
          <label>
            Duração em segundos
            <input
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value)}
              placeholder="25"
            />
          </label>

          <button
            className="button"
            onClick={handleAnalyzeReading}
            disabled={loading || !expectedText.trim() || !transcript.trim()}
          >
            {loading ? "Analisando..." : "Analisar leitura"}
          </button>

          {error ? <div className="notice" style={{ borderColor: "var(--danger)" }}>{error}</div> : null}
        </div>
      </section>

      {result ? (
        <>
          <section className="grid grid-2" style={{ marginTop: 18 }}>
            <Metric label="Precisão" value={`${result.accuracy_score.toFixed(1)}%`} />
            <Metric label="Palavras por minuto" value={result.words_per_minute.toFixed(1)} />
          </section>

          <section className="result-grid" style={{ marginTop: 18 }}>
            <div className="stack">
              <div className="card">
                <h3>Nível e feedback</h3>
                <p><strong>Nível:</strong> {result.reading_level}</p>
                <p>{result.parent_feedback}</p>
                <p className="muted">{result.student_feedback}</p>
              </div>

              <div className="card">
                <h3>Plano da próxima sessão</h3>
                <ul className="list">
                  {result.next_session_plan.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                </ul>
              </div>

              <div className="card">
                <h3>Perguntas de compreensão</h3>
                <ul className="list">
                  {result.comprehension_questions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                </ul>
              </div>
            </div>

            <div className="stack">
              <div className="card">
                <h3>Erros detectados</h3>
                <ul className="list">
                  {result.mistakes.length ? (
                    result.mistakes.map((item, index) => (
                      <li key={`${item.kind}-${index}`}>
                        <strong>{item.kind}</strong>
                        {item.expected ? ` esperado: "${item.expected}"` : ""}
                        {item.spoken ? ` falado: "${item.spoken}"` : ""}
                      </li>
                    ))
                  ) : (
                    <li>Nenhum erro relevante detectado.</li>
                  )}
                </ul>
              </div>

              <div className="card">
                <h3>Microexercícios</h3>
                <ul className="list">
                  {result.exercises.map((item, index) => (
                    <li key={`${item.title}-${index}`}>
                      <strong>{item.title}</strong> — {item.instruction}
                      <div className="muted">Palavras-alvo: {item.target_words.join(", ")}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
