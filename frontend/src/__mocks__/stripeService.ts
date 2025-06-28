export const stripeService = {
  getMembershipStatus: jest.fn(),
  getMembershipPlans: jest.fn(),
  createCheckoutSession: jest.fn(),
  getStripeConfig: jest.fn(),
  cancelMembership: jest.fn(),
  verifyPayment: jest.fn(),
}; 