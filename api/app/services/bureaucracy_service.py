from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from dateutil import parser as date_parser

from app.schemas.bureaucracy_schemas import (
    ActionItem,
    BureaucracyAnalysisResponse,
    DeadlineItem,
    FieldHelpItem,
)
from app.services.llm_client import OptionalLlmClient
from app.utils.text import first_sentence, normalize_text


DATE_PATTERNS = [
    r"\b\d{1,2}/\d{1,2}/\d{2,4}\b",
    r"\b\d{1,2}-\d{1,2}-\d{2,4}\b",
    r"\b\d{1,2}\s+de\s+[a-zçãéíóú]+\s+de\s+\d{4}\b",
]

DOC_KEYWORDS = {
    "notificação": "Notificação administrativa",
    "intimação": "Intimação",
    "contrato": "Contrato",
    "laudo": "Laudo",
    "benefício": "Processo de benefício",
    "cadastro": "Atualização cadastral",
    "multa": "Cobrança ou multa",
    "escola": "Comunicado escolar",
    "hospital": "Comunicado de saúde",
}

REQUIRED_DOC_PATTERNS = [
    r"documento oficial com foto",
    r"cpf",
    r"rg",
    r"comprovante de residência(?: atualizado)?",
    r"comprovante de renda",
    r"carteira de vacinação",
    r"certidão de nascimento",
    r"receita médica",
]

RISK_PATTERNS = [
    ("bloqueio", "O processo pode ser bloqueado."),
    ("suspens", "Pode haver suspensão temporária do serviço ou benefício."),
    ("multa", "Pode gerar multa ou cobrança."),
    ("indefer", "O pedido pode ser negado."),
    ("cancel", "O processo pode ser cancelado."),
]

ACTION_PATTERNS = [
    ("comparecer", "Comparecer presencialmente"),
    ("apresentar", "Apresentar documentos"),
    ("regularizar", "Regularizar a pendência"),
    ("preencher", "Preencher os campos exigidos"),
    ("assinar", "Assinar o documento"),
    ("enviar", "Enviar documentação"),
]

QUESTION_LIBRARY = [
    "Qual é o último prazo válido para entrega?",
    "Posso enviar os documentos online ou preciso comparecer pessoalmente?",
    "Existe protocolo, recibo ou número de atendimento para acompanhar o processo?",
    "O que acontece se eu não conseguir cumprir o prazo completo?",
]

FIELD_HINTS = {
    "nome": "Digite o nome completo sem abreviações.",
    "cpf": "Digite somente números ou conforme o padrão do formulário.",
    "rg": "Informe o número do documento de identidade.",
    "endereço": "Preencha com rua, número, bairro, cidade e CEP.",
    "telefone": "Informe telefone com DDD.",
    "assinatura": "Assine igual ao documento oficial.",
    "data": "Use o formato solicitado pelo formulário.",
}


