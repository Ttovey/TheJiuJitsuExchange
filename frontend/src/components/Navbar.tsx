import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LoginFormData, AuthResponse, ErrorResponse } from '../types';
import logo from '../assets/images/logo.png';

interface NavbarProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [loginData, setLoginData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  const handleLogout = async (): Promise<void> => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setUser(null);
        setIsMenuOpen(false);
        navigate('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(loginData)
      });

      const data: AuthResponse | ErrorResponse = await response.json();

      if (response.ok) {
        const authData = data as AuthResponse;
        setUser(authData.user);
        setShowLoginForm(false);
        setIsMenuOpen(false);
        setLoginData({ username: '', password: '' });
      } else {
        const errorData = data as ErrorResponse;
        setLoginError(errorData.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLoginClick = (): void => {
    setShowLoginForm(true);
    setLoginError('');
  };

  const handleRegisterClick = (): void => {
    navigate('/register');
    setIsMenuOpen(false);
  };

  const handleDashboardClick = (): void => {
    navigate('/dashboard');
    setIsMenuOpen(false);
  };

  const handleProfileClick = (): void => {
    navigate('/profile');
    setIsMenuOpen(false);
  };

  const handleMembershipClick = (): void => {
    navigate('/membership');
    setIsMenuOpen(false);
  };

  const handleHomeClick = (): void => {
    navigate('/dashboard');
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="The Jiu-Jitsu Exchange Logo" className="logo-image" />
      </div>
      <h1 className="navbar-title" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
        The Jiu-Jitsu Exchange
      </h1>
      <div className="hamburger-menu">
        <button 
          className="hamburger-button"
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        
        {isMenuOpen && (
          <div className="dropdown-menu">
            {/* Authentication Section */}
            {user ? (
              <>
                <div className="user-greeting">
                  Hello, {user.username}!
                </div>
                <button 
                  onClick={handleDashboardClick} 
                  className="dropdown-item dashboard-item"
                >
                  Dashboard
                </button>
                <button 
                  onClick={handleProfileClick} 
                  className="dropdown-item profile-item"
                >
                  Profile
                </button>
                <button 
                  onClick={handleLogout} 
                  className="dropdown-item logout-item"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {!showLoginForm ? (
                  <>
                    <button 
                      onClick={handleLoginClick} 
                      className="dropdown-item login-item"
                    >
                      Login
                    </button>
                    <button 
                      onClick={handleRegisterClick} 
                      className="dropdown-item register-item"
                    >
                      Register
                    </button>
                  </>
                ) : (
                  <div className="login-form-dropdown">
                    <h3>Login</h3>
                    {loginError && <div className="error-small">{loginError}</div>}
                    <form onSubmit={handleLogin}>
                      <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={loginData.username}
                        onChange={handleLoginInputChange}
                        required
                        className="dropdown-input"
                      />
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={loginData.password}
                        onChange={handleLoginInputChange}
                        required
                        className="dropdown-input"
                      />
                      <button 
                        type="submit" 
                        className="dropdown-submit"
                        disabled={loginLoading}
                      >
                        {loginLoading ? 'Signing In...' : 'Sign In'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowLoginForm(false)}
                        className="dropdown-cancel"
                      >
                        Cancel
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 