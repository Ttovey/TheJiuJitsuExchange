import pytest
import uuid
from datetime import datetime
from models import db, User, Membership, PaymentHistory
from test_config import client

def unique_username():
    """Generate a unique username for testing."""
    return f"testuser_{uuid.uuid4().hex[:8]}"

def unique_email():
    """Generate a unique email for testing."""
    return f"test_{uuid.uuid4().hex[:8]}@example.com"

class TestUserModel:
    """Test the User model."""
    
    def test_user_creation(self, client):
        """Test creating a new user."""
        with client.application.app_context():
            username = unique_username()
            email = unique_email()
            user = User(
                username=username,
                email=email,
                password_hash='hashed_password'
            )
            db.session.add(user)
            db.session.commit()
            
            assert user.id is not None
            assert user.username == username
            assert user.email == email
            assert user.password_hash == 'hashed_password'
            assert user.created_at is not None
    
    def test_user_repr(self, client):
        """Test user string representation."""
        with client.application.app_context():
            user = User(username='testuser', email='test@example.com', password_hash='hash')
            assert repr(user) == '<User testuser>'
    
    def test_user_to_dict(self, client):
        """Test user to_dict method."""
        with client.application.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                password_hash='hash',
                profile_picture='profile.jpg'
            )
            db.session.add(user)
            db.session.commit()
            
            user_dict = user.to_dict()
            assert user_dict['username'] == 'testuser'
            assert user_dict['email'] == 'test@example.com'
            assert user_dict['profile_picture'] == 'profile.jpg'
            assert 'password_hash' not in user_dict
            assert 'created_at' in user_dict
    
    def test_username_uniqueness(self, client):
        """Test that usernames must be unique."""
        with client.application.app_context():
            user1 = User(username='testuser', email='test1@example.com', password_hash='hash')
            user2 = User(username='testuser', email='test2@example.com', password_hash='hash')
            
            db.session.add(user1)
            db.session.commit()
            
            db.session.add(user2)
            with pytest.raises(Exception):  # Should raise IntegrityError
                db.session.commit()

class TestMembershipModel:
    """Test the Membership model."""
    
    def test_membership_creation(self, client):
        """Test creating a new membership."""
        with client.application.app_context():
            # Create user first
            user = User(username='testuser', email='test@example.com', password_hash='hash')
            db.session.add(user)
            db.session.commit()
            
            membership = Membership(
                user_id=user.id,
                stripe_subscription_id='sub_test123',
                plan_type='monthly',
                status='active',
                current_period_start=datetime.utcnow(),
                current_period_end=datetime.utcnow()
            )
            db.session.add(membership)
            db.session.commit()
            
            assert membership.id is not None
            assert membership.user_id == user.id
            assert membership.plan_type == 'monthly'
            assert membership.status == 'active'
    
    def test_membership_repr(self, client):
        """Test membership string representation."""
        with client.application.app_context():
            membership = Membership(plan_type='monthly', status='active')
            assert repr(membership) == '<Membership monthly - active>'
    
    def test_membership_to_dict(self, client):
        """Test membership to_dict method."""
        with client.application.app_context():
            user = User(username='testuser', email='test@example.com', password_hash='hash')
            db.session.add(user)
            db.session.commit()
            
            membership = Membership(
                user_id=user.id,
                plan_type='monthly',
                status='active'
            )
            db.session.add(membership)
            db.session.commit()
            
            membership_dict = membership.to_dict()
            assert membership_dict['user_id'] == user.id
            assert membership_dict['plan_type'] == 'monthly'
            assert membership_dict['status'] == 'active'
    
    def test_user_membership_relationship(self, client):
        """Test the relationship between User and Membership."""
        with client.application.app_context():
            user = User(username='testuser', email='test@example.com', password_hash='hash')
            db.session.add(user)
            db.session.commit()
            
            membership = Membership(
                user_id=user.id,
                plan_type='monthly',
                status='active'
            )
            db.session.add(membership)
            db.session.commit()
            
            assert len(user.memberships) == 1
            assert user.memberships[0] == membership
            assert membership.user == user

class TestPaymentHistoryModel:
    """Test the PaymentHistory model."""
    
    def test_payment_creation(self, client):
        """Test creating a new payment history record."""
        with client.application.app_context():
            user = User(username='testuser', email='test@example.com', password_hash='hash')
            db.session.add(user)
            db.session.commit()
            
            payment = PaymentHistory(
                user_id=user.id,
                stripe_payment_intent_id='pi_test123',
                amount=2999,  # $29.99 in cents
                currency='usd',
                status='succeeded'
            )
            db.session.add(payment)
            db.session.commit()
            
            assert payment.id is not None
            assert payment.user_id == user.id
            assert payment.amount == 2999
            assert payment.currency == 'usd'
            assert payment.status == 'succeeded'
    
    def test_payment_repr(self, client):
        """Test payment string representation."""
        with client.application.app_context():
            payment = PaymentHistory(amount=2999, currency='usd', status='succeeded')
            assert repr(payment) == '<PaymentHistory 2999 usd - succeeded>'
    
    def test_payment_to_dict(self, client):
        """Test payment to_dict method."""
        with client.application.app_context():
            user = User(username='testuser', email='test@example.com', password_hash='hash')
            db.session.add(user)
            db.session.commit()
            
            payment = PaymentHistory(
                user_id=user.id,
                amount=2999,
                currency='usd',
                status='succeeded'
            )
            db.session.add(payment)
            db.session.commit()
            
            payment_dict = payment.to_dict()
            assert payment_dict['user_id'] == user.id
            assert payment_dict['amount'] == 2999
            assert payment_dict['currency'] == 'usd'
            assert payment_dict['status'] == 'succeeded'
    
    def test_user_payment_relationship(self, client):
        """Test the relationship between User and PaymentHistory."""
        with client.application.app_context():
            user = User(username='testuser', email='test@example.com', password_hash='hash')
            db.session.add(user)
            db.session.commit()
            
            payment = PaymentHistory(
                user_id=user.id,
                amount=2999,
                currency='usd',
                status='succeeded'
            )
            db.session.add(payment)
            db.session.commit()
            
            assert len(user.payment_history) == 1
            assert user.payment_history[0] == payment
            assert payment.user == user 