class BureaucracyService:
    def __init__(self) -> None:
        self.llm = OptionalLlmClient()

    def detect_type_and_topic(self, text: str) -> Tuple[str, str]:
        normalized = normalize_text(text)
        detected = "Documento geral"
        topic = "Solicitação ou aviso formal"

        for keyword, label in DOC_KEYWORDS.items():
            if keyword in normalized:
                detected = label
                topic = label
                break

        if "benefício" in normalized or "assistencia social" in normalized:
            topic = "Regularização de benefício social"
        elif "imposto" in normalized:
            topic = "Pendência tributária"
        elif "escola" in normalized or "matrícula" in normalized:
            topic = "Regularização escolar"

        return detected, topic

    def extract_deadlines(self, text: str) -> List[DeadlineItem]:
        found: List[DeadlineItem] = []
        for pattern in DATE_PATTERNS:
            for match in re.finditer(pattern, text, flags=re.IGNORECASE):
                raw = match.group(0)
                normalized_date = None
                confidence = 0.72
                try:
                    parsed = date_parser.parse(raw, dayfirst=True, fuzzy=True)
                    normalized_date = parsed.date().isoformat()
                    confidence = 0.92
                except Exception:
                    pass
                found.append(
                    DeadlineItem(raw_text=raw, normalized_date=normalized_date, confidence=confidence)
                )

        seen = set()
        unique = []
        for item in found:
            key = (item.raw_text, item.normalized_date)
            if key not in seen:
                seen.add(key)
                unique.append(item)
        return unique

    def extract_required_documents(self, text: str) -> List[str]:
        normalized = normalize_text(text)
        docs = []
        for pattern in REQUIRED_DOC_PATTERNS:
            if re.search(pattern, normalized, flags=re.IGNORECASE):
                docs.append(pattern.replace(r"(?: atualizado)?", "").replace("\\", ""))

        list_lines = re.findall(r"^\s*\d+[.)-]?\s+(.+)$", text, flags=re.MULTILINE)
        for line in list_lines:
            low = line.lower().strip()
            if any(word in low for word in ["cpf", "rg", "comprovante", "documento", "certidão", "receita"]):
                docs.append(line.strip(" .;"))

        deduped = []
        for item in docs:
            cleaned = item.strip().capitalize()
            if cleaned and cleaned not in deduped:
                deduped.append(cleaned)
        return deduped[:10]

    def extract_risks(self, text: str) -> List[str]:
        normalized = normalize_text(text)
        risks = []
        for key, description in RISK_PATTERNS:
            if key in normalized:
                risks.append(description)
        if not risks:
            risks.append("Sem ação, você pode atrasar o processo e precisar repetir etapas.")
        return risks

    def extract_actions(self, text: str, deadlines: List[DeadlineItem]) -> List[ActionItem]:
        normalized = normalize_text(text)
        actions: List[ActionItem] = []

        for key, label in ACTION_PATTERNS:
            if key in normalized:
                why = "Essa etapa aparece de forma explícita no documento."
                priority = "high" if deadlines else "medium"
                actions.append(ActionItem(title=label, why_it_matters=why, priority=priority))

        if deadlines:
            actions.insert(
                0,
                ActionItem(
                    title="Anotar e cumprir o prazo principal",
                    why_it_matters="O documento menciona um prazo objetivo que afeta a continuidade do processo.",
                    priority="high",
                ),
            )

        if not actions:
            actions.append(
                ActionItem(
                    title="Ler a exigência principal e confirmar se há prazo",
                    why_it_matters="Nem todo documento usa linguagem clara. O primeiro passo é confirmar a obrigação principal.",
                    priority="medium",
                )
            )

        deduped = []
        seen_titles = set()
        for action in actions:
            if action.title not in seen_titles:
                seen_titles.add(action.title)
                deduped.append(action)
        return deduped[:6]

    def extract_entities(self, text: str) -> List[str]:
        entities = []
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        for line in lines[:20]:
            if any(token in line.lower() for token in ["secretaria", "prefeitura", "hospital", "escola", "tribunal", "cartório"]):
                entities.append(line)
        return entities[:5]

    def infer_fill_help(self, text: str) -> List[FieldHelpItem]:
        items: List[FieldHelpItem] = []
        for line in text.splitlines():
            clean = line.strip()
            if ":" in clean and len(clean) < 80:
                field_name = clean.split(":")[0].strip().lower()
                for hint_key, hint in FIELD_HINTS.items():
                    if hint_key in field_name:
                        items.append(
                            FieldHelpItem(
                                field_name=field_name.title(),
                                what_to_fill=hint,
                                example_value="Exemplo: João da Silva" if hint_key == "nome" else None,
                            )
                        )
                        break
            if "____" in clean or "campo" in clean.lower():
                items.append(
                    FieldHelpItem(
                        field_name="Campo identificado no formulário",
                        what_to_fill="Preencha exatamente com os dados pedidos, sem abreviações desnecessárias.",
                    )
                )

        if not items:
            items = [
                FieldHelpItem(
                    field_name="Nome completo",
                    what_to_fill="Preencha com o nome completo igual ao documento oficial.",
                    example_value="Maria de Souza Lima",
                ),
                FieldHelpItem(
                    field_name="CPF",
                    what_to_fill="Digite o CPF do titular do processo.",
                    example_value="000.000.000-00",
                ),
            ]
        return items[:6]

    def infer_urgency(self, deadlines: List[DeadlineItem], text: str) -> str:
        normalized = normalize_text(text)
        if any(word in normalized for word in ["urgente", "imediato", "prazo final", "último prazo"]):
            return "high"
        if deadlines:
            for item in deadlines:
                if item.normalized_date:
                    try:
                        days_left = (datetime.fromisoformat(item.normalized_date).replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)).days
                        if days_left <= 7:
                            return "high"
                        if days_left <= 30:
                            return "medium"
                    except Exception:
                        continue
            return "medium"
        return "low"

    def build_summary(self, doc_type: str, topic: str, text: str, actions: List[ActionItem], deadlines: List[DeadlineItem]) -> str:
        summary = f"Este documento parece ser {doc_type.lower()} sobre {topic.lower()}."
        if deadlines:
            raw = deadlines[0].raw_text
            summary += f" Há pelo menos um prazo citado no texto: {raw}."
        if actions:
            summary += f" A ação principal agora é: {actions[0].title.lower()}."
        first = first_sentence(text)
        if first:
            summary += f" Trecho inicial relevante: {first}"
        return summary

    async def analyze(self, raw_text: str, context_notes: Optional[str] = None) -> BureaucracyAnalysisResponse:
        doc_type, topic = self.detect_type_and_topic(raw_text)
        deadlines = self.extract_deadlines(raw_text)
        required_documents = self.extract_required_documents(raw_text)
        risks = self.extract_risks(raw_text)
        actions = self.extract_actions(raw_text, deadlines)
        entities = self.extract_entities(raw_text)
        fill_help = self.infer_fill_help(raw_text)
        urgency = self.infer_urgency(deadlines, raw_text)
        confidence = 0.84 if deadlines or required_documents else 0.74

        summary = self.build_summary(doc_type, topic, raw_text, actions, deadlines)

        llm_used = False
        llm_summary = await self.llm.rewrite(
            system_prompt=(
                "Reescreva documentos burocráticos em português simples, com no máximo 4 frases, "
                "sem inventar fatos e sem juridiquês."
            ),
            user_prompt=(
                f"Contexto extra: {context_notes or 'nenhum'}\n\n"
                f"Resumo base: {summary}\n\n"
                f"Texto original:\n{raw_text[:5000]}"
            ),
        )
        if llm_summary:
            summary = llm_summary.strip()
            llm_used = True

        questions = QUESTION_LIBRARY.copy()
        if required_documents:
            questions.insert(0, "Todos os documentos exigidos podem ser entregues em cópia simples?")

        return BureaucracyAnalysisResponse(
            detected_document_type=doc_type,
            main_topic=topic,
            plain_language_summary=summary,
            what_you_need_to_do_now=actions,
            deadlines=deadlines,
            required_documents=required_documents,
            risks_if_ignored=risks,
            fill_help=fill_help,
            questions_to_ask=questions[:6],
            important_entities=entities,
            urgency=urgency,
            confidence=confidence,
            llm=self.llm.info(used=llm_used),
        )
