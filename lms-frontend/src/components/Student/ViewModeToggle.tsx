import React from 'react';

interface ViewModeToggleProps {
  viewMode: 'PAGINATED' | 'SCROLLING';
  onChange: (mode: 'PAGINATED' | 'SCROLLING') => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onChange }) => {
  return (
    <div className="d-flex" style={{ gap: '0.5rem' }}>
      <button
        className={`btn btn-sm font-weight-bold px-3 ${viewMode === 'PAGINATED' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onChange('PAGINATED')}
        style={{ borderRadius: '8px' }}
      >
        <i className="fas fa-step-forward mr-2" /> Pas à pas
      </button>
      <button
        className={`btn btn-sm font-weight-bold px-3 ${viewMode === 'SCROLLING' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onChange('SCROLLING')}
        style={{ borderRadius: '8px' }}
      >
        <i className="fas fa-list mr-2" /> Liste
      </button>
    </div>
  );
};
