# 🚀 HumanBridge Suite

> Plataforma completa para simplificação de burocracia (**BridgeForm**) e tutoria de leitura guiada (**ReadBuddy**), com suporte a qualquer provedor de IA configurável pelo usuário.

---

## 📌 Visão Geral

HumanBridge Suite é um monorepo com três camadas independentes:

| Camada | Tecnologia | Descrição |
|--------|-----------|-----------|
| `api/` | FastAPI + SQLite | Backend central — processa análises, persiste dados, integra com LLMs |
| `web/` | Next.js 15 (App Router) | Interface web completa com configuração de IA via browser |
| `mobile/` | React Native / Expo SDK 53 | App Android + iOS com configuração de IA salva no dispositivo |

```
humanbridge-suite/
├── api/
├── web/
├── mobile/
├── docker-compose.yml
└── README.md
```

---

## 🏗️ Arquitetura

```
┌────────────┐     ┌────────────┐
│  Web       │     │  Mobile    │
│  Next.js   │     │  Expo RN   │
└─────┬──────┘     └─────┬──────┘
      │                  │
      └────────┬──────────┘
               │  HTTP / JSON
      ┌────────▼──────────┐
      │   API – FastAPI   │
      │   /api/v1/...     │
      └────────┬──────────┘
               │
      ┌────────▼──────────┐        ┌──────────────────────┐
      │   SQLite (dados)  │        │  LLM do usuário      │
      └───────────────────┘        │  OpenAI / Groq /     │
                                   │  DeepSeek / Ollama.. │
                                   └──────────────────────┘
```

A API encaminha as chamadas de IA usando as **credenciais fornecidas pelo próprio cliente** (web ou mobile) em cada requisição. Nenhuma chave de API precisa estar configurada no servidor — a escolha e o token são do usuário.

---

## ⚙️ Pré-requisitos

### Geral
- **Git**
- **Python 3.11+**
- **Node.js 22+** e **npm 10+**

### Para o Mobile (compilação nativa)
- **JDK 17+** (Android)
- **Android Studio** com SDK 35 e NDK instalados (Android)
- **Xcode 15+** (iOS — somente em macOS)
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI** (builds em nuvem): `npm install -g eas-cli`

### Para Docker
- **Docker** 24+ e **Docker Compose** v2+

---

## 🔧 1. API — Setup local

### 1.1 Clonar / extrair e entrar na pasta

```bash
cd api
```

### 1.2 Criar e ativar ambiente virtual

```bash
# Linux / macOS
python -m venv .venv
source .venv/bin/activate

# Windows (PowerShell)
python -m venv .venv
.venv\Scripts\Activate.ps1

# Windows (CMD)
python -m venv .venv
.venv\Scripts\activate.bat
```

### 1.3 Instalar dependências

```bash
pip install -r requirements.txt
```

### 1.4 Configurar variáveis de ambiente

```bash
# Linux / macOS
cp .env.example .env

# Windows
copy .env.example .env
```

Abra o `.env` e ajuste conforme necessário:

```env
APP_NAME=HumanBridge API
APP_ENV=development
APP_DEBUG=true
API_V1_PREFIX=/api/v1
SQLITE_PATH=./humanbridge.db
DEFAULT_LOCALE=pt-BR

# Origens permitidas (CORS) — adicione a URL do seu frontend em produção
CORS_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:8081

# ─── LLM no servidor (opcional) ──────────────────────────────────
# Mantenha LLM_MODE=off se os usuários vão fornecer as próprias credenciais.
# Use LLM_MODE=openai_compatible para configurar uma chave padrão no servidor.
LLM_MODE=off
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=
LLM_MODEL=phi4
LLM_TIMEOUT_SECONDS=60
```

> **Nota sobre LLM_MODE:** com o valor `off`, a IA só é usada quando o usuário fornece suas próprias credenciais pela interface. Com `openai_compatible`, o servidor usa a chave do `.env` como fallback.

### 1.5 Iniciar o servidor

```bash
uvicorn app.main:app --reload --port 8000
```

### 1.6 Verificar

