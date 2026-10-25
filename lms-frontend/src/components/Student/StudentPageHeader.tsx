import React from 'react';

interface StudentPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export const StudentPageHeader: React.FC<StudentPageHeaderProps> = ({ title, subtitle, icon, children, onBack, actions }) => {
  return (
    <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {onBack && (
          <button 
            onClick={onBack}
            style={{ 
              width: '40px', height: '40px', borderRadius: '12px', 
              border: '1px solid var(--border)', background: 'var(--bg-card)', 
              color: 'var(--text-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {icon && <i className={`fas ${icon}`} style={{ color: 'var(--accent)', fontSize: '1.5rem' }}></i>}
            {title}
          </h1>
          {subtitle && <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {actions}
        {children}
      </div>
    </div>
  );
};
