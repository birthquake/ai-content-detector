// pages/index.js
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AuthForm from '../components/AuthForm';

export default function Home() {
  const { user, logout } = useAuth();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);

  // Load user stats when user logs in
  useEffect(() => {
    if (user) {
      loadUserStats();
    } else {
      setUserStats(null);
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
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
    }
  };

  const checkUsageLimit = () => {
    if (!userStats) return false;
    if (userStats.plan === 'pro') return true; // Unlimited for pro users
    return userStats.usageCount < 5; // 5 free scans per day
  };

  const analyzeText = async () => {
    if (!text.trim()) {
      alert('Please enter some text to analyze.');
      return;
    }

    if (!checkUsageLimit()) {
      alert('Daily limit reached! Upgrade to Pro for unlimited scans.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/detect-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data);

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
      alert('Error analyzing text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show auth form if user is not logged in
  if (!user) {
    return (
      <div>
        <div className="container">
          <h1>🤖 AI Content Detector</h1>
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
            Sign in to detect AI-generated content with advanced analysis
          </p>
        </div>
        <AuthForm />
      </div>
    );
  }

  // Show main app if user is logged in
  return (
    <div className="container">
      {/* Header with user info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>🤖 AI Content Detector</h1>
          <p style={{ color: '#666', margin: '0.5rem 0' }}>
            Welcome, {user.email}
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
              onClick={() => alert('Upgrade feature coming soon!')}
            >
              Upgrade to Pro
            </button>
          )}
          <button 
            onClick={logout}
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
        placeholder="Paste the text you want to analyze for AI-generated content..."
        rows="8"
      />
      
      <button 
        onClick={analyzeText} 
        disabled={loading || !checkUsageLimit()}
      >
        {loading ? 'Analyzing...' : 'Analyze Text'}
      </button>

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
        </div>
      )}
    </div>
  );
}
