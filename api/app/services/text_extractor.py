from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Tuple

from docx import Document
from pypdf import PdfReader

from app.core.config import settings


class UnsupportedFileTypeError(ValueError):
    pass


class OcrNotConfiguredError(RuntimeError):
    pass


def _assert_size(data: bytes) -> None:
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise ValueError(f"Arquivo maior que {settings.max_upload_size_mb} MB.")


def extract_text_from_upload(filename: str, data: bytes) -> Tuple[str, bool]:
    _assert_size(data)
    suffix = Path(filename).suffix.lower()

    if suffix in {".txt", ".md"}:
        return data.decode("utf-8", errors="ignore"), False

    if suffix == ".pdf":
        reader = PdfReader(BytesIO(data))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        return "\n".join(pages).strip(), False

    if suffix == ".docx":
        document = Document(BytesIO(data))
        paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
        return "\n".join(paragraphs).strip(), False

    if suffix in {".png", ".jpg", ".jpeg", ".webp"}:
        try:
            from PIL import Image
            import pytesseract
        except Exception as exc:
            raise OcrNotConfiguredError(
                "OCR para imagem requer Pillow + pytesseract e o binário Tesseract instalado no sistema."
            ) from exc

        img = Image.open(BytesIO(data))
        text = pytesseract.image_to_string(img, lang="por+eng")
        return text.strip(), True

    raise UnsupportedFileTypeError(
        "Formato não suportado. Use TXT, MD, PDF, DOCX, PNG, JPG, JPEG ou WEBP."
    )
