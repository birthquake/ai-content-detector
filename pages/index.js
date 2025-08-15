// pages/index.js
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AuthForm from '../components/AuthForm';
import { useToast } from '../components/Toast';
import { LoadingButton, LoadingOverlay } from '../components/LoadingSpinner';

export default function Home() {
  const { user, logout, sendVerificationEmail, refreshUser } = useAuth();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const { showToast, ToastContainer } = useToast();

  // Load user stats when user logs in
  useEffect(() => {
    if (user && user.emailVerified) {
      loadUserStats();
    } else {
      setUserStats(null);
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      setPageLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        // Reset daily usage if it's a new day
        const today = new Date().toDateString();
        if (data.lastResetDate !== today) {
          await updateDoc(doc(db, 'users', user.uid), {
            usageCount: 0,
            lastResetDate: today
          });
          setUserStats({ ...data, usageCount: 0, lastResetDate: today });
        } else {
          setUserStats(data);
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      showToast('Error loading your account data', 'error');
    } finally {
      setPageLoading(false);
    }
  };

  const checkUsageLimit = () => {
    if (!userStats) return false;
    if (userStats.plan === 'pro') return true; // Unlimited for pro users
    return userStats.usageCount < 5; // 5 free scans per day
  };

  const analyzeText = async () => {
    if (!text.trim()) {
      showToast('Please enter some text to analyze', 'warning');
      return;
    }

    if (text.trim().length < 50) {
      showToast('Text must be at least 50 characters long', 'warning');
      return;
    }

    if (!checkUsageLimit()) {
      showToast('Daily limit reached! Upgrade to Pro for unlimited scans', 'warning');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/detect-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('AI service temporarily unavailable. Please try again in a few moments.');
        } else if (response.status >= 500) {
          throw new Error('Server error occurred. Please try again.');
        } else {
          throw new Error('Analysis failed. Please check your text and try again.');
        }
      }

      const data = await response.json();
      setResult(data);
      showToast('Analysis completed successfully!', 'success');

      // Update usage count
      if (userStats) {
        const newCount = userStats.usageCount + 1;
        await updateDoc(doc(db, 'users', user.uid), {
          usageCount: newCount
        });
        setUserStats({ ...userStats, usageCount: newCount });
      }

    } catch (error) {
      console.error('Error:', error);
      
      if (error.name === 'AbortError') {
        showToast('Request timed out. Please try again with shorter text.', 'error');
      } else if (!navigator.onLine) {
        showToast('No internet connection. Please check your connection and try again.', 'error');
      } else {
        showToast(error.message || 'Error analyzing text. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setVerificationLoading(true);
    
    try {
      await sendVerificationEmail();
      showToast('Verification email sent! Please check your inbox.', 'success');
    } catch (error) {
      showToast('Error sending email. Please try again.', 'error');
    }
    
    setVerificationLoading(false);
  };

  const handleRefreshVerification = async () => {
    setVerificationLoading(true);
    try {
      await refreshUser();
      if (user?.emailVerified) {
        showToast('Email verified successfully!', 'success');
      } else {
        showToast('Email not yet verified. Please check your email and click the verification link.', 'warning');
      }
    } catch (error) {
      showToast('Error checking verification status', 'error');
    }
    setVerificationLoading(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Signed out successfully', 'info');
    } catch (error) {
      showToast('Error signing out', 'error');
    }
  };

  // Show auth form if user is not logged in
  if (!user) {
    return (
      <>
        <ToastContainer />
        <div>
          <div className="container">
            <h1>🤖 AI Content Detector</h1>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
              Sign in to detect AI-generated content with advanced analysis
            </p>
          </div>
          <AuthForm />
        </div>
      </>
    );
  }

  // Show verification screen if user is logged in but not verified
  if (user && !user.emailVerified) {
    return (
      <>
        <ToastContainer />
        <LoadingOverlay visible={verificationLoading} message="Processing..." />
        <div className="container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1>📧 Verify Your Email</h1>
            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '2rem',
              margin: '2rem 0',
              maxWidth: '500px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                We've sent a verification email to:
              </p>
              <p style={{ 
                fontWeight: 'bold', 
                marginBottom: '2rem',
                fontSize: '1.1rem',
                color: '#333'
              }}>
                {user.email}
              </p>
              <p style={{ marginBottom: '2rem', color: '#666' }}>
                Please click the verification link in your email before using the AI detector.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <LoadingButton 
                  loading={verificationLoading}
                  onClick={handleResendVerification}
                  style={{ 
                    backgroundColor: '#007bff',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    width: 'auto'
                  }}
                >
                  Resend Email
                </LoadingButton>
                
                <LoadingButton 
                  loading={verificationLoading}
                  onClick={handleRefreshVerification}
                  style={{ 
                    backgroundColor: '#28a745',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    width: 'auto'
                  }}
                >
                  I've Verified
                </LoadingButton>
              </div>
            </div>
            
            <p style={{ color: '#666', marginTop: '2rem' }}>
              Wrong email address?{' '}
              <button 
                onClick={handleLogout}
                style={{ 
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Sign out and try again
              </button>
            </p>
          </div>
        </div>
      </>
    );
  }

  // Show main app if user is logged in and verified
  return (
    <>
      <ToastContainer />
      <LoadingOverlay visible={pageLoading} message="Loading your dashboard..." />
      
      <div className="container">
        {/* Header with user info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>🤖 AI Content Detector</h1>
            <p style={{ color: '#666', margin: '0.5rem 0' }}>
              Welcome, {user.email} ✅
            </p>
            {userStats && (
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                {userStats.plan === 'pro' ? (
                  <span style={{ color: '#4CAF50' }}>✨ Pro Plan - Unlimited scans</span>
                ) : (
                  <span>
                    Daily usage: {userStats.usageCount}/5 
                    {userStats.usageCount >= 5 && (
                      <span style={{ color: '#ff6b6b' }}> (Limit reached)</span>
                    )}
                  </span>
                )}
              </p>
            )}
          </div>
          <div>
            {userStats?.plan !== 'pro' && (
              <button 
                style={{ 
                  backgroundColor: '#ff9800', 
                  marginRight: '1rem',
                  padding: '8px 16px',
                  fontSize: '14px'
                }}
                onClick={() => showToast('Upgrade feature coming soon!', 'info')}
              >
                Upgrade to Pro
              </button>
            )}
            <button 
              onClick={handleLogout}
              style={{ 
                backgroundColor: '#666', 
                padding: '8px 16px',
                fontSize: '14px'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Main AI detector interface */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the text you want to analyze for AI-generated content... (minimum 50 characters)"
          rows="8"
        />
        
        <LoadingButton 
          loading={loading}
          onClick={analyzeText}
          disabled={!checkUsageLimit()}
        >
          {loading ? 'Analyzing Text...' : 'Analyze Text'}
        </LoadingButton>

        {!checkUsageLimit() && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p><strong>Daily limit reached!</strong></p>
            <p>Upgrade to Pro for unlimited AI detection scans.</p>
          </div>
        )}

        {result && (
          <div className="result-box">
            <h3>Analysis Results</h3>
            <p><strong>AI Probability:</strong> {result.aiProbability}%</p>
            <p><strong>Confidence:</strong> {result.confidence}</p>
            <p><strong>Assessment:</strong> {result.assessment}</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
              Model: {result.model} | Text length: {result.textLength} characters
            </p>
          </div>
        )}
      </div>
    </>
  );
}
