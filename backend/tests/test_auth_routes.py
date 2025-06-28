import pytest
import json
from unittest.mock import patch
from models import db, User
from test_config import client, auth_client, sample_user

class TestAuthRoutes:
    """Test authentication routes."""
    
    def test_register_success(self, client, sample_user):
        """Test successful user registration."""
        response = client.post('/api/register', 
                             data=json.dumps(sample_user),
                             content_type='application/json')
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'User registered successfully'
        assert 'user' in data
        assert data['user']['username'] == sample_user['username']
        assert data['user']['email'] == sample_user['email']
        assert 'password_hash' not in data['user']  # Should not return password
        
        # Verify user was created in database
        with client.application.app_context():
            user = User.query.filter_by(username=sample_user['username']).first()
            assert user is not None
    
    def test_register_missing_fields(self, client):
        """Test registration with missing fields."""
        incomplete_data = {'username': 'testuser'}
        
        response = client.post('/api/register',
                             data=json.dumps(incomplete_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email format."""
        invalid_data = {
            'username': 'testuser',
            'email': 'invalid-email',
            'password': 'testpassword123'
        }
        
        response = client.post('/api/register',
                             data=json.dumps(invalid_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_register_duplicate_username(self, client, sample_user):
        """Test registration with duplicate username."""
        # Create first user
        client.post('/api/register',
                   data=json.dumps(sample_user),
                   content_type='application/json')

        # Try to create second user with same username
        duplicate_user = sample_user.copy()
        duplicate_user['email'] = 'different@example.com'

        response = client.post('/api/register',
                             data=json.dumps(duplicate_user),
                             content_type='application/json')

        assert response.status_code == 409
        data = json.loads(response.data)
        assert 'already exists' in data['error']
    
    def test_register_duplicate_email(self, client, sample_user):
        """Test registration with duplicate email."""
        # Create first user
        client.post('/api/register',
                   data=json.dumps(sample_user),
                   content_type='application/json')

        # Try to create second user with same email
        duplicate_user = sample_user.copy()
        duplicate_user['username'] = 'differentuser'

        response = client.post('/api/register',
                             data=json.dumps(duplicate_user),
                             content_type='application/json')

        assert response.status_code == 409
        data = json.loads(response.data)
        assert 'already exists' in data['error']
    
    @patch('routes.auth.check_password_hash')
    def test_login_success(self, mock_check_password, client, sample_user):
        """Test successful login."""
        # Register user first
        client.post('/api/register',
                   data=json.dumps(sample_user),
                   content_type='application/json')
        
        # Mock password verification to return True
        mock_check_password.return_value = True
        
        login_data = {
            'username': sample_user['username'],
            'password': sample_user['password']
        }
        
        response = client.post('/api/login',
                             data=json.dumps(login_data),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Login successful'
        assert 'user' in data
        
        # Check session
        with client.session_transaction() as sess:
            assert 'user_id' in sess
    
    @patch('routes.auth.check_password_hash')
    def test_login_invalid_credentials(self, mock_check_password, client, sample_user):
        """Test login with invalid credentials."""
        # Register user first
        client.post('/api/register',
                   data=json.dumps(sample_user),
                   content_type='application/json')
        
        # Mock password verification to return False
        mock_check_password.return_value = False
        
        login_data = {
            'username': sample_user['username'],
            'password': 'wrongpassword'
        }
        
        response = client.post('/api/login',
                             data=json.dumps(login_data),
                             content_type='application/json')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'Invalid username or password' in data['error']
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user."""
        login_data = {
            'username': 'nonexistent',
            'password': 'password'
        }
        
        response = client.post('/api/login',
                             data=json.dumps(login_data),
                             content_type='application/json')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'Invalid username or password' in data['error']
    
    def test_login_missing_fields(self, client):
        """Test login with missing fields."""
        incomplete_data = {'username': 'testuser'}
        
        response = client.post('/api/login',
                             data=json.dumps(incomplete_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_logout_success(self, auth_client):
        """Test successful logout."""
        response = auth_client.post('/api/logout')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Logged out successfully'
        
        # Check session is cleared
        with auth_client.session_transaction() as sess:
            assert 'user_id' not in sess
    
    def test_logout_not_logged_in(self, client):
        """Test logout when not logged in."""
        response = client.post('/api/logout')
        
        # Should still return success (logout is idempotent)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Logged out successfully'
    
    def test_check_auth_authenticated(self, auth_client):
        """Test check auth endpoint when authenticated."""
        response = auth_client.get('/api/check')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['authenticated'] is True
        assert 'user' in data
        # Use startswith since usernames are now unique with UUID suffix
        assert data['user']['username'].startswith('testuser')
    
    def test_check_auth_not_authenticated(self, client):
        """Test check auth endpoint when not authenticated."""
        response = client.get('/api/check')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['authenticated'] is False
        assert 'user' not in data
    
    def test_get_user_profile_authenticated(self, auth_client):
        """Test getting user profile when authenticated."""
        response = auth_client.get('/api/user')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'user' in data
        # Use startswith since usernames are now unique with UUID suffix
        assert data['user']['username'].startswith('testuser')
        assert data['user']['email'].startswith('test')
    
    def test_get_user_profile_not_authenticated(self, client):
        """Test getting user profile when not authenticated."""
        response = client.get('/api/user')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
        assert 'not authenticated' in data['error'].lower()
    
    def test_update_profile_success(self, auth_client):
        """Test successful profile update."""
        update_data = {
            'email': 'updated@example.com',
            'profile_picture': 'new_picture.jpg'
        }
        
        response = auth_client.put('/api/user',
                                 data=json.dumps(update_data),
                                 content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Profile updated successfully'
        assert data['user']['email'] == 'updated@example.com'
        assert data['user']['profile_picture'] == 'new_picture.jpg'
    
    def test_update_profile_not_authenticated(self, client):
        """Test profile update when not authenticated."""
        update_data = {'email': 'updated@example.com'}
        
        response = client.put('/api/user',
                            data=json.dumps(update_data),
                            content_type='application/json')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data 