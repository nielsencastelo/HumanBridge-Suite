# HumanBridge Suite

HumanBridge Suite é um monorepo com dois produtos prontos para MVP:

1. **BridgeForm** — tradutor universal de burocracia.
2. **ReadBuddy** — tutor oral/pedagógico para leitura guiada.

## Stack
- **API:** FastAPI + SQLite
- **Web:** Next.js (App Router)
- **Mobile:** React Native com Expo Router

## Estrutura
```text
humanbridge-suite/
├─ api/
├─ web/
├─ mobile/
├─ docs/
├─ sample-data/
└─ docker-compose.yml
```

## Subida rápida
### 1) API
```bash
cd api
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env  # Windows
# cp .env.example .env   # Linux/macOS
uvicorn app.main:app --reload --port 8000
```

### 2) Web
```bash
cd web
copy .env.local.example .env.local
npm install
npm run dev
```

### 3) Mobile
```bash
cd mobile
copy .env.example .env
npm install
npx expo start
```

## Subida com Docker
```bash
docker compose up --build
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Web: http://localhost:3000

## Casos de teste rápidos

### BridgeForm
1. Abra `sample-data/sample_notice.txt`.
2. Copie o texto para a tela `/translator`.
3. Clique em **Analisar documento**.

### ReadBuddy
1. Abra `sample-data/sample_passage.txt`.
2. Crie um perfil na tela `/readbuddy`.
3. Cole o texto esperado.
4. Cole uma transcrição com alguns erros.
5. Informe a duração em segundos e analise.

## Observações importantes
- O projeto **roda sem LLM externo**. A primeira versão usa heurísticas locais.
- Se você quiser enriquecer as respostas, a API já suporta modo opcional via `OLLAMA_BASE_URL` ou endpoint OpenAI-compatível.
- Upload de **imagem** para OCR depende de instalação local do **Tesseract**. PDF, TXT e DOCX já funcionam sem isso.

## Principais endpoints
- `GET /api/v1/health`
- `POST /api/v1/bureaucracy/analyze-text`
- `POST /api/v1/bureaucracy/analyze-file`
- `POST /api/v1/readbuddy/profiles`
- `GET /api/v1/readbuddy/profiles`
- `GET /api/v1/readbuddy/profiles/{profile_id}`
- `GET /api/v1/readbuddy/profiles/{profile_id}/sessions`
- `POST /api/v1/readbuddy/analyze-reading`

## Licença
Uso educacional e prototipagem. Revise requisitos regulatórios antes de uso em produção, especialmente para saúde, educação formal e dados sensíveis.
