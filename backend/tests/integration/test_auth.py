import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    payload = {
        "full_name": "Test Student",
        "username": "teststudent",
        "email": "test@example.com",
        "password": "Password123!",
        "role": "STUDENT"
    }
    response = await client.post(f"{settings.API_V1_STR}/users/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["username"] == "teststudent"
    assert "id" in data["data"]

@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient):
    payload = {
        "full_name": "Test Student 2",
        "username": "teststudent",
        "email": "test2@example.com",
        "password": "Password123!",
        "role": "STUDENT"
    }
    # First registration
    await client.post(f"{settings.API_V1_STR}/users/register", json=payload)

    # Duplicate registration
    response = await client.post(f"{settings.API_V1_STR}/users/register", json=payload)
    assert response.status_code == 400
    assert "Username already exists" in response.json()["message"]

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Register first
    reg_payload = {
        "full_name": "Login User",
        "username": "loginuser",
        "email": "login@example.com",
        "password": "Password123!",
        "role": "STUDENT"
    }
    await client.post(f"{settings.API_V1_STR}/users/register", json=reg_payload)

    # Login
    login_payload = {
        "identifier": "loginuser",
        "password": "Password123!"
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["user"]["username"] == "loginuser"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    login_payload = {
        "identifier": "nonexistent",
        "password": "wrongpassword"
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["message"]

@pytest.mark.asyncio
async def test_get_me_protected(client: AsyncClient):
    # Register and Login
    reg_payload = {
        "full_name": "Me User",
        "username": "meuser",
        "email": "me@example.com",
        "password": "Password123!",
        "role": "STUDENT"
    }
    await client.post(f"{settings.API_V1_STR}/users/register", json=reg_payload)

    login_res = await client.post(f"{settings.API_V1_STR}/auth/login", json={
        "identifier": "meuser",
        "password": "Password123!"
    })
    token = login_res.json()["data"]["access_token"]

    # Get Me
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get(f"{settings.API_V1_STR}/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["data"]["username"] == "meuser"
