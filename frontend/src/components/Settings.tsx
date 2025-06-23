import React from 'react';
import { User } from '../types';
import Navbar from './Navbar';

interface SettingsProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, setUser }) => {

  if (!user) {
    return (
      <div className="settings-page">
        <Navbar user={user} setUser={setUser} />
        <div className="settings-container">
          <h1>Access Denied</h1>
          <p>Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <Navbar user={user} setUser={setUser} />
      <div className="settings-container">
        
        <h1 className="settings-title">Settings</h1>
        
        <div className="settings-content">
          <div className="settings-section">
            <h2>Account Settings</h2>
            <div className="settings-group">
              <p>Change password, update email, etc.</p>
              <p><em>Coming soon...</em></p>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>Notification Preferences</h2>
            <div className="settings-group">
              <p>Manage email notifications, class reminders, etc.</p>
              <p><em>Coming soon...</em></p>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>Privacy Settings</h2>
            <div className="settings-group">
              <p>Control your privacy and data sharing preferences.</p>
              <p><em>Coming soon...</em></p>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>App Preferences</h2>
            <div className="settings-group">
              <p>Theme, language, and other app settings.</p>
              <p><em>Coming soon...</em></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 