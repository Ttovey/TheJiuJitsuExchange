import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User } from '../types';
import { stripeService } from '../services/stripeService';

interface MembershipSuccessProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const MembershipSuccess: React.FC<MembershipSuccessProps> = ({ user, setUser }) => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPaymentAndCreateMembership = async () => {
      if (sessionId) {
        try {
          const result = await stripeService.verifyPayment(sessionId);
          setVerificationStatus(result.message);
        } catch (error) {
          console.error('Error verifying payment:', error);
          setVerificationStatus('Error verifying payment');
        }
      }
      
      // Wait a bit before showing success
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    };

    verifyPaymentAndCreateMembership();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="container">
        <div className="auth-form" style={{ textAlign: 'center' }}>
          <h2>Processing your subscription...</h2>
          <p>Please wait while we confirm your payment.</p>
          <div style={{ 
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 2s linear infinite',
            margin: '20px auto'
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="auth-form" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', color: 'green', marginBottom: '20px' }}>
          ✓
        </div>
        <h2>Subscription Successful!</h2>
        <p>Thank you for subscribing! Your membership is now active.</p>
        <p>You should receive a confirmation email shortly.</p>
        {verificationStatus && (
          <p style={{ fontSize: '14px', color: '#cccccc', marginTop: '10px' }}>
            Status: {verificationStatus}
          </p>
        )}
        
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
            View Membership
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

export default MembershipSuccess; 