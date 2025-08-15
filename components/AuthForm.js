// components/AuthForm.js
import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useToast } from './Toast';
import { LoadingButton } from './LoadingSpinner';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup, resetPassword } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        showToast('Signed in successfully!', 'success');
      } else {
        await signup(email, password);
        showToast('Account created! Please check your email and click the verification link before signing in.', 'success');
        setIsLogin(true); // Switch to login mode
        setPassword(''); // Clear password field
      }
    } catch (error) {
      // More user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        showToast('No account found with this email address.', 'error');
      } else if (error.code === 'auth/wrong-password') {
        showToast('Incorrect password.', 'error');
      } else if (error.code === 'auth/email-already-in-use') {
        showToast('An account with this email already exists.', 'error');
      } else if (error.code === 'auth/weak-password') {
        showToast('Password should be at least 6 characters.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        showToast('Please enter a valid email address.', 'error');
      } else if (error.code === 'auth/too-many-requests') {
        showToast('Too many failed attempts. Please try again later.', 'error');
      } else if (error.code === 'auth/network-request-failed') {
        showToast('Network error. Please check your connection and try again.', 'error');
      } else {
        showToast(error.message || 'An error occurred. Please try again.', 'error');
      }
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address.', 'warning');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      showToast('Password reset email sent! Check your inbox.', 'success');
      setShowResetPassword(false);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        showToast('No account found with this email address.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        showToast('Please enter a valid email address.', 'error');
      } else {
        showToast('Error sending reset email. Please try again.', 'error');
      }
    }
    setLoading(false);
  };

  if (showResetPassword) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>Reset Password</h2>
          
          <form onSubmit={handlePasswordReset}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <LoadingButton 
              loading={loading}
              type="submit"
              className="auth-button"
            >
              Send Reset Email
            </LoadingButton>
          </form>
          
          <p className="auth-toggle">
            Remember your password?{' '}
            <button 
              type="button"
              onClick={() => setShowResetPassword(false)}
              className="link-button"
            >
              Back to Sign In
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>
          
          <LoadingButton 
            loading={loading}
            type="submit"
            className="auth-button"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </LoadingButton>
        </form>
        
        {isLogin && (
          <p className="auth-toggle">
            <button 
              type="button"
              onClick={() => setShowResetPassword(true)}
              className="link-button"
            >
              Forgot your password?
            </button>
          </p>
        )}
        
        <p className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setPassword('');
            }}
            className="link-button"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
