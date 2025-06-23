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
        user = User.query.get(session['user_id'])
        
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
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    if not endpoint_secret:
        return jsonify({'error': 'Webhook secret not configured'}), 500
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session_data = event['data']['object']
        handle_successful_payment(session_data)
    elif event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        handle_successful_payment_renewal(invoice)
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_cancelled(subscription)
    
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