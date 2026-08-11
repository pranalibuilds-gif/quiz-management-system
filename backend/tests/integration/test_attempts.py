import pytest
from httpx import AsyncClient
from app.core.config import settings
from app.shared.enums import QuizStatus, AttemptStatus

@pytest.mark.asyncio
async def test_full_quiz_attempt_flow(client: AsyncClient):
    # 1. Setup: Admin creates and publishes quiz
    admin_reg = {"full_name": "Admin", "username": "admin2", "email": "admin2@example.com", "password": "Password123!", "role": "ADMIN"}
    await client.post(f"{settings.API_V1_STR}/users/register", json=admin_reg)
    login_res = await client.post(f"{settings.API_V1_STR}/auth/login", json={"identifier": "admin2", "password": "Password123!"})
    admin_token = login_res.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    cat_res = await client.post(f"{settings.API_V1_STR}/categories/", headers=admin_headers, json={"name": "Science"})
    cat_id = cat_res.json()["data"]["id"]

    quiz_res = await client.post(f"{settings.API_V1_STR}/quizzes/", headers=admin_headers, json={"title": "Biology", "category_id": cat_id})
    quiz_id = quiz_res.json()["data"]["id"]

    await client.post(f"{settings.API_V1_STR}/quizzes/{quiz_id}/questions", headers=admin_headers, json={
        "text": "Cell power?", "options": [{"text": "Mito", "is_correct": True}, {"text": "Nucleus", "is_correct": False}]
    })
    await client.patch(f"{settings.API_V1_STR}/quizzes/{quiz_id}/status", headers=admin_headers, json={"status": QuizStatus.PUBLISHED})

    # 2. Student: Start Attempt
    stu_reg = {"full_name": "Student", "username": "stu1", "email": "stu1@example.com", "password": "Password123!", "role": "STUDENT"}
    await client.post(f"{settings.API_V1_STR}/users/register", json=stu_reg)
    login_stu = await client.post(f"{settings.API_V1_STR}/auth/login", json={"identifier": "stu1", "password": "Password123!"})
    stu_token = login_stu.json()["data"]["access_token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    start_res = await client.post(f"{settings.API_V1_STR}/attempts/{quiz_id}/start", headers=stu_headers)
    assert start_res.status_code == 201
    attempt = start_res.json()["data"]
    attempt_id = attempt["id"]
    question_id = attempt["questions"][0]["question_id"]
    option_id = next(opt["option_id"] for opt in attempt["questions"][0]["options"] if opt["option_text"] == "Mito")

    # 3. Student: Submit correct answer
    sub_payload = {"answers": [{"question_id": question_id, "option_id": option_id}]}
    submit_res = await client.post(f"{settings.API_V1_STR}/attempts/{attempt_id}/submit", headers=stu_headers, json=sub_payload)

    assert submit_res.status_code == 200
    res_data = submit_res.json()["data"]
    assert res_data["score"] == 1.0
    assert res_data["percentage"] == 100.0
    assert res_data["status"] == AttemptStatus.SUBMITTED
