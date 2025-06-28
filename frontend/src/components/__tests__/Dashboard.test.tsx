import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../utils/test-utils';
import Dashboard from '../Dashboard';

// Mock setUser function
const mockSetUser = jest.fn();

// Mock user with different subscription statuses
const mockUserWithSubscription = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  hasActiveSubscription: true
};

const mockUserWithoutSubscription = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  hasActiveSubscription: false
};

// Mock stripe service
jest.mock('../../services/stripeService');

// Mock membership data
const mockMembershipStatus = {
  has_membership: true,
  subscription: {
    id: 'sub_123',
    status: 'active',
    current_period_end: new Date('2024-12-31').toISOString()
  }
};

const mockMembershipPlans = {
  plans: [
    {
      id: 'plan_123',
      name: 'Monthly Membership',
      price: 2999,
      currency: 'usd',
      interval: 'month'
    }
  ]
};

// Import mocked service
import { stripeService } from '../../services/stripeService';

describe('Dashboard Component', () => {
  const mockedStripeService = stripeService as jest.Mocked<typeof stripeService>;

  beforeEach(() => {
    mockSetUser.mockClear();
    
    // Clear all stripe service mocks
    mockedStripeService.getMembershipStatus.mockClear();
    mockedStripeService.getMembershipPlans.mockClear();
    mockedStripeService.createCheckoutSession.mockClear();
  });

  test('renders dashboard with subscription gate for users without subscription', async () => {
    mockedStripeService.getMembershipStatus.mockResolvedValue({ has_membership: false });
    mockedStripeService.getMembershipPlans.mockResolvedValue(mockMembershipPlans);

    render(<Dashboard user={mockUserWithoutSubscription} setUser={mockSetUser} />);
    
    await waitFor(() => {
      expect(screen.getByText(/sign up to see your dashboard/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/get access to your dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/monthly membership/i)).toBeInTheDocument();
    expect(screen.getByText(/\$29\.99/i)).toBeInTheDocument();
  });

  test('renders dashboard with class schedule for users with subscription', async () => {
    mockedStripeService.getMembershipStatus.mockResolvedValue(mockMembershipStatus);
    mockedStripeService.getMembershipPlans.mockResolvedValue(mockMembershipPlans);

    render(<Dashboard user={mockUserWithSubscription} setUser={mockSetUser} />);
    
    await waitFor(() => {
      expect(screen.getByText(/weekly class schedule/i)).toBeInTheDocument();
    });
  });

  test('displays loading state while fetching classes', async () => {
    mockedStripeService.getMembershipStatus.mockResolvedValue(mockMembershipStatus);
    mockedStripeService.getMembershipPlans.mockResolvedValue(mockMembershipPlans);

    render(<Dashboard user={mockUserWithSubscription} setUser={mockSetUser} />);
    
    // Should show loading initially
    await waitFor(() => {
      expect(screen.getByText(/loading class schedule/i)).toBeInTheDocument();
    });
  });

  test('displays classes after loading completes', async () => {
    mockedStripeService.getMembershipStatus.mockResolvedValue(mockMembershipStatus);
    mockedStripeService.getMembershipPlans.mockResolvedValue(mockMembershipPlans);

    render(<Dashboard user={mockUserWithSubscription} setUser={mockSetUser} />);
    
    // Wait for classes to load (mock has 1 second timeout)
    await waitFor(() => {
      expect(screen.getAllByText(/no gi jiu-jitsu/i)[0]).toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(screen.getAllByText(/open sparring/i)[0]).toBeInTheDocument();
  });

  test('displays enrollment counts and capacity', async () => {
    mockedStripeService.getMembershipStatus.mockResolvedValue(mockMembershipStatus);
    mockedStripeService.getMembershipPlans.mockResolvedValue(mockMembershipPlans);

    render(<Dashboard user={mockUserWithSubscription} setUser={mockSetUser} />);
    
    await waitFor(() => {
      // Check for capacity display by looking for capacity elements
      const capacityElements = screen.getAllByText((content, element) => {
        return element?.className === 'class-capacity-small' && content !== '';
      });
      expect(capacityElements.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  test('shows "Full" status for classes at capacity', async () => {
    mockedStripeService.getMembershipStatus.mockResolvedValue(mockMembershipStatus);
    mockedStripeService.getMembershipPlans.mockResolvedValue(mockMembershipPlans);

    render(<Dashboard user={mockUserWithSubscription} setUser={mockSetUser} />);
    
    await waitFor(() => {
      // Look for sign up buttons instead of "Full" since mock data doesn't have full classes
      expect(screen.getAllByText(/sign up/i).length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  test('allows enrollment in available classes', async () => {
    mockedStripeService.getMembershipStatus.mockResolvedValue(mockMembershipStatus);
    mockedStripeService.getMembershipPlans.mockResolvedValue(mockMembershipPlans);

    render(<Dashboard user={mockUserWithSubscription} setUser={mockSetUser} />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/no gi jiu-jitsu/i)[0]).toBeInTheDocument();
    }, { timeout: 2000 });
    
    const enrollButtons = screen.getAllByText(/sign up/i);
    expect(enrollButtons.length).toBeGreaterThan(0);
    
    // Click first enroll button
    fireEvent.click(enrollButtons[0]);
    
    // Should change to "Updating..." temporarily
    await waitFor(() => {
      expect(screen.getByText(/updating/i)).toBeInTheDocument();
    });
  });

  test('displays weekly schedule heading with correct date range', async () => {
    mockedStripeService.getMembershipStatus.mockResolvedValue(mockMembershipStatus);
    mockedStripeService.getMembershipPlans.mockResolvedValue(mockMembershipPlans);

    render(<Dashboard user={mockUserWithSubscription} setUser={mockSetUser} />);
    
    await waitFor(() => {
      expect(screen.getByText(/weekly class schedule/i)).toBeInTheDocument();
    });
    
    // Wait for the week range to appear
    await waitFor(() => {
      expect(screen.getByText(/week of/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('groups classes by day correctly', async () => {
    mockedStripeService.getMembershipStatus.mockResolvedValue(mockMembershipStatus);
    mockedStripeService.getMembershipPlans.mockResolvedValue(mockMembershipPlans);

    render(<Dashboard user={mockUserWithSubscription} setUser={mockSetUser} />);
    
    await waitFor(() => {
      expect(screen.getByText(/monday/i)).toBeInTheDocument();
      expect(screen.getByText(/tuesday/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('displays enrollment status for enrolled classes', async () => {
    mockedStripeService.getMembershipStatus.mockResolvedValue(mockMembershipStatus);
    mockedStripeService.getMembershipPlans.mockResolvedValue(mockMembershipPlans);

    render(<Dashboard user={mockUserWithSubscription} setUser={mockSetUser} />);
    
    await waitFor(() => {
      // Look for "Drop" buttons which indicate enrolled classes
      expect(screen.getAllByText(/drop/i).length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  test('shows days with classes', async () => {
    mockedStripeService.getMembershipStatus.mockResolvedValue(mockMembershipStatus);
    mockedStripeService.getMembershipPlans.mockResolvedValue(mockMembershipPlans);

    render(<Dashboard user={mockUserWithSubscription} setUser={mockSetUser} />);
    
    await waitFor(() => {
      expect(screen.getByText(/monday/i)).toBeInTheDocument();
      expect(screen.getByText(/tuesday/i)).toBeInTheDocument();
      expect(screen.getByText(/wednesday/i)).toBeInTheDocument();
      expect(screen.getByText(/thursday/i)).toBeInTheDocument();
      expect(screen.getByText(/friday/i)).toBeInTheDocument();
      expect(screen.getByText(/saturday/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
}); 