export interface User {
  id: number;
  username: string;
  email: string;
  profile_picture?: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface ErrorResponse {
  error: string;
}

export interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

// Stripe-related types
export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
}

export interface MembershipStatus {
  has_membership: boolean;
  plan_type?: string;
  status?: string;
  current_period_end?: string;
}

export interface StripeConfig {
  publishable_key: string;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
}

export interface MembershipPlansResponse {
  plans: MembershipPlan[];
} 