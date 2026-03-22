# Runbook de testes

## Teste 1 — BridgeForm com texto
1. Suba a API.
2. Abra `/translator`.
3. Cole `sample-data/sample_notice.txt`.
4. Valide:
   - resumo simples
   - prazo detectado
   - documentos exigidos
   - riscos

## Teste 2 — BridgeForm com arquivo
1. Use `sample-data/sample_notice.txt`.
2. Salve como `.txt`.
3. Envie o arquivo na mesma tela.

## Teste 3 — ReadBuddy
1. Crie um perfil.
2. Use `sample-data/sample_passage.txt`.
3. Informe uma transcrição com um ou dois erros.
4. Valide:
   - precisão > 0
   - ppm > 0
   - erros listados
   - exercícios criados

## Teste 4 — API via Swagger
Abra `/docs` e execute os endpoints manualmente.

## Teste automatizado
```bash
cd api
pytest
```
