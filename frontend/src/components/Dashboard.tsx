import React, { useState, useEffect } from 'react';
import { User, MembershipStatus, MembershipPlan } from '../types';
import { stripeService } from '../services/stripeService';
import Navbar from './Navbar';

interface DashboardProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, setUser }) => {
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [membershipLoading, setMembershipLoading] = useState<boolean>(true);
  const [membershipError, setMembershipError] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);

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

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

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

  // Show loading state while checking membership
  if (membershipLoading) {
    return (
      <div className="profile-page">
        <Navbar user={user} setUser={setUser} />
        <div className="profile-container">
          <h1 className="profile-title">Dashboard</h1>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p>Loading...</p>
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
        </div>
      </div>
    );
  }

  // Show subscription gate if user doesn't have active membership
  if (!membershipStatus?.has_membership) {
    return (
      <div className="profile-page">
        <Navbar user={user} setUser={setUser} />
        <div className="profile-container">
          <h1 className="profile-title">Sign up to see your dashboard</h1>
          
          <div className="profile-content">
            <div className="profile-section">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.2rem', color: '#cccccc', marginBottom: '1rem' }}>
                  Get access to your dashboard and all premium features with a monthly subscription.
                </p>
              </div>

              {membershipError && (
                <div style={{ color: '#ff6b6b', marginBottom: '15px', textAlign: 'center' }}>
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
              )}

              <div className="membership-plans">
                {plans.filter(plan => plan.interval === 'month').map((plan) => (
                  <div 
                    key={plan.id} 
                    style={{ 
                      backgroundColor: '#2a2a2a',
                      border: '2px solid #667eea', 
                      padding: '2rem', 
                      borderRadius: '12px', 
                      marginBottom: '1rem',
                      textAlign: 'center'
                    }}
                  >
                    <h3 style={{ margin: '0 0 1rem 0', color: '#667eea', fontSize: '1.5rem' }}>
                      {plan.name}
                    </h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '1rem' }}>
                      {formatPrice(plan.price, plan.currency)}
                      <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#cccccc' }}>
                        /{plan.interval}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={processing}
                      style={{
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '15px 30px',
                        borderRadius: '8px',
                        cursor: processing ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        width: '100%',
                        maxWidth: '200px'
                      }}
                    >
                      {processing ? 'Processing...' : 'Subscribe Now'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the actual dashboard for subscribed users
  return (
    <div className="profile-page">
      <Navbar user={user} setUser={setUser} />
      <div className="profile-container">
        
        <h1 className="profile-title">Dashboard</h1>
        
        <div className="dashboard-layout">
          <div className="weekly-schedule-section">
            <h2>Weekly Class Schedule</h2>
            <WeeklyClassSchedule user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Weekly Class Schedule Component
interface ClassScheduleItem {
  id: string;
  day: string;
  time: string;
  class_name: string;
  instructor: string;
  capacity: number;
  enrolled: number;
  is_enrolled: boolean;
}

interface WeeklyClassScheduleProps {
  user: User;
}

const WeeklyClassSchedule: React.FC<WeeklyClassScheduleProps> = ({ user }) => {
  const [classes, setClasses] = useState<ClassScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [enrollLoading, setEnrollLoading] = useState<{ [key: string]: boolean }>({});

  // Actual gym class schedule
  const mockClasses: ClassScheduleItem[] = [
    // Monday
    {
      id: '1',
      day: 'Monday',
      time: '6:30 PM - 7:30 PM',
      class_name: 'No Gi Jiu-Jitsu',
      instructor: 'Fundamentals Break-Off Depending On Curriculum/Attendance',
      capacity: 20,
      enrolled: 12,
      is_enrolled: false
    },
    {
      id: '2',
      day: 'Monday',
      time: '7:30 PM - 8:30 PM',
      class_name: 'Open Sparring',
      instructor: '',
      capacity: 25,
      enrolled: 8,
      is_enrolled: true
    },
    // Tuesday
    {
      id: '3',
      day: 'Tuesday',
      time: '6:30 PM - 7:30 PM',
      class_name: 'Gi Jiu-Jitsu',
      instructor: 'Fundamentals Break-Off Depending On Curriculum/Attendance',
      capacity: 20,
      enrolled: 15,
      is_enrolled: false
    },
    {
      id: '4',
      day: 'Tuesday',
      time: '7:30 PM - 8:30 PM',
      class_name: 'Open Sparring',
      instructor: '',
      capacity: 25,
      enrolled: 10,
      is_enrolled: false
    },
    // Wednesday
    {
      id: '5',
      day: 'Wednesday',
      time: '6:30 PM - 7:30 PM',
      class_name: 'No Gi Jiu-Jitsu',
      instructor: 'Fundamentals Break-Off Depending On Curriculum/Attendance',
      capacity: 20,
      enrolled: 14,
      is_enrolled: true
    },
    {
      id: '6',
      day: 'Wednesday',
      time: '7:30 PM - 8:30 PM',
      class_name: 'Open Sparring',
      instructor: '',
      capacity: 25,
      enrolled: 11,
      is_enrolled: false
    },
    // Thursday
    {
      id: '7',
      day: 'Thursday',
      time: '6:30 PM - 7:30 PM',
      class_name: 'Gi Jiu-Jitsu',
      instructor: 'Fundamentals Break-Off Depending On Curriculum/Attendance',
      capacity: 20,
      enrolled: 16,
      is_enrolled: false
    },
    {
      id: '8',
      day: 'Thursday',
      time: '7:30 PM - 8:30 PM',
      class_name: 'Open Sparring',
      instructor: '',
      capacity: 25,
      enrolled: 13,
      is_enrolled: false
    },
    // Friday
    {
      id: '9',
      day: 'Friday',
      time: '6:30 PM - 7:00 PM',
      class_name: 'No Gi Weekly Wrap-Up',
      instructor: '',
      capacity: 15,
      enrolled: 9,
      is_enrolled: false
    },
    {
      id: '10',
      day: 'Friday',
      time: '7:00 PM - 8:00 PM',
      class_name: 'Open Sparring',
      instructor: '',
      capacity: 25,
      enrolled: 7,
      is_enrolled: true
    },
    // Saturday
    {
      id: '11',
      day: 'Saturday',
      time: '11:00 AM - 12:00 PM',
      class_name: 'No Gi Jiu-Jitsu All Levels',
      instructor: '',
      capacity: 20,
      enrolled: 12,
      is_enrolled: false
    },
    {
      id: '12',
      day: 'Saturday',
      time: '12:00 PM - 1:30 PM',
      class_name: 'Open Mat',
      instructor: 'Free and Open to All',
      capacity: 30,
      enrolled: 18,
      is_enrolled: true
    }
    // Sunday - No classes
  ];

  useEffect(() => {
    loadClassSchedule();
  }, []);

  const loadClassSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/classes/weekly', {
      //   credentials: 'include',
      // });
      // if (!response.ok) throw new Error('Failed to load class schedule');
      // const data = await response.json();
      // setClasses(data.classes);
      
      // For now, use mock data
      setTimeout(() => {
        setClasses(mockClasses);
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load class schedule');
      setLoading(false);
    }
  };

  const handleEnrollment = async (classId: string, isEnrolling: boolean) => {
    try {
      setEnrollLoading(prev => ({ ...prev, [classId]: true }));
      setError('');
      
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/classes/${classId}/${isEnrolling ? 'enroll' : 'unenroll'}`, {
      //   method: 'POST',
      //   credentials: 'include',
      // });
      // if (!response.ok) throw new Error('Failed to update enrollment');
      
      // For now, simulate API call and update local state
      setTimeout(() => {
        setClasses(prev => prev.map(cls => {
          if (cls.id === classId) {
            return {
              ...cls,
              is_enrolled: isEnrolling,
              enrolled: isEnrolling ? cls.enrolled + 1 : cls.enrolled - 1
            };
          }
          return cls;
        }));
        setEnrollLoading(prev => ({ ...prev, [classId]: false }));
      }, 500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update enrollment');
      setEnrollLoading(prev => ({ ...prev, [classId]: false }));
    }
  };

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1); // Get Monday of current week
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayIndex];
  };

  const weekDates = getCurrentWeekDates();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#cccccc' }}>Loading class schedule...</p>
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
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</p>
        <button 
          onClick={loadClassSchedule}
          style={{
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

    // Group classes by day
  const groupedClasses = classes.reduce((acc, classItem) => {
    if (!acc[classItem.day]) {
      acc[classItem.day] = [];
    }
    acc[classItem.day].push(classItem);
    return acc;
  }, {} as { [key: string]: ClassScheduleItem[] });

  // Order days properly
  const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return (
    <div className="class-schedule">
      <div className="week-header">
        <h3 style={{ color: '#667eea', marginBottom: '1.5rem' }}>
          Week of {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
        </h3>
      </div>
      
      <div className="schedule-list">
        {orderedDays.map((day) => {
          const dayClasses = groupedClasses[day] || [];
          if (dayClasses.length === 0) return null;
          
          return (
            <div key={day} className="day-box">
              <div className="day-title">{day}</div>
              
              <div className="day-classes-list">
                {dayClasses.map((classItem) => {
                  const isFullyBooked = classItem.enrolled >= classItem.capacity;
                  const isLoading = enrollLoading[classItem.id];
                  
                  return (
                    <div key={classItem.id} className="class-in-day">
                      <div className="class-info">
                        <div className="class-name-primary">{classItem.class_name}</div>
                        <div className="class-time-secondary">{classItem.time}</div>
                        {classItem.instructor && (
                          <div className="class-description">{classItem.instructor}</div>
                        )}
                      </div>
                      
                      <div className="class-enrollment">
                        <div className="class-capacity-small">
                          {classItem.enrolled}/{classItem.capacity}
                        </div>
                        
                        <div className="class-actions">
                          {classItem.is_enrolled ? (
                            <button
                              onClick={() => handleEnrollment(classItem.id, false)}
                              disabled={isLoading}
                              className="btn-unenroll-simple"
                            >
                              {isLoading ? 'Updating...' : 'Drop'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnrollment(classItem.id, true)}
                              disabled={isLoading || isFullyBooked}
                              className={isFullyBooked ? 'btn-full-simple' : 'btn-enroll-simple'}
                            >
                              {isLoading ? 'Updating...' : isFullyBooked ? 'Full' : 'Sign Up'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard; 