import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LoginFormData, AuthResponse, ErrorResponse } from '../types';

interface LoginProps {
  setUser: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data: AuthResponse | ErrorResponse = await response.json();

      if (response.ok) {
        const authData = data as AuthResponse;
        setUser(authData.user);
        navigate('/dashboard');
      } else {
        const errorData = data as ErrorResponse;
        setError(errorData.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Welcome Back</h2>
        
        {error && <div className="error">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="auth-switch">
          Don't have an account? <Link to="/register">Sign up here</Link>
        </div>
      </form>
    </div>
  );
};

export default Login; 