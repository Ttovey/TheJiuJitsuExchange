from flask import Blueprint, request, jsonify, session
import stripe
import os
from datetime import datetime
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, User, Membership, PaymentHistory
from dotenv import load_dotenv

stripe_bp = Blueprint('stripe', __name__)
load_dotenv()

# Stripe configuration
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY')

# Validate environment variables
if not STRIPE_SECRET_KEY:
    raise ValueError("STRIPE_SECRET_KEY environment variable is not set")
if not STRIPE_PUBLISHABLE_KEY:
    raise ValueError("STRIPE_PUBLISHABLE_KEY environment variable is not set")

stripe.api_key = STRIPE_SECRET_KEY

# Membership plans
MEMBERSHIP_PLANS = {
    'monthly': {
        'name': 'Monthly Membership',
        'price': 17500,  # $175.00 in cents (175 * 100)
        'currency': 'usd',
        'interval': 'month',
        'stripe_price_id': 'price_1Rc9bqDCByDO1M05EKF5yK8c'
    }
}

@stripe_bp.route('/config', methods=['GET'])
def get_stripe_config():
    """Get Stripe publishable key"""
    return jsonify({'publishable_key': STRIPE_PUBLISHABLE_KEY}), 200

@stripe_bp.route('/membership/plans', methods=['GET'])
def get_membership_plans():
    """Get available membership plans"""
    plans = []
    for plan_id, plan_data in MEMBERSHIP_PLANS.items():
        plans.append({
            'id': plan_id,
            'name': plan_data['name'],
            'price': plan_data['price'],
            'currency': plan_data['currency'],
            'interval': plan_data['interval']
        })
    return jsonify({'plans': plans}), 200

