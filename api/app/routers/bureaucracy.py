from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.schemas.bureaucracy_schemas import BureaucracyAnalysisResponse, BureaucracyAnalyzeTextRequest
from app.services.bureaucracy_service import BureaucracyService
from app.services.text_extractor import (
    OcrNotConfiguredError,
    UnsupportedFileTypeError,
    extract_text_from_upload,
)

router = APIRouter()
service = BureaucracyService()


@router.post("/bureaucracy/analyze-text", response_model=BureaucracyAnalysisResponse)
async def analyze_text(payload: BureaucracyAnalyzeTextRequest) -> BureaucracyAnalysisResponse:
    result = await service.analyze(payload.raw_text, context_notes=payload.context_notes)
    return result


@router.post("/bureaucracy/analyze-file", response_model=BureaucracyAnalysisResponse)
async def analyze_file(
    file: UploadFile = File(...),
    context_notes: str | None = Form(default=None),
) -> BureaucracyAnalysisResponse:
    data = await file.read()

    try:
        extracted_text, _ocr_used = extract_text_from_upload(file.filename or "documento.bin", data)
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except OcrNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Não foi possível extrair texto útil do arquivo enviado.",
        )

    result = await service.analyze(extracted_text, context_notes=context_notes)
    result.extracted_text = extracted_text
    return result
