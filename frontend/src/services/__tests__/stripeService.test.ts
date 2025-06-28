import { stripeService } from '../stripeService';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('stripeService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('createCheckoutSession', () => {
    test('creates checkout session successfully', async () => {
      const mockResponse = {
        checkout_url: 'https://checkout.stripe.com/pay/cs_test_123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await stripeService.createCheckoutSession('price_monthly');

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/membership/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ plan_id: 'price_monthly' }),
      });

      expect(result).toEqual(mockResponse);
    });

    test('handles API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid price ID' }),
      });

      await expect(stripeService.createCheckoutSession('invalid_price'))
        .rejects.toThrow('Invalid price ID');
    });

    test('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(stripeService.createCheckoutSession('price_monthly'))
        .rejects.toThrow('Network error');
    });
  });

  describe('getMembershipStatus', () => {
    test('gets membership status successfully', async () => {
      const mockStatus = {
        has_membership: true,
        subscription_status: 'active',
        current_period_end: '2024-01-01T00:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await stripeService.getMembershipStatus();

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/membership/status', {
        credentials: 'include',
      });

      expect(result).toEqual(mockStatus);
    });

    test('handles no membership status', async () => {
      const mockStatus = {
        has_membership: false,
        subscription_status: null,
        current_period_end: null
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await stripeService.getMembershipStatus();
      expect(result.has_membership).toBe(false);
    });

    test('handles API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(stripeService.getMembershipStatus())
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('getMembershipPlans', () => {
    test('gets membership plans successfully', async () => {
      const mockPlans = {
        plans: [
          {
            id: 'price_monthly',
            name: 'Monthly Membership',
            price: 2999,
            currency: 'usd',
            interval: 'month'
          },
          {
            id: 'price_annual',
            name: 'Annual Membership',
            price: 29999,
            currency: 'usd',
            interval: 'year'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlans,
      });

      const result = await stripeService.getMembershipPlans();

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/membership/plans', {
        credentials: 'include',
      });

      expect(result).toEqual(mockPlans);
      expect(result.plans).toHaveLength(2);
      expect(result.plans[0].name).toBe('Monthly Membership');
    });

    test('handles empty plans list', async () => {
      const mockPlans = { plans: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlans,
      });

      const result = await stripeService.getMembershipPlans();
      expect(result.plans).toHaveLength(0);
    });

    test('handles API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Service unavailable' }),
      });

      await expect(stripeService.getMembershipPlans())
        .rejects.toThrow('Service unavailable');
    });
  });

  describe('getStripeConfig', () => {
    test('gets Stripe configuration successfully', async () => {
      const mockConfig = {
        publishable_key: 'pk_test_123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const result = await stripeService.getStripeConfig();

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/config', {
        credentials: 'include',
      });

      expect(result).toEqual(mockConfig);
    });

    test('handles API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Configuration not found' }),
      });

      await expect(stripeService.getStripeConfig())
        .rejects.toThrow('Configuration not found');
    });
  });

  describe('cancelMembership', () => {
    test('cancels membership successfully', async () => {
      const mockResponse = {
        message: 'Membership canceled successfully'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await stripeService.cancelMembership();

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/membership/cancel', {
        method: 'POST',
        credentials: 'include',
      });

      expect(result).toEqual(mockResponse);
    });

    test('handles cancellation error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'No active membership found' }),
      });

      await expect(stripeService.cancelMembership())
        .rejects.toThrow('No active membership found');
    });

    test('handles network error during cancellation', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(stripeService.cancelMembership())
        .rejects.toThrow('Network timeout');
    });
  });

  describe('verifyPayment', () => {
    test('verifies payment successfully', async () => {
      const mockResponse = {
        message: 'Payment verified and membership created'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await stripeService.verifyPayment('cs_test_123');

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/membership/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ session_id: 'cs_test_123' }),
      });

      expect(result).toEqual(mockResponse);
    });

    test('handles invalid session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid session ID' }),
      });

      await expect(stripeService.verifyPayment('invalid_session'))
        .rejects.toThrow('Invalid session ID');
    });

    test('handles network error during verification', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(stripeService.verifyPayment('cs_test_123'))
        .rejects.toThrow('Network error');
    });
  });

  describe('error handling', () => {
    test('handles response without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(stripeService.getMembershipStatus())
        .rejects.toThrow('Request failed');
    });

    test('handles non-JSON response error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(stripeService.getMembershipStatus())
        .rejects.toThrow('Request failed');
    });

    test('handles fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(stripeService.getMembershipStatus())
        .rejects.toThrow('Failed to fetch');
    });
  });
}); 