export interface User {
  id: number;
  username: string;
  email: string;
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