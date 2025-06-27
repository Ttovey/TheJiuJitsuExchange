import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
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
            element={
              user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/profile" 
            element={
              user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/membership/success" 
            element={
              user ? <MembershipSuccess user={user} setUser={setUser} /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/membership/cancel" 
            element={
              user ? <MembershipCancel user={user} setUser={setUser} /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/" 
            element={
              user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 