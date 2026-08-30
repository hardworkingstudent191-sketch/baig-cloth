"""
Shared test fixtures.

The suite runs against a real Postgres — `DATABASE_URL`, the same variable
the app itself reads — because `Product.image_urls` is a Postgres ARRAY
column that doesn't exist on SQLite. CI points this at a throwaway service
container (see .github/workflows/ci.yml). Running it locally works the same
way against your own dev Postgres, but every write below happens inside a
single connection-level transaction that is rolled back after each test
(the standard SQLAlchemy "join a session into an external transaction"
pattern, using a SAVEPOINT so route handlers are free to call
`db.commit()` without ending the outer transaction early) — so nothing a
test does should ever persist. Don't point this at data you'd miss anyway.
"""

import pytest
from sqlalchemy import event
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, engine, get_db
from app.auth import hash_password
from app.models import AdminUser, Category, Gender
from app.rate_limit import _attempts as _rate_limit_attempts


@pytest.fixture(scope="session", autouse=True)
def _schema():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    # The login rate limiter is deliberately a plain in-process dict (see
    # app/rate_limit.py) — appropriate for the single-process app, but that
    # means it's shared, mutable state across every test in this session.
    # Without clearing it, an unrelated test that logs in more than 5 times
    # total would start getting 429s regardless of whether its own
    # credentials were correct. Resetting it here keeps tests independent
    # of run order, the same way the DB transaction rollback does for data.
    _rate_limit_attempts.clear()
    yield
    _rate_limit_attempts.clear()


@pytest.fixture()
def db_session():
    connection = engine.connect()
    outer_transaction = connection.begin()
    session = Session(bind=connection)

    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, trans):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield session
    finally:
        app.dependency_overrides.pop(get_db, None)
        session.close()
        outer_transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    return TestClient(app)


@pytest.fixture()
def admin_user(db_session):
    admin = AdminUser(username="test-admin", password_hash=hash_password("correct-horse-battery-staple"))
    db_session.add(admin)
    db_session.flush()
    return admin


@pytest.fixture()
def category(db_session):
    cat = Category(name="Test Category", gender=Gender.men, sort_order=0)
    db_session.add(cat)
    db_session.flush()
    return cat


@pytest.fixture()
def auth_headers(client, admin_user):
    res = client.post(
        "/admin/login",
        json={"username": admin_user.username, "password": "correct-horse-battery-staple"},
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}
