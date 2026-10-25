import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  size?: 'sm' | 'md';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    primary: {
      background: 'var(--accent-light)',
      color: 'var(--accent)',
      border: '1px solid var(--accent-border)',
    },
    success: {
      background: 'rgba(22, 163, 74, 0.1)',
      color: 'var(--success)',
      border: '1px solid transparent',
    },
    warning: {
      background: 'rgba(217, 119, 6, 0.1)',
      color: 'var(--warning)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'rgba(220, 38, 38, 0.1)',
      color: 'var(--danger)',
      border: '1px solid transparent',
    },
    info: {
      background: 'rgba(2, 132, 199, 0.1)',
      color: 'var(--info)',
      border: '1px solid transparent',
    },
    secondary: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border)',
    },
  };

  const sizeStyles = {
    sm: { fontSize: '0.62rem', padding: '2px 6px' },
    md: { fontSize: '0.68rem', padding: '3px 8px' },
  };

  return (
    <span
      className={`badge ${className}`}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: 'var(--radius-sm)',
        fontWeight: 600,
        letterSpacing: '0.3px',
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
