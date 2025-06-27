import React, { useState, useEffect, useRef } from 'react';
import { User, MembershipPlan, MembershipStatus } from '../types';
import { stripeService } from '../services/stripeService';
import { profileService } from '../services/profileService';
import Navbar from './Navbar';

interface ProfileProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, setUser }) => {
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [membershipLoading, setMembershipLoading] = useState<boolean>(true);
  const [membershipError, setMembershipError] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [profilePictureLoading, setProfilePictureLoading] = useState<boolean>(false);
  const [profilePictureError, setProfilePictureError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadMembershipData();
    }
  }, [user]);

  const loadMembershipData = async () => {
    try {
      setMembershipLoading(true);
      setMembershipError('');
      
      const [statusResponse, plansResponse] = await Promise.all([
        stripeService.getMembershipStatus(),
        stripeService.getMembershipPlans(),
      ]);
      
      setMembershipStatus(statusResponse);
      setPlans(plansResponse.plans);
    } catch (err) {
      setMembershipError(err instanceof Error ? err.message : 'Failed to load membership data');
    } finally {
      setMembershipLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setProcessing(true);
      setMembershipError('');
      
      const response = await stripeService.createCheckoutSession(planId);
      
      // Redirect to Stripe checkout
      window.location.href = response.checkout_url;
    } catch (err) {
      setMembershipError(err instanceof Error ? err.message : 'Failed to create checkout session');
      setProcessing(false);
    }
  };

  const handleCancelMembership = async () => {
    if (!window.confirm('Are you sure you want to cancel your membership? You will lose access at the end of your current billing period.')) {
      return;
    }

    try {
      setProcessing(true);
      setMembershipError('');
      
      await stripeService.cancelMembership();
      
      // Reload membership status
      await loadMembershipData();
    } catch (err) {
      setMembershipError(err instanceof Error ? err.message : 'Failed to cancel membership');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfilePictureError('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.match(/^image\/(png|jpg|jpeg|gif)$/)) {
      setProfilePictureError('Only PNG, JPG, JPEG, and GIF files are allowed');
      return;
    }

    try {
      setProfilePictureLoading(true);
      setProfilePictureError('');

      const result = await profileService.uploadProfilePicture(file);
      
      // Update user state with new profile picture
      if (user) {
        setUser({
          ...user,
          profile_picture: result.profile_picture
        });
      }

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      setProfilePictureError(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setProfilePictureLoading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    try {
      setProfilePictureLoading(true);
      setProfilePictureError('');

      await profileService.deleteProfilePicture();
      
      // Update user state to remove profile picture
      if (user) {
        setUser({
          ...user,
          profile_picture: undefined
        });
      }

    } catch (error) {
      setProfilePictureError(error instanceof Error ? error.message : 'Failed to delete profile picture');
    } finally {
      setProfilePictureLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <Navbar user={user} setUser={setUser} />
        <div className="profile-container">
          <h1>Access Denied</h1>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar user={user} setUser={setUser} />
      <div className="profile-container">
        
        <h1 className="profile-title">Profile</h1>
        
        <div className="profile-content">
          <div className="profile-section">
            <h2>User Information</h2>
            <div className="profile-info">
              {/* Profile Picture Section */}
              <div className="profile-picture-section" style={{ marginBottom: '20px' }}>
                <div className="profile-picture-container" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '20px',
                  marginBottom: '10px'
                }}>
                  <div 
                    className="profile-picture"
                    onClick={handleProfilePictureClick}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      border: '3px solid #667eea',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: '#2a2a2a',
                      transition: 'border-color 0.3s ease'
                    }}
                  >
                    {user.profile_picture ? (
                      <img 
                        src={profileService.getProfilePictureUrl(user.profile_picture) || ''}
                        alt="Profile"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <span style={{ 
                        fontSize: '40px', 
                        color: '#667eea',
                        userSelect: 'none'
                      }}>
                        👤
                      </span>
                    )}
                  </div>
                  
                  <div className="profile-picture-actions">
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#cccccc' }}>
                      Click to upload a new profile picture
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleProfilePictureClick}
                        disabled={profilePictureLoading}
                        style={{
                          backgroundColor: '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: profilePictureLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {profilePictureLoading ? 'Uploading...' : 'Upload Photo'}
                      </button>
                      
                      {user.profile_picture && (
                        <button
                          onClick={handleDeleteProfilePicture}
                          disabled={profilePictureLoading}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: profilePictureLoading ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {profilePictureError && (
                  <div style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>
                    {profilePictureError}
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpg,image/jpeg,image/gif"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
              
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email || 'Not provided'}</p>
              <p><strong>Member Since:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="profile-section">
            <h2>Membership</h2>
            <div className="profile-membership">
              {membershipLoading ? (
                <div style={{ textAlign: 'center' }}>
                  <p>Loading membership information...</p>
                  <div style={{ 
                    border: '2px solid #f3f3f3',
                    borderTop: '2px solid #667eea',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    animation: 'spin 2s linear infinite',
                    margin: '10px auto'
                  }}></div>
                </div>
              ) : membershipError ? (
                <div style={{ color: 'red', marginBottom: '15px' }}>
                  {membershipError}
                  <button 
                    onClick={loadMembershipData}
                    style={{
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginLeft: '10px',
                      fontSize: '12px'
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : membershipStatus?.has_membership ? (
                <div className="membership-active">
                  <div style={{ 
                    backgroundColor: '#2a2a2a', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    border: '2px solid #28a745' 
                  }}>
                    <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>
                      ✓ Active Membership
                    </h3>
                    <p><strong>Plan:</strong> {membershipStatus.plan_type}</p>
                    <p><strong>Status:</strong> {membershipStatus.status}</p>
                    {membershipStatus.current_period_end && (
                      <p><strong>Next billing:</strong> {formatDate(membershipStatus.current_period_end)}</p>
                    )}
                    
                    {membershipStatus.status === 'active' && (
                      <button
                        onClick={handleCancelMembership}
                        disabled={processing}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: processing ? 'not-allowed' : 'pointer',
                          marginTop: '10px',
                          fontSize: '14px'
                        }}
                      >
                        {processing ? 'Processing...' : 'Cancel Membership'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="membership-inactive">
                  
                  {plans.map((plan) => (
                    <div 
                      key={plan.id} 
                      style={{ 
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #444', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginBottom: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: '0 0 5px 0', color: '#667eea' }}>{plan.name}</h4>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                            {formatPrice(plan.price, plan.currency)}
                            <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#cccccc' }}>
                              /{plan.interval}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={processing}
                          style={{
                            backgroundColor: '#667eea',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: processing ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          {processing ? 'Processing...' : 'Subscribe'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 