- API rodando: http://localhost:8000
- Documentação interativa (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health → `{"status":"ok"}`

---

## 🌐 2. Web — Setup local

### 2.1 Entrar na pasta

```bash
cd web
```

### 2.2 Configurar variáveis de ambiente

```bash
# Linux / macOS
cp .env.local.example .env.local

# Windows
copy .env.local.example .env.local
```

Conteúdo do `.env.local`:

```env
# URL da API — altere para o endereço do servidor em produção
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

> **Importante:** esta variável define apenas o endereço *padrão*. O usuário pode sobrescrever a URL diretamente na página **Configurações** da interface, sem necessidade de redeploy.

### 2.3 Instalar dependências

```bash
npm install
```

### 2.4 Iniciar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

### 2.5 Build para produção

```bash
npm run build
npm run start
```

---

## 📱 3. Mobile — Setup e compilação

### 3.1 Entrar na pasta

```bash
cd mobile
```

### 3.2 Configurar variáveis de ambiente

```bash
# Linux / macOS
cp .env.example .env

# Windows
copy .env.example .env
```

Conteúdo do `.env`:

```env
# URL padrão da API — use o IP da sua máquina na rede local durante testes
# Em produção, use o endereço do servidor (https://...)
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8000/api/v1
```

> **Dica:** para descobrir o IP local da sua máquina:
> - Linux/macOS: `ip a` ou `ifconfig`
> - Windows: `ipconfig`
>
> O emulador Android pode usar `http://10.0.2.2:8000/api/v1` para acessar o `localhost` do host.

### 3.3 Instalar dependências

```bash
npm install
```

### 3.4 Rodar em modo Expo Go (desenvolvimento rápido, sem build nativo)

```bash
npx expo start
```

Escaneie o QR Code com o app **Expo Go** (disponível na App Store e Google Play).

> ⚠️ O Expo Go **não** suporta módulos nativos customizados. Para `@react-native-async-storage/async-storage` funcionar corretamente, use o **build nativo** abaixo.

---

### 3.5 Build Android (APK de desenvolvimento)

```bash
# Gerar pasta android/ nativa (necessário apenas na primeira vez)
npx expo prebuild --platform android

# Compilar e instalar no dispositivo/emulador conectado
npx expo run:android
```

> O primeiro build leva **15–20 minutos** (Gradle baixa dependências). Os seguintes são muito mais rápidos.

#### Gerar APK de release (instalável)

```bash
cd android
./gradlew assembleRelease
```

O APK gerado estará em:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

### 3.6 Build iOS (somente macOS)

```bash
# Gerar pasta ios/ nativa
npx expo prebuild --platform ios

# Instalar pods
cd ios && pod install && cd ..

# Compilar e rodar no simulador
npx expo run:ios
```

#### Rodar em dispositivo físico

1. Abra `ios/HumanBridge.xcworkspace` no Xcode
2. Selecione seu dispositivo como target
3. Configure o Team de assinatura em **Signing & Capabilities**
4. Clique em **Run (▶)**

---

### 3.7 Build de produção com EAS (recomendado para distribuição)

O EAS Build compila na nuvem da Expo, sem precisar do ambiente nativo local.

```bash
# Login na conta Expo
eas login

# Configurar o projeto (primeira vez)
eas build:configure

# Build Android (AAB para Play Store)
eas build --platform android --profile production

# Build iOS (IPA para App Store)
eas build --platform ios --profile production
```

> Crie uma conta gratuita em https://expo.dev para usar o EAS Build.

---

## 🐳 4. Docker — Subir API + Web juntos

Para rodar API e Web em contêineres com um único comando:

```bash
# Na raiz do projeto (onde está o docker-compose.yml)
docker compose up --build
```

Serviços disponíveis:

| Serviço | URL |
|---------|-----|
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| Web | http://localhost:3000 |

### Variáveis de ambiente no Docker

Edite o `docker-compose.yml` para personalizar:

```yaml
services:
  api:
    environment:
      CORS_ORIGINS: http://localhost:3000,https://meusite.com
      LLM_MODE: off          # ou openai_compatible
      LLM_API_KEY: sk-...    # opcional — chave padrão do servidor
      LLM_MODEL: gpt-4o-mini

  web:
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:8000/api/v1
```

### Parar e remover contêineres

```bash
docker compose down

# Para remover também o volume de dados (banco SQLite)
docker compose down -v
```

---

## 🤖 5. Configurar a IA (Web e Mobile)

Esta é a funcionalidade central adicionada nesta versão. **Nenhuma chave de IA precisa estar no servidor** — cada usuário configura o provedor e token de sua preferência diretamente na interface.

### 5.1 Na Web

1. Acesse http://localhost:3000/settings (link **⚙ Configurações** no menu)
2. Opcionalmente, informe a **URL da API** se o servidor estiver em outro endereço
3. Escolha o **Provedor de IA** clicando no chip correspondente
4. Preencha o **Modelo** (ex.: `gpt-4o-mini`, `llama-3.1-8b-instant`)
5. Preencha o **Token / API Key** do provedor escolhido
6. Clique em **Testar conexão** — a API fará um ping real e mostrará o resultado
7. Clique em **Salvar configurações**

As configurações ficam salvas no `localStorage` do navegador e são enviadas automaticamente em cada análise.

### 5.2 No App Mobile

1. Toque no ícone **⚙** no canto superior direito de qualquer tela
2. Informe a **URL da API** (endereço do servidor em produção)
3. Selecione o **Provedor** tocando no chip
4. Preencha **Modelo** e **Token / API Key**
5. Toque em **Testar conexão com a IA**
6. Toque em **Salvar configurações**

As configurações ficam gravadas no dispositivo via `AsyncStorage` e persistem entre sessões.

### 5.3 Provedores suportados

| Provedor | Base URL padrão | Requer chave |
|----------|----------------|:------------:|
| **OpenAI** | `https://api.openai.com/v1` | ✓ |
| **Groq** | `https://api.groq.com/openai/v1` | ✓ |
| **Together AI** | `https://api.together.xyz/v1` | ✓ |
| **Mistral AI** | `https://api.mistral.ai/v1` | ✓ |
| **DeepSeek** | `https://api.deepseek.com/v1` | ✓ |
| **Ollama** (local) | `http://localhost:11434/v1` | — |
| **LM Studio** (local) | `http://localhost:1234/v1` | — |
| **Personalizado** | (livre) | ✓ |

Qualquer API compatível com o formato OpenAI (`/chat/completions`) funciona.

---

## 🔌 Referência de Endpoints da API

### Health

```
GET  /api/v1/health
```

### Configurações de IA (novos)

```
GET  /api/v1/ai-settings/providers          → Lista provedores disponíveis
POST /api/v1/ai-settings/validate           → Testa credenciais do usuário
```

Exemplo de payload para `/validate`:

```json
{
  "credentials": {
    "provider": "openai",
    "base_url": "https://api.openai.com/v1",
    "api_key": "sk-...",
    "model": "gpt-4o-mini"
  }
}
```

### BridgeForm

```
POST /api/v1/bureaucracy/analyze-text       → Analisa texto colado
POST /api/v1/bureaucracy/analyze-file       → Analisa arquivo (TXT, PDF, DOCX)
```

Exemplo com credenciais de IA:

```json
{
  "raw_text": "Prezado contribuinte, fica V.Sa. notificado...",
  "context_notes": "notificação da prefeitura",
  "llm_credentials": {
    "provider": "groq",
    "base_url": "https://api.groq.com/openai/v1",
    "api_key": "gsk_...",
    "model": "llama-3.1-8b-instant"
  }
}
```

### ReadBuddy

```
POST /api/v1/readbuddy/profiles             → Cria perfil de aluno
GET  /api/v1/readbuddy/profiles             → Lista perfis
GET  /api/v1/readbuddy/profiles/{id}        → Detalha perfil
GET  /api/v1/readbuddy/profiles/{id}/sessions → Histórico de sessões
POST /api/v1/readbuddy/analyze-reading      → Analisa sessão de leitura
```

---

## 🌍 6. Deploy em produção

### 6.1 Servidor (API + Web)

**Recomendações:**
- **VPS**: Railway, Render, Fly.io, DigitalOcean, AWS EC2
- **Banco**: substitua SQLite por PostgreSQL em produção (ver Roadmap)
- **Reverse proxy**: Nginx ou Caddy na frente da API e do Next.js

**Passos básicos com Docker:**

```bash
# 1. Faça upload dos arquivos para o servidor
# 2. Edite o docker-compose.yml com as URLs de produção
# 3. Suba os serviços
docker compose up -d --build

# 4. Verifique os logs
docker compose logs -f
```

**Atualizar CORS para produção** no `docker-compose.yml`:

```yaml
CORS_ORIGINS: https://meusite.com,https://www.meusite.com
```

### 6.2 Mobile em produção

No arquivo `mobile/.env`, aponte para o servidor real:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.meuservidor.com/api/v1
```

Rebuild do app com EAS:

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

> **Dica:** o usuário final também pode sobrescrever a URL da API diretamente na tela de Configurações do app, sem necessidade de novo build.

---

## 🧪 7. Testes da API

```bash
cd api
pytest tests/ -v
```

---

## 🔍 8. OCR (leitura de imagens)

Para suporte a imagens (PNG, JPG, WEBP) no BridgeForm, instale o Tesseract:

```bash
# Ubuntu / Debian
sudo apt-get install tesseract-ocr tesseract-ocr-por

# macOS
brew install tesseract tesseract-lang

# Windows
# Baixe o instalador: https://github.com/UB-Mannheim/tesseract/wiki
```

Sem o Tesseract, TXT, PDF e DOCX funcionam normalmente.

---

## 📦 Roadmap

- [ ] PostgreSQL + pgvector
- [ ] Autenticação JWT
- [ ] Suporte multi-tenant
- [ ] Feedback em tempo real via WebSocket
- [ ] Dashboard de analytics
- [ ] Notificações push no mobile

---

## ⚠️ Aviso

Projeto para fins educacionais e prototipagem.
Verifique conformidade com LGPD e regulamentações aplicáveis antes de usar em produção com dados sensíveis de saúde ou educação.

---

## 📄 Licença

MIT

---

## 👨‍💻 Autor

**Nielsen Castelo**  
AI Engineer · Data Scientist · Builder · PhD
