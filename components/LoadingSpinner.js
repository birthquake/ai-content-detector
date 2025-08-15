// components/LoadingSpinner.js
export default function LoadingSpinner({ size = 'medium', color = '#4CAF50' }) {
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  const spinnerStyles = {
    width: sizes[size],
    height: sizes[size],
    border: `3px solid #f3f3f3`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    display: 'inline-block'
  };

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={spinnerStyles}></div>
    </>
  );
}

// Loading Button Component
export function LoadingButton({ 
  loading, 
  children, 
  disabled, 
  onClick, 
  className = '',
  style = {},
  ...props 
}) {
  const buttonStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: loading ? '0.5rem' : '0',
    transition: 'all 0.2s ease',
    ...style
  };

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={className}
      style={buttonStyles}
      {...props}
    >
      {loading && <LoadingSpinner size="small" color="white" />}
      {children}
    </button>
  );
}

// Loading Overlay Component
export function LoadingOverlay({ message = 'Loading...', visible = false }) {
  if (!visible) return null;

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    color: 'white',
    fontSize: '1.2rem'
  };

  return (
    <div style={overlayStyles}>
      <LoadingSpinner size="large" color="white" />
      <div style={{ marginTop: '1rem' }}>{message}</div>
    </div>
  );
}
