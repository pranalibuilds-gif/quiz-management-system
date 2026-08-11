import pytest
from httpx import AsyncClient
from app.core.config import settings
from app.shared.enums import QuizStatus, UserRole

@pytest.mark.asyncio
async def test_quiz_lifecycle_and_versioning(client: AsyncClient):
    # 1. Admin Login
    admin_reg = {
        "full_name": "Admin User",
        "username": "admin",
        "email": "admin@example.com",
        "password": "Password123!",
        "role": "ADMIN"
    }
    await client.post(f"{settings.API_V1_STR}/users/register", json=admin_reg)
    login_res = await client.post(f"{settings.API_V1_STR}/auth/login", json={"identifier": "admin", "password": "Password123!"})
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Category
    cat_res = await client.post(f"{settings.API_V1_STR}/categories/", headers=headers, json={"name": "Programming", "description": "Dev tests"})
    category_id = cat_res.json()["data"]["id"]

    # 3. Create Quiz Draft
    quiz_res = await client.post(f"{settings.API_V1_STR}/quizzes/", headers=headers, json={
        "title": "Python Basics",
        "description": "Intro to Python",
        "category_id": category_id,
        "duration_minutes": 10
    })
    quiz_id = quiz_res.json()["data"]["id"]
    assert quiz_res.json()["data"]["status"] == QuizStatus.DRAFT

    # 4. Add Question
    await client.post(f"{settings.API_V1_STR}/quizzes/{quiz_id}/questions", headers=headers, json={
        "text": "What is Python?",
        "options": [
            {"text": "A language", "is_correct": True},
            {"text": "A snake", "is_correct": False}
        ],
        "marks": 1.0
    })

    # 5. Publish Quiz
    pub_res = await client.patch(f"{settings.API_V1_STR}/quizzes/{quiz_id}/status", headers=headers, json={"status": QuizStatus.PUBLISHED})
    assert pub_res.status_code == 200
    assert pub_res.json()["data"]["status"] == QuizStatus.PUBLISHED

    # 6. Edit Published Quiz (Trigger Versioning)
    update_res = await client.patch(f"{settings.API_V1_STR}/quizzes/{quiz_id}", headers=headers, json={"title": "Python Advanced"})
    assert update_res.status_code == 201 # Created new version
    assert update_res.json()["data"]["version"] == 2
    assert update_res.json()["data"]["status"] == QuizStatus.DRAFT
    assert update_res.json()["data"]["id"] != quiz_id
