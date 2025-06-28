import pytest
import json
from unittest.mock import patch, MagicMock
from models import db, User, Membership, PaymentHistory
from test_config import client, auth_client

class TestStripeRoutes:
    """Test Stripe payment routes."""
    
    @patch('routes.stripe.stripe.PaymentIntent.create')
    def test_create_payment_intent_success(self, mock_payment_intent, auth_client):
        """Test successful payment intent creation."""
        # Mock Stripe response
        mock_intent = MagicMock()
        mock_intent.client_secret = 'pi_test_client_secret'
        mock_intent.id = 'pi_test123'
        mock_payment_intent.return_value = mock_intent
        
        payment_data = {
            'amount': 2999,
            'currency': 'usd'
        }
        
        response = auth_client.post('/api/stripe/create-payment-intent',
                                   data=json.dumps(payment_data),
                                   content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'client_secret' in data
        assert data['client_secret'] == 'pi_test_client_secret'
        
        # Verify Stripe was called with correct parameters
        mock_payment_intent.assert_called_once_with(
            amount=2999,
            currency='usd',
            metadata={'user_id': '1'}
        )
    
    @patch('routes.stripe.stripe.PaymentIntent.create')
    def test_create_payment_intent_stripe_error(self, mock_payment_intent, auth_client):
        """Test payment intent creation with Stripe error."""
        # Mock Stripe error
        mock_payment_intent.side_effect = Exception("Stripe error")
        
        payment_data = {
            'amount': 2999,
            'currency': 'usd'
        }
        
        response = auth_client.post('/api/stripe/create-payment-intent',
                                   data=json.dumps(payment_data),
                                   content_type='application/json')
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_create_payment_intent_not_authenticated(self, client):
        """Test payment intent creation when not authenticated."""
        payment_data = {
            'amount': 2999,
            'currency': 'usd'
        }
        
        response = client.post('/api/stripe/create-payment-intent',
                              data=json.dumps(payment_data),
                              content_type='application/json')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_create_payment_intent_missing_amount(self, auth_client):
        """Test payment intent creation with missing amount."""
        payment_data = {'currency': 'usd'}
        
        response = auth_client.post('/api/stripe/create-payment-intent',
                                   data=json.dumps(payment_data),
                                   content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    @patch('routes.stripe.stripe.Subscription.create')
    @patch('routes.stripe.stripe.Customer.create')
    def test_create_subscription_success(self, mock_customer, mock_subscription, auth_client):
        """Test successful subscription creation."""
        # Mock Stripe responses
        mock_customer_obj = MagicMock()
        mock_customer_obj.id = 'cus_test123'
        mock_customer.return_value = mock_customer_obj
        
        mock_subscription_obj = MagicMock()
        mock_subscription_obj.id = 'sub_test123'
        mock_subscription_obj.status = 'active'
        mock_subscription_obj.current_period_start = 1640995200
        mock_subscription_obj.current_period_end = 1643673600
        mock_subscription.return_value = mock_subscription_obj
        
        subscription_data = {
            'price_id': 'price_monthly',
            'plan_type': 'monthly'
        }
        
        response = auth_client.post('/api/stripe/create-subscription',
                                   data=json.dumps(subscription_data),
                                   content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'subscription_id' in data
        assert data['subscription_id'] == 'sub_test123'
        
        # Verify membership was created in database
        with auth_client.application.app_context():
            membership = Membership.query.filter_by(stripe_subscription_id='sub_test123').first()
            assert membership is not None
            assert membership.plan_type == 'monthly'
            assert membership.status == 'active'
    
    @patch('routes.stripe.stripe.Subscription.create')
    @patch('routes.stripe.stripe.Customer.create')
    def test_create_subscription_stripe_error(self, mock_customer, mock_subscription, auth_client):
        """Test subscription creation with Stripe error."""
        mock_customer_obj = MagicMock()
        mock_customer_obj.id = 'cus_test123'
        mock_customer.return_value = mock_customer_obj
        
        # Mock Stripe error
        mock_subscription.side_effect = Exception("Stripe error")
        
        subscription_data = {
            'price_id': 'price_monthly',
            'plan_type': 'monthly'
        }
        
        response = auth_client.post('/api/stripe/create-subscription',
                                   data=json.dumps(subscription_data),
                                   content_type='application/json')
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_create_subscription_not_authenticated(self, client):
        """Test subscription creation when not authenticated."""
        subscription_data = {
            'price_id': 'price_monthly',
            'plan_type': 'monthly'
        }
        
        response = client.post('/api/stripe/create-subscription',
                              data=json.dumps(subscription_data),
                              content_type='application/json')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_get_user_subscriptions_success(self, auth_client):
        """Test getting user subscriptions."""
        # Create a membership for the user
        with auth_client.application.app_context():
            # Get the user from the test fixture (we know it's the first user)
            user = User.query.first()
            membership = Membership(
                user_id=user.id,
                stripe_subscription_id='sub_test123',
                plan_type='monthly',
                status='active'
            )
            db.session.add(membership)
            db.session.commit()
        
        response = auth_client.get('/api/stripe/subscriptions')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'subscriptions' in data
        assert len(data['subscriptions']) == 1
        assert data['subscriptions'][0]['plan_type'] == 'monthly'
        assert data['subscriptions'][0]['status'] == 'active'
    
    def test_get_user_subscriptions_not_authenticated(self, client):
        """Test getting subscriptions when not authenticated."""
        response = client.get('/api/stripe/subscriptions')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
    
    @patch('routes.stripe.stripe.Subscription.cancel')
    def test_cancel_subscription_success(self, mock_cancel, auth_client):
        """Test successful subscription cancellation."""
        # Create a membership for the user
        with auth_client.application.app_context():
            # Get the user from the test fixture (we know it's the first user)
            user = User.query.first()
            membership = Membership(
                user_id=user.id,
                stripe_subscription_id='sub_test123',
                plan_type='monthly',
                status='active'
            )
            db.session.add(membership)
            db.session.commit()
        
        # Mock Stripe response
        mock_subscription = MagicMock()
        mock_subscription.status = 'canceled'
        mock_cancel.return_value = mock_subscription
        
        response = auth_client.post('/api/stripe/cancel-subscription/sub_test123')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Subscription canceled successfully'
        
        # Verify membership status was updated
        with auth_client.application.app_context():
            membership = Membership.query.filter_by(stripe_subscription_id='sub_test123').first()
            assert membership.status == 'canceled'
    
    @patch('routes.stripe.stripe.Subscription.cancel')
    def test_cancel_subscription_not_found(self, mock_cancel, auth_client):
        """Test canceling a subscription that doesn't exist."""
        response = auth_client.post('/api/stripe/cancel-subscription/sub_nonexistent')
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'not found' in data['error']
    
    def test_cancel_subscription_not_authenticated(self, client):
        """Test canceling subscription when not authenticated."""
        response = client.post('/api/stripe/cancel-subscription/sub_test123')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_get_payment_history_success(self, auth_client):
        """Test getting user payment history."""
        # Create payment history for the user
        with auth_client.application.app_context():
            # Get the user from the test fixture (we know it's the first user)
            user = User.query.first()
            payment = PaymentHistory(
                user_id=user.id,
                stripe_payment_intent_id='pi_test123',
                amount=2999,
                currency='usd',
                status='succeeded'
            )
            db.session.add(payment)
            db.session.commit()
        
        response = auth_client.get('/api/stripe/payment-history')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'payments' in data
        assert len(data['payments']) == 1
        assert data['payments'][0]['amount'] == 2999
        assert data['payments'][0]['status'] == 'succeeded'
    
    def test_get_payment_history_not_authenticated(self, client):
        """Test getting payment history when not authenticated."""
        response = client.get('/api/stripe/payment-history')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
    
    @patch('routes.stripe.stripe.Event.construct_from')
    def test_webhook_payment_succeeded(self, mock_event, client):
        """Test webhook handling for successful payment."""
        # Mock webhook event
        mock_event_obj = MagicMock()
        mock_event_obj.type = 'payment_intent.succeeded'
        mock_event_obj.data.object.id = 'pi_test123'
        mock_event_obj.data.object.amount = 2999
        mock_event_obj.data.object.currency = 'usd'
        mock_event_obj.data.object.status = 'succeeded'
        mock_event.return_value = mock_event_obj
        
        # Create a user to associate with payment
        with client.application.app_context():
            import uuid
            unique_id = uuid.uuid4().hex[:8]
            user = User(
                username=f'testuser_{unique_id}',
                email=f'test_{unique_id}@example.com',
                password_hash='hash'
            )
            db.session.add(user)
            db.session.commit()
            user_id = user.id
        
        webhook_data = {
            'type': 'payment_intent.succeeded',
            'data': {
                'object': {
                    'id': 'pi_test123',
                    'amount': 2999,
                    'currency': 'usd',
                    'status': 'succeeded',
                    'metadata': {'user_id': str(user_id)}
                }
            }
        }
        
        response = client.post('/api/stripe/webhook',
                              data=json.dumps(webhook_data),
                              content_type='application/json')
        
        assert response.status_code == 200
        
        # Verify payment history was created
        with client.application.app_context():
            payment = PaymentHistory.query.filter_by(stripe_payment_intent_id='pi_test123').first()
            assert payment is not None
            assert payment.amount == 2999
            assert payment.status == 'succeeded'
    
    def test_webhook_unsupported_event(self, client):
        """Test webhook handling for unsupported event type."""
        webhook_data = {
            'type': 'unsupported.event',
            'data': {'object': {}}
        }
        
        response = client.post('/api/stripe/webhook',
                              data=json.dumps(webhook_data),
                              content_type='application/json')
        
        assert response.status_code == 200  # Should still return 200 for unsupported events 