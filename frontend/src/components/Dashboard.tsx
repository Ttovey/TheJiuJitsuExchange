import React from 'react';
import { User } from '../types';
import Navbar from './Navbar';

interface DashboardProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, setUser }) => {

  if (!user) {
    return (
      <div className="profile-page">
        <Navbar user={user} setUser={setUser} />
        <div className="profile-container">
          <h1>Access Denied</h1>
          <p>Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar user={user} setUser={setUser} />
      <div className="profile-container">
        
        <h1 className="profile-title">My Dashboard</h1>
        
        <div className="profile-content">
          <div className="profile-section">
            <h2>Welcome Back!</h2>
            <div className="profile-info">
              <p>Hello, {user.username}! Welcome to your dashboard.</p>
              <p>More features coming soon...</p>
            </div>
          </div>
          
          <div className="profile-section">
            <h2>Quick Stats</h2>
            <div className="profile-stats">
              <p>Dashboard content will be added here.</p>
            </div>
          </div>
          
          <div className="profile-section">
            <h2>Recent Activity</h2>
            <div className="profile-activity">
              <p>Activity feed coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 