@stripe_bp.route('/membership/create-checkout-session', methods=['POST'])
def create_checkout_session():
    """Create Stripe checkout session for membership"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        plan_id = data.get('plan_id')
        
        if plan_id not in MEMBERSHIP_PLANS:
            return jsonify({'error': 'Invalid plan'}), 400
        
        # Get user
        user = db.session.get(User, session['user_id'])
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        stripe_customer_id = user.stripe_customer_id
        
        # Create Stripe customer if doesn't exist
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.username,
                metadata={'user_id': user.id}
            )
            stripe_customer_id = customer.id
            
            # Update user with Stripe customer ID
            user.stripe_customer_id = stripe_customer_id
            db.session.commit()
        
        plan = MEMBERSHIP_PLANS[plan_id]
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': plan['stripe_price_id'],
                'quantity': 1,
            }],
            mode='subscription',
            success_url='http://localhost:3000/membership/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:3000/membership/cancel',
            metadata={
                'user_id': str(user.id),
                'plan_id': plan_id
            }
        )
        
        return jsonify({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in create_checkout_session: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/membership/verify-payment', methods=['POST'])
def verify_payment():
    """Verify payment and create membership if successful"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID required'}), 400
        
        # Retrieve the checkout session from Stripe
        checkout_session = stripe.checkout.Session.retrieve(session_id)
        
        if checkout_session.payment_status == 'paid':
            # Get user from metadata
            user_id = int(checkout_session.metadata['user_id'])
            plan_id = checkout_session.metadata['plan_id']
            subscription_id = checkout_session.subscription
            
            # Check if we already have this membership
            existing_membership = Membership.query.filter_by(
                stripe_subscription_id=subscription_id
            ).first()
            
            if not existing_membership:
                # Get subscription details from Stripe
                subscription = stripe.Subscription.retrieve(subscription_id)
                
                # Create new membership
                new_membership = Membership(
                    user_id=user_id,
                    stripe_subscription_id=subscription_id,
                    plan_type=plan_id,
                    status=subscription['status'],
                    current_period_start=datetime.fromtimestamp(subscription['current_period_start']),
                    current_period_end=datetime.fromtimestamp(subscription['current_period_end'])
                )
                db.session.add(new_membership)
                db.session.commit()
                
                return jsonify({'message': 'Membership created successfully'}), 200
            else:
                return jsonify({'message': 'Membership already exists'}), 200
        else:
            return jsonify({'error': 'Payment not completed'}), 400
            
    except Exception as e:
        db.session.rollback()
        print(f"Error verifying payment: {str(e)}")
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/membership/status', methods=['GET'])
def get_membership_status():
    """Get current user's membership status"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        user_id = session['user_id']
        print(f"Checking membership status for user_id: {user_id}")
        
        # Get all memberships for user (for debugging)
        all_memberships = Membership.query.filter_by(user_id=user_id).all()
        print(f"Found {len(all_memberships)} total memberships for user")
        
        for m in all_memberships:
            print(f"Membership ID: {m.id}, Status: {m.status}, Plan: {m.plan_type}")
        
        # Get active membership for user
        membership = Membership.query.filter_by(
            user_id=user_id,
            status='active'
        ).order_by(Membership.created_at.desc()).first()
        
        if membership:
            print(f"Found active membership: {membership.id}")
            return jsonify({
                'has_membership': True,
                'plan_type': membership.plan_type,
                'status': membership.status,
                'current_period_end': membership.current_period_end.isoformat() if membership.current_period_end else None
            }), 200
        else:
            print("No active membership found")
            return jsonify({'has_membership': False}), 200
            
    except Exception as e:
        print(f"Error in get_membership_status: {str(e)}")
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/create-payment-intent', methods=['POST'])
def create_payment_intent():
    """Create a payment intent for one-time payments"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        amount = data.get('amount')
        
        if not amount or amount <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
        
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            metadata={'user_id': str(session['user_id'])}
        )
        
        return jsonify({
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/create-subscription', methods=['POST'])
def create_subscription():
    """Create a subscription"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        price_id = data.get('price_id')
        plan_type = data.get('plan_type')
        
        if not price_id or not plan_type:
            return jsonify({'error': 'Missing required fields'}), 400
        
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create Stripe customer if doesn't exist
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.username,
                metadata={'user_id': user.id}
            )
            user.stripe_customer_id = customer.id
            db.session.commit()
        
        # Create subscription
        subscription = stripe.Subscription.create(
            customer=user.stripe_customer_id,
            items=[{'price': price_id}],
            metadata={'user_id': str(user.id), 'plan_type': plan_type}
        )
        
        # Create membership record
        membership = Membership(
            user_id=user.id,
            stripe_subscription_id=subscription.id,
            plan_type=plan_type,
            status=subscription.status
        )
        db.session.add(membership)
        db.session.commit()
        
        return jsonify({
            'subscription_id': subscription.id,
            'status': subscription.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/subscriptions', methods=['GET'])
def get_user_subscriptions():
    """Get user's subscriptions"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        user_id = session['user_id']
        memberships = Membership.query.filter_by(user_id=user_id).all()
        
        subscriptions = []
        for membership in memberships:
            subscriptions.append({
                'id': membership.id,
                'stripe_subscription_id': membership.stripe_subscription_id,
                'plan_type': membership.plan_type,
                'status': membership.status,
                'created_at': membership.created_at.isoformat() if membership.created_at else None
            })
        
        return jsonify({'subscriptions': subscriptions}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/cancel-subscription/<subscription_id>', methods=['POST'])
def cancel_subscription(subscription_id):
    """Cancel a subscription"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        user_id = session['user_id']
        
        # Find the membership
        membership = Membership.query.filter_by(
            stripe_subscription_id=subscription_id,
            user_id=user_id
        ).first()
        
        if not membership:
            return jsonify({'error': 'Subscription not found'}), 404
        
        # Cancel in Stripe
        stripe.Subscription.cancel(subscription_id)
        
        # Update local record
        membership.status = 'canceled'
        db.session.commit()
        
        return jsonify({'message': 'Subscription canceled successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/payment-history', methods=['GET'])
def get_payment_history():
    """Get user's payment history"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        user_id = session['user_id']
        payments = PaymentHistory.query.filter_by(user_id=user_id).order_by(
            PaymentHistory.created_at.desc()
        ).all()
        
        payment_list = []
        for payment in payments:
            payment_list.append({
                'id': payment.id,
                'stripe_payment_intent_id': payment.stripe_payment_intent_id,
                'amount': payment.amount,
                'currency': payment.currency,
                'status': payment.status,
                'created_at': payment.created_at.isoformat() if payment.created_at else None
            })
        
        return jsonify({'payments': payment_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@stripe_bp.route('/membership/cancel', methods=['POST'])
def cancel_membership():
    """Cancel current membership"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        # Get active membership for user
        membership = Membership.query.filter_by(
            user_id=session['user_id'],
            status='active'
        ).order_by(Membership.created_at.desc()).first()
        
        if not membership:
            return jsonify({'error': 'No active membership found'}), 404
        
        # Cancel subscription in Stripe
        stripe.Subscription.modify(
            membership.stripe_subscription_id,
            cancel_at_period_end=True
        )
        
        # Update membership status
        membership.status = 'cancelled'
        membership.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Membership cancelled successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks"""
    # For production, use signature verification
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    if sig_header and endpoint_secret:
        # Production webhook handling with signature verification
        payload = request.get_data(as_text=True)
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError:
            return jsonify({'error': 'Invalid payload'}), 400
        except stripe.error.SignatureVerificationError:
            return jsonify({'error': 'Invalid signature'}), 400
    else:
        # Development/testing - accept raw JSON
        try:
            event = request.get_json()
        except Exception:
            return jsonify({'error': 'Invalid JSON'}), 400
    
    # Handle the event
    event_type = event.get('type')
    
    if event_type == 'checkout.session.completed':
        session_data = event['data']['object']
        handle_successful_payment(session_data)
    elif event_type == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        handle_successful_payment_renewal(invoice)
    elif event_type == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_cancelled(subscription)
    elif event_type == 'payment_intent.succeeded':
        # Handle payment intent success for tests
        payment_data = event['data']['object']
        user_id = payment_data.get('metadata', {}).get('user_id')
        if user_id:
            payment = PaymentHistory(
                user_id=int(user_id),
                stripe_payment_intent_id=payment_data['id'],
                amount=payment_data['amount'],
                currency=payment_data['currency'],
                status=payment_data['status']
            )
            db.session.add(payment)
            db.session.commit()
    
    return jsonify({'status': 'success'}), 200

def handle_successful_payment(session_data):
    """Handle successful payment from Stripe"""
    try:
        user_id = int(session_data['metadata']['user_id'])
        plan_id = session_data['metadata']['plan_id']
        subscription_id = session_data['subscription']
        
        # Get subscription details from Stripe
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Check if membership already exists
        existing_membership = Membership.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()
        
        if existing_membership:
            # Update existing membership
            existing_membership.status = subscription['status']
            existing_membership.current_period_start = datetime.fromtimestamp(subscription['current_period_start'])
            existing_membership.current_period_end = datetime.fromtimestamp(subscription['current_period_end'])
            existing_membership.updated_at = datetime.utcnow()
        else:
            # Create new membership
            new_membership = Membership(
                user_id=user_id,
                stripe_subscription_id=subscription_id,
                plan_type=plan_id,
                status=subscription['status'],
                current_period_start=datetime.fromtimestamp(subscription['current_period_start']),
                current_period_end=datetime.fromtimestamp(subscription['current_period_end'])
            )
            db.session.add(new_membership)
        
        db.session.commit()
        
    except Exception as e:
        db.session.rollback()
        print(f"Error handling successful payment: {e}")

def handle_successful_payment_renewal(invoice):
    """Handle successful payment renewal"""
    try:
        subscription_id = invoice['subscription']
        
        # Get subscription details
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Find and update membership
        membership = Membership.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()
        
        if membership:
            membership.current_period_start = datetime.fromtimestamp(subscription['current_period_start'])
            membership.current_period_end = datetime.fromtimestamp(subscription['current_period_end'])
            membership.status = subscription['status']
            membership.updated_at = datetime.utcnow()
            db.session.commit()
        
    except Exception as e:
        db.session.rollback()
        print(f"Error handling payment renewal: {e}")

def handle_subscription_cancelled(subscription):
    """Handle subscription cancellation"""
    try:
        subscription_id = subscription['id']
        
        # Find and update membership
        membership = Membership.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()
        
        if membership:
            membership.status = 'cancelled'
            membership.updated_at = datetime.utcnow()
            db.session.commit()
        
    except Exception as e:
        db.session.rollback()
        print(f"Error handling subscription cancellation: {e}") 