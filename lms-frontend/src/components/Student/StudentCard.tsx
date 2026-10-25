import React from 'react';

interface StudentCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  borderLeft?: string;
  title?: string;
  icon?: string;
  actions?: React.ReactNode;
}

export const StudentCard: React.FC<StudentCardProps> = ({ children, style, className, borderLeft, title, icon, actions }) => {
  const baseStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    overflow: "hidden",
    ...(borderLeft ? { borderLeft: `6px solid ${borderLeft}` } : {}),
    ...style
  };

  return (
    <div className={`card shadow-sm ${className || ''}`} style={baseStyle}>
      {(title || actions) && (
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '0.75rem',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {icon && <i className={`fas ${icon}`} style={{ color: 'var(--accent)', fontSize: '1.1rem' }}></i>}
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          </div>
          <div className="card-actions">
            {actions}
          </div>
        </div>
      )}
      <div className="card-body p-0">
        {children}
      </div>
    </div>
  );
};
