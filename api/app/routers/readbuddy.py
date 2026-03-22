from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.deps import SessionDep
from app.models import ReadingSession, StudentProfile
from app.schemas.common import ApiListResponse
from app.schemas.readbuddy_schemas import (
    AnalyzeReadingRequest,
    ReadingAnalysisResponse,
    ReadingSessionRead,
    StudentProfileCreate,
    StudentProfileRead,
)
from app.services.readbuddy_service import ReadBuddyService

router = APIRouter()
service = ReadBuddyService()


@router.post("/readbuddy/profiles", response_model=StudentProfileRead, status_code=status.HTTP_201_CREATED)
def create_profile(payload: StudentProfileCreate, session: SessionDep) -> StudentProfileRead:
    profile = StudentProfile(**payload.model_dump())
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return StudentProfileRead.model_validate(profile)


@router.get("/readbuddy/profiles", response_model=ApiListResponse[StudentProfileRead])
def list_profiles(session: SessionDep) -> ApiListResponse[StudentProfileRead]:
    rows = session.exec(select(StudentProfile).order_by(StudentProfile.id.desc())).all()
    items = [StudentProfileRead.model_validate(row) for row in rows]
    return ApiListResponse(items=items, total=len(items))


@router.get("/readbuddy/profiles/{profile_id}", response_model=StudentProfileRead)
def get_profile(profile_id: int, session: SessionDep) -> StudentProfileRead:
    profile = session.get(StudentProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado.")
    return StudentProfileRead.model_validate(profile)


@router.get("/readbuddy/profiles/{profile_id}/sessions", response_model=ApiListResponse[ReadingSessionRead])
def list_profile_sessions(profile_id: int, session: SessionDep) -> ApiListResponse[ReadingSessionRead]:
    profile = session.get(StudentProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado.")

    rows = session.exec(
        select(ReadingSession)
        .where(ReadingSession.profile_id == profile_id)
        .order_by(ReadingSession.id.desc())
    ).all()
    items = [ReadingSessionRead.model_validate(row) for row in rows]
    return ApiListResponse(items=items, total=len(items))


@router.post("/readbuddy/analyze-reading", response_model=ReadingAnalysisResponse)
async def analyze_reading(payload: AnalyzeReadingRequest, session: SessionDep) -> ReadingAnalysisResponse:
    profile = None
    if payload.profile_id:
        profile = session.get(StudentProfile, payload.profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Perfil não encontrado.")

    analysis = await service.analyze(payload, profile=profile)

    session_model = service.to_session_model(payload, analysis)
    session.add(session_model)
    session.commit()

    return analysis
