import React, { useState } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  style: propStyle,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [hovered, setHovered] = useState(false);
  const isInteractive = !disabled && !loading;

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    border: 'none',
    borderRadius: '8px',
    cursor: isInteractive ? 'pointer' : 'not-allowed',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#ffffff' },
    secondary: { background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    danger: { background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)' },
    outline: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)' },
  };

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent-hover)' },
    secondary: { background: 'var(--bg-elevated)', borderColor: 'var(--text-secondary)' },
    danger: { background: 'var(--danger)', color: '#ffffff' },
    ghost: { background: 'var(--bg-hover)', color: 'var(--text-primary)' },
    outline: { background: 'var(--bg-hover)', borderColor: 'var(--text-secondary)' },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { height: '32px', padding: '0 12px', fontSize: '0.78rem' },
    md: { height: '42px', padding: '0 20px', fontSize: '0.875rem' },
    lg: { height: '52px', padding: '0 32px', fontSize: '0.95rem' },
  };

  const computedStyle: React.CSSProperties = {
    ...baseStyle,
    ...variantStyles[variant],
    ...(hovered && isInteractive ? hoverStyles[variant] : {}),
    ...sizeStyles[size],
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.6 : 1,
    ...propStyle,
  };

  return (
    <button
      style={computedStyle}
      disabled={disabled || loading}
      className={className}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
      {...props}
    >
      {loading ? (
        <span style={{ animation: 'spin 0.7s linear infinite' }}>⟳</span>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
};

export default Button;
