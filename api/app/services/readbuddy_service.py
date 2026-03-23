from __future__ import annotations

from difflib import SequenceMatcher
from typing import List, Optional

from rapidfuzz.distance import Levenshtein

from app.models import ReadingSession, StudentProfile
from app.schemas.readbuddy_schemas import (
    AnalyzeReadingRequest,
    ReadingAnalysisResponse,
    ReadingExercise,
    ReadingMistake,
)
from app.services.llm_client import OptionalLlmClient
from app.utils.text import tokenize


GRADE_TARGETS = {
    "1º ano": (20, 45),
    "2º ano": (35, 65),
    "3º ano": (50, 80),
    "4º ano": (70, 100),
    "5º ano": (85, 120),
}


class ReadBuddyService:
    def __init__(self) -> None:
        self.llm = OptionalLlmClient()

    def compute_accuracy(self, expected_tokens: List[str], transcript_tokens: List[str]) -> float:
        expected_text = " ".join(expected_tokens)
        transcript_text = " ".join(transcript_tokens)
        max_len = max(len(expected_text), 1)
        distance = Levenshtein.distance(expected_text, transcript_text)
        accuracy = max(0.0, 1.0 - (distance / max_len))
        return round(accuracy * 100, 2)

    def classify_mistakes(self, expected_tokens: List[str], transcript_tokens: List[str]) -> List[ReadingMistake]:
        matcher = SequenceMatcher(a=expected_tokens, b=transcript_tokens)
        mistakes: List[ReadingMistake] = []

        for opcode, a0, a1, b0, b1 in matcher.get_opcodes():
            if opcode == "equal":
                continue
            if opcode == "replace":
                for idx, (exp, got) in enumerate(zip(expected_tokens[a0:a1], transcript_tokens[b0:b1])):
                    mistakes.append(
                        ReadingMistake(kind="replace", expected=exp, spoken=got, position=a0 + idx)
                    )
            elif opcode == "delete":
                for idx, exp in enumerate(expected_tokens[a0:a1]):
                    mistakes.append(
                        ReadingMistake(kind="omit", expected=exp, spoken=None, position=a0 + idx)
                    )
            elif opcode == "insert":
                for idx, got in enumerate(transcript_tokens[b0:b1]):
                    mistakes.append(
                        ReadingMistake(kind="insert", expected=None, spoken=got, position=b0 + idx)
                    )
        return mistakes[:20]

    def compute_wpm(self, transcript_tokens: List[str], duration_seconds: float) -> float:
        minutes = duration_seconds / 60.0
        if minutes <= 0:
            return 0.0
        return round(len(transcript_tokens) / minutes, 2)

    def infer_reading_level(self, accuracy: float, wpm: float, grade_level: Optional[str] = None) -> str:
        if grade_level and grade_level in GRADE_TARGETS:
            low, high = GRADE_TARGETS[grade_level]
            if accuracy >= 96 and wpm >= high:
                return "acima do esperado"
            if accuracy >= 90 and wpm >= low:
                return "dentro do esperado"
            return "precisa de reforço"

        if accuracy >= 96 and wpm >= 90:
            return "forte"
        if accuracy >= 90 and wpm >= 60:
            return "intermediário"
        return "inicial"

    def build_exercises(self, mistakes: List[ReadingMistake], expected_tokens: List[str]) -> List[ReadingExercise]:
        target_words = []
        for item in mistakes:
            if item.expected:
                target_words.append(item.expected)
            elif item.spoken:
                target_words.append(item.spoken)

        unique_targets = []
        for word in target_words:
            if word and word not in unique_targets:
                unique_targets.append(word)

        if not unique_targets:
            unique_targets = expected_tokens[:3]

        exercises = [
            ReadingExercise(
                title="Leitura lenta guiada",
                instruction="Leia devagar cada palavra-alvo, batendo o dedo na mesa a cada sílaba.",
                target_words=unique_targets[:5],
            ),
            ReadingExercise(
                title="Eco de frases",
                instruction="Um adulto lê a frase correta e o aluno repete logo em seguida.",
                target_words=unique_targets[:5],
            ),
            ReadingExercise(
                title="Caça-palavras do texto",
                instruction="Peça ao aluno para localizar no texto as palavras que mais errou.",
                target_words=unique_targets[:5],
            ),
        ]
        return exercises

    def build_comprehension_questions(self, expected_text: str) -> List[str]:
        sentences = [chunk.strip() for chunk in expected_text.split(".") if chunk.strip()]
        base = [
            "Quem ou o que aparece no texto?",
            "O que aconteceu primeiro?",
            "Qual é a ideia principal do texto?",
        ]
        if sentences:
            base.insert(1, f"Explique com suas palavras esta ideia: {sentences[0][:90]}")
        return base[:4]

    async def analyze(
        self,
        payload: AnalyzeReadingRequest,
        profile: Optional[StudentProfile] = None,
    ) -> ReadingAnalysisResponse:
        expected_tokens = tokenize(payload.expected_text)
        transcript_tokens = tokenize(payload.transcript)

        accuracy = self.compute_accuracy(expected_tokens, transcript_tokens)
        mistakes = self.classify_mistakes(expected_tokens, transcript_tokens)
        wpm = self.compute_wpm(transcript_tokens, payload.duration_seconds)
        reading_level = self.infer_reading_level(accuracy, wpm, profile.grade_level if profile else None)
        exercises = self.build_exercises(mistakes, expected_tokens)
        questions = self.build_comprehension_questions(payload.expected_text)

        parent_feedback = (
            f"O aluno leu {len(transcript_tokens)} palavras em {payload.duration_seconds:.0f}s, "
            f"com precisão estimada de {accuracy:.1f}%. "
            f"O nível atual foi classificado como '{reading_level}'. "
            f"Foque nas palavras com erro e repita o texto em blocos curtos."
        )
        student_feedback = (
            "Você está avançando. Agora leia mais devagar, preste atenção nas palavras difíceis "
            "e repita as frases em voz clara."
        )

        next_plan = [
            "Repetir o mesmo texto por 2 rodadas curtas.",
            "Treinar 5 palavras com maior dificuldade.",
            "Responder 3 perguntas simples de compreensão.",
            "Finalizar com leitura em voz alta mais confiante.",
        ]

        # Use per-request credentials if provided, else server default
        if payload.llm_credentials:
            llm = OptionalLlmClient(
                override_base_url=payload.llm_credentials.base_url,
                override_api_key=payload.llm_credentials.api_key,
                override_model=payload.llm_credentials.model,
            )
        else:
            llm = self.llm

        llm_used = False
        llm_parent = await llm.rewrite(
            system_prompt=(
                "Você é um tutor de leitura. Reescreva o feedback para pais em português claro, "
                "em no máximo 4 frases, com tom encorajador."
            ),
            user_prompt=(
                f"Acurácia: {accuracy}\nWPM: {wpm}\nNível: {reading_level}\n"
                f"Erros: {[m.model_dump() for m in mistakes[:10]]}"
            ),
        )
        if llm_parent:
            parent_feedback = llm_parent.strip()
            llm_used = True

        return ReadingAnalysisResponse(
            profile_id=payload.profile_id,
            accuracy_score=accuracy,
            words_per_minute=wpm,
            words_expected=len(expected_tokens),
            words_spoken=len(transcript_tokens),
            reading_level=reading_level,
            parent_feedback=parent_feedback,
            student_feedback=student_feedback,
            next_session_plan=next_plan,
            mistakes=mistakes,
            exercises=exercises,
            comprehension_questions=questions,
            llm=llm.info(used=llm_used),
        )

    def to_session_model(
        self,
        payload: AnalyzeReadingRequest,
        analysis: ReadingAnalysisResponse,
    ) -> ReadingSession:
        return ReadingSession(
            profile_id=payload.profile_id,
            expected_text=payload.expected_text,
            transcript=payload.transcript,
            duration_seconds=payload.duration_seconds,
            accuracy_score=analysis.accuracy_score,
            words_per_minute=analysis.words_per_minute,
            reading_level=analysis.reading_level,
        )
