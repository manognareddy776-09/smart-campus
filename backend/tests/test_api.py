import sys
from pathlib import Path
from datetime import datetime

# Ensure backend root directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    import pytest
    fixture = pytest.fixture(autouse=True)
except ImportError:
    # Graceful fallback decorator if pytest is not installed in the active environment
    def fixture(fn):
        return fn

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Campus, User, Item

# In-memory SQLite for isolated test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@fixture
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    c = Campus(id="camp-test-1", name="Test Campus", location="Academic Block")
    db.add(c)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_register_and_login_flow():
    # Register
    reg_payload = {
        "email": "student@campus.edu",
        "password": "Password123!",
        "display_name": "John Doe",
        "college_id": "CS-2024-001"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["user"]["email"] == "student@campus.edu"
    assert token_data["user"]["role"] == "user"

    # Login
    login_payload = {
        "email": "student@campus.edu",
        "password": "Password123!"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 200
    token = res.json()["access_token"]

    # Access protected /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    res_me = client.get("/api/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["display_name"] == "John Doe"

def test_item_creation_and_retrieval():
    # Register user
    reg = client.post("/api/auth/register", json={
        "email": "reporter@campus.edu",
        "password": "Password123!",
        "display_name": "Reporter Bob"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Lost Item
    item_payload = {
        "title": "Titan Black Chronograph Watch",
        "description": "Lost near cafeteria tables around noon. Metallic strap.",
        "category": "Accessories",
        "report_type": "lost",
        "general_location": "Cafeteria Ground Floor",
        "event_date": datetime.now().isoformat()
    }
    create_res = client.post("/api/items", json=item_payload, headers=headers)
    assert create_res.status_code == 201
    item_data = create_res.json()
    public_id = item_data["public_id"]
    assert public_id.startswith("LF-")

    # Get Item by Public ID
    get_res = client.get(f"/api/items/{public_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Titan Black Chronograph Watch"

    # List items with filter
    list_res = client.get("/api/items?category=Accessories&report_type=lost")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

def test_claim_submission_and_privacy():
    # User 1 creates found item
    u1 = client.post("/api/auth/register", json={
        "email": "finder@campus.edu", "password": "Password123!", "display_name": "Finder Alice"
    }).json()
    t1_headers = {"Authorization": f"Bearer {u1['access_token']}"}

    found_res = client.post("/api/items", json={
        "title": "Black Wallet",
        "description": "Found leather wallet near library",
        "category": "Wallets",
        "report_type": "found",
        "general_location": "Library lobby",
        "event_date": datetime.now().isoformat()
    }, headers=t1_headers)
    public_id = found_res.json()["public_id"]

    # User 2 claims it
    u2 = client.post("/api/auth/register", json={
        "email": "claimant@campus.edu", "password": "Password123!", "display_name": "Claimant Charlie"
    }).json()
    t2_headers = {"Authorization": f"Bearer {u2['access_token']}"}

    claim_res = client.post(f"/api/items/{public_id}/claims", json={
        "private_claim_details": "It has my driving license ending in 8842 and a green library card inside."
    }, headers=t2_headers)
    assert claim_res.status_code == 201
    claim_id = claim_res.json()["id"]

    # Finder checks claims
    item_claims = client.get(f"/api/items/{public_id}/claims", headers=t1_headers)
    assert item_claims.status_code == 200
    assert len(item_claims.json()) == 1
    assert item_claims.json()[0]["claimant_name"] == "Claimant Charlie"

    # Finder accepts claim
    patch_res = client.patch(f"/api/claims/{claim_id}", json={
        "status": "accepted",
        "finder_notes": "Please meet at Security Desk at 4 PM"
    }, headers=t1_headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "accepted"

def test_admin_access_control():
    # Regular user tries to access /api/admin/stats -> 403
    reg = client.post("/api/auth/register", json={
        "email": "regular@campus.edu", "password": "Password123!", "display_name": "Regular User"
    })
    user_token = reg.json()["access_token"]
    res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {user_token}"})
    assert res.status_code == 403

if __name__ == "__main__":
    try:
        import pytest
        sys.exit(pytest.main(["-v", str(Path(__file__).resolve())]))
    except ImportError:
        print("\n=== Running API Tests (Standalone Mode) ===")
        tests = [
            ("test_health_check", test_health_check),
            ("test_register_and_login_flow", test_register_and_login_flow),
            ("test_item_creation_and_retrieval", test_item_creation_and_retrieval),
            ("test_claim_submission_and_privacy", test_claim_submission_and_privacy),
            ("test_admin_access_control", test_admin_access_control),
        ]
        passed = 0
        for name, test_fn in tests:
            gen = setup_database()
            try:
                if hasattr(gen, "__next__"):
                    next(gen)
                test_fn()
                print(f" ✓ {name} PASSED")
                passed += 1
            except Exception as e:
                print(f" ✗ {name} FAILED: {e}")
            finally:
                if hasattr(gen, "__next__"):
                    try:
                        next(gen)
                    except StopIteration:
                        pass
        print(f"\nResult: {passed}/{len(tests)} tests passed.\n")
        sys.exit(0 if passed == len(tests) else 1)
