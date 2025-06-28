import os
import tempfile
import pytest
from app import app
from models import db, User, Membership, PaymentHistory

@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    # Use in-memory SQLite database for better isolation
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()

@pytest.fixture
def auth_client(client):
    """Create a test client with an authenticated user."""
    import uuid
    # Create a test user with unique credentials
    with app.app_context():
        unique_id = uuid.uuid4().hex[:8]
        user = User(
            username=f'testuser_{unique_id}',
            email=f'test_{unique_id}@example.com',
            password_hash='hashed_password'
        )
        db.session.add(user)
        db.session.commit()
        
        # Log in the user
        with client.session_transaction() as sess:
            sess['user_id'] = user.id
    
    return client

@pytest.fixture
def sample_user():
    """Create a sample user for testing."""
    import uuid
    unique_id = uuid.uuid4().hex[:8]
    return {
        'username': f'testuser_{unique_id}',
        'email': f'test_{unique_id}@example.com',
        'password': 'testpassword123'
    }

@pytest.fixture
def sample_membership():
    """Create sample membership data."""
    return {
        'plan_type': 'monthly',
        'status': 'active',
        'stripe_subscription_id': 'sub_test123'
    } 