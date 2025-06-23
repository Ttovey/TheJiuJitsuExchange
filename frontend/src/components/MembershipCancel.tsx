import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';

interface MembershipCancelProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const MembershipCancel: React.FC<MembershipCancelProps> = ({ user, setUser }) => {
  return (
    <div className="container">
      <div className="auth-form" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', color: 'orange', marginBottom: '20px' }}>
          ⚠️
        </div>
        <h2>Subscription Cancelled</h2>
        <p>Your subscription process was cancelled. No charges were made.</p>
        <p>You can try again anytime to access our premium features.</p>
        
        <div style={{ marginTop: '30px' }}>
          <Link 
            to="/membership" 
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px 20px',
              textDecoration: 'none',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          >
            Try Again
          </Link>
          <Link 
            to="/dashboard" 
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '10px 20px',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MembershipCancel; 