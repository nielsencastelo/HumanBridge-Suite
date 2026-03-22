import { HeroCard } from "@/components/HeroCard";
import { API_BASE_URL } from "@/lib/api";

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <div className="kicker">MVP completo</div>
        <h1>Dois produtos com impacto direto na vida real.</h1>
        <p>
          HumanBridge Suite junta o <strong>BridgeForm</strong>, que simplifica documentos difíceis,
          e o <strong>ReadBuddy</strong>, que acompanha leitura oral e gera exercícios objetivos.
          A API está preparada para rodar localmente com SQLite e o frontend consome tudo em tempo real.
        </p>
        <div className="notice" style={{ marginTop: 20 }}>
          <strong>Base URL da API:</strong> <span className="mono">{API_BASE_URL}</span>
        </div>
      </section>

      <section className="grid grid-2">
        <HeroCard
          kicker="Produto 1"
          title="BridgeForm"
          description="Cole texto ou envie PDF/DOCX/TXT e receba resumo em linguagem simples, prazo, riscos, documentos exigidos e perguntas para atendimento."
          ctaLabel="Abrir BridgeForm"
          href="/translator"
        />
        <HeroCard
          kicker="Produto 2"
          title="ReadBuddy"
          description="Crie o perfil do aluno, analise a leitura, veja precisão, velocidade, erros, perguntas de compreensão e plano da próxima sessão."
          ctaLabel="Abrir ReadBuddy"
          href="/readbuddy"
        />
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>Fluxo rápido de teste</h3>
        <ol className="list">
          <li>Suba a API em <span className="mono">localhost:8000</span>.</li>
          <li>Abra o frontend em <span className="mono">localhost:3000</span>.</li>
          <li>Na área BridgeForm, teste o arquivo <span className="mono">sample-data/sample_notice.txt</span>.</li>
          <li>Na área ReadBuddy, use o texto <span className="mono">sample-data/sample_passage.txt</span>.</li>
        </ol>
      </section>

      <footer className="footer">
        HumanBridge Suite · API + Web + Mobile · pronto para evoluir para autenticação, storage e LLM opcional.
      </footer>
    </main>
  );
}
