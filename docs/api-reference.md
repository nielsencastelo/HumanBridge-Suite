# API Reference

## Health
### `GET /api/v1/health`
Retorna status simples.

## BridgeForm
### `POST /api/v1/bureaucracy/analyze-text`
Entrada:
```json
{
  "raw_text": "texto longo",
  "context_notes": "opcional"
}
```

### `POST /api/v1/bureaucracy/analyze-file`
Multipart:
- `file`
- `context_notes` opcional

## ReadBuddy
### `POST /api/v1/readbuddy/profiles`
```json
{
  "full_name": "Ana",
  "age": 8,
  "grade_level": "3º ano",
  "language": "pt-BR"
}
```

### `GET /api/v1/readbuddy/profiles`

### `GET /api/v1/readbuddy/profiles/{profile_id}`

### `GET /api/v1/readbuddy/profiles/{profile_id}/sessions`

### `POST /api/v1/readbuddy/analyze-reading`
```json
{
  "profile_id": 1,
  "expected_text": "texto correto",
  "transcript": "texto lido",
  "duration_seconds": 25,
  "language": "pt-BR"
}
```
