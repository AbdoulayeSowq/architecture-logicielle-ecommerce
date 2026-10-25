import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hoverable = false, 
  onClick,
  style 
}) => {
  const baseStyle = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--t)',
    cursor: onClick ? 'pointer' : 'default',
  };

  const hoverStyle = hoverable ? {
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--shadow-md)',
    }
  } : {};

  return (
    <div
      className={`card ${className}`}
      style={{ ...baseStyle, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
