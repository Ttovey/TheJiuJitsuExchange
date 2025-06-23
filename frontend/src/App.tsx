import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Settings from './components/Settings';
import MembershipSuccess from './components/MembershipSuccess';
import MembershipCancel from './components/MembershipCancel';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="auth-form" style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/dashboard" /> : <Register setUser={setUser} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={<Dashboard user={user} setUser={setUser} />} 
          />
          <Route 
            path="/landing" 
            element={<Landing user={user} setUser={setUser} />} 
          />
          <Route 
            path="/profile" 
            element={<Profile user={user} setUser={setUser} />} 
          />
          <Route 
            path="/settings" 
            element={<Settings user={user} setUser={setUser} />} 
          />
          <Route 
            path="/membership/success" 
            element={<MembershipSuccess user={user} setUser={setUser} />} 
          />
          <Route 
            path="/membership/cancel" 
            element={<MembershipCancel user={user} setUser={setUser} />} 
          />
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 