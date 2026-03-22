# Arquitetura

## Visão geral
```text
Next.js Web  ─────┐
                  ├──> FastAPI ───> SQLite
Expo Mobile ──────┘         │
                            └──> OCR opcional / LLM opcional
```

## Módulos
### BridgeForm
- Entrada: texto ou arquivo
- Extração:
  - TXT/MD: leitura direta
  - PDF: `pypdf`
  - DOCX: `python-docx`
  - Imagens: `pytesseract` opcional
- Análise:
  - tipo de documento
  - tópico principal
  - prazos
  - documentos exigidos
  - riscos
  - ações imediatas
  - ajuda de preenchimento

### ReadBuddy
- Cadastro de perfil
- Análise de leitura
- Métricas:
  - precisão estimada
  - palavras por minuto
  - erros por troca/omissão/inserção
  - nível estimado
- Saída:
  - feedback para responsável
  - feedback para aluno
  - perguntas de compreensão
  - microexercícios
  - plano da próxima sessão

## Persistência
SQLite foi escolhido para reduzir custo e deixar o MVP pronto para rodar sem banco externo.

## Próximos passos de produção
- autenticação
- armazenamento em nuvem
- fila assíncrona para OCR pesado
- gravação de áudio
- ASR real com Whisper/Faster-Whisper
- RBAC e trilha de auditoria
