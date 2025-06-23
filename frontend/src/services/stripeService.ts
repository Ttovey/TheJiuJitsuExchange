import { 
  StripeConfig, 
  MembershipPlansResponse, 
  MembershipStatus, 
  CheckoutSessionResponse 
} from '../types';

const API_BASE = '/api';

export const stripeService = {
  // Get Stripe configuration (publishable key)
  async getStripeConfig(): Promise<StripeConfig> {
    const response = await fetch(`${API_BASE}/stripe/config`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to get Stripe configuration');
    }
    
    return response.json();
  },

  // Get available membership plans
  async getMembershipPlans(): Promise<MembershipPlansResponse> {
    const response = await fetch(`${API_BASE}/stripe/membership/plans`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to get membership plans');
    }
    
    return response.json();
  },

  // Get current membership status
  async getMembershipStatus(): Promise<MembershipStatus> {
    const response = await fetch(`${API_BASE}/stripe/membership/status`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to get membership status');
    }
    
    return response.json();
  },

  // Create checkout session for membership
  async createCheckoutSession(planId: string): Promise<CheckoutSessionResponse> {
    const response = await fetch(`${API_BASE}/stripe/membership/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ plan_id: planId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }
    
    return response.json();
  },

  // Cancel membership
  async cancelMembership(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/stripe/membership/cancel`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel membership');
    }
    
    return response.json();
  },

  // Verify payment and create membership
  async verifyPayment(sessionId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/stripe/membership/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ session_id: sessionId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify payment');
    }
    
    return response.json();
  },
}; 