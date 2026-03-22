from fastapi.testclient import TestClient

from app.main import app


def test_health():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


def test_bureaucracy_text_analysis():
    payload = {
        "raw_text": (
            "Notificação administrativa. Comparecer até 15/04/2026 com documento oficial com foto, "
            "CPF e comprovante de residência para regularizar o benefício."
        )
    }
    with TestClient(app) as client:
        response = client.post("/api/v1/bureaucracy/analyze-text", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["detected_document_type"]
        assert len(data["deadlines"]) >= 1


def test_create_profile_and_analyze_reading():
    with TestClient(app) as client:
        profile_response = client.post(
            "/api/v1/readbuddy/profiles",
            json={
                "full_name": "Aluno Teste",
                "age": 8,
                "grade_level": "3º ano",
                "language": "pt-BR",
            },
        )
        assert profile_response.status_code == 201
        profile_id = profile_response.json()["id"]

        analysis_response = client.post(
            "/api/v1/readbuddy/analyze-reading",
            json={
                "profile_id": profile_id,
                "expected_text": "A arara azul vive em algumas regiões do Brasil.",
                "transcript": "A arara azul vive em algumas regiao do Brasil.",
                "duration_seconds": 20,
                "language": "pt-BR",
            },
        )
        assert analysis_response.status_code == 200
        data = analysis_response.json()
        assert data["accuracy_score"] > 60
        assert data["words_per_minute"] > 0
