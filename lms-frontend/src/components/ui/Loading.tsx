import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text,
  overlay = false 
}) => {
  const sizeStyles = {
    sm: { width: '24px', height: '24px', borderWidth: '2px' },
    md: { width: '36px', height: '36px', borderWidth: '2px' },
    lg: { width: '48px', height: '48px', borderWidth: '3px' },
  };

  const container = overlay ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    zIndex: 9999,
  } : {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '24px',
  };

  return (
    <div style={container}>
      <div
        style={{
          ...sizeStyles[size],
          border: `${sizeStyles[size].borderWidth} solid var(--border)`,
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      {text && (
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {text}
        </span>
      )}
    </div>
  );
};

export default Loading;
