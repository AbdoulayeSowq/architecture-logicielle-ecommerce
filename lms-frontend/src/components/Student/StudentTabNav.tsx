import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface StudentTabNavProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: any) => void;
  className?: string;
}

export const StudentTabNav: React.FC<StudentTabNavProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={`card-header p-0 border-0 ${className || ''}`} style={{ background: "rgba(255,255,255,0.03)" }}>
      <ul className="nav nav-pills p-2" style={{ gap: "8px" }}>
        {tabs.map(tab => (
          <li className="nav-item flex-fill flex-md-initial" key={tab.id}>
            <button 
              className={`nav-link w-100 px-4 py-2 ${activeTab === tab.id ? 'active shadow-sm' : ''}`}
              style={{ 
                borderRadius: "10px", 
                fontWeight: 600, 
                background: activeTab === tab.id ? "var(--accent)" : "transparent",
                color: activeTab === tab.id ? "white" : "var(--text-secondary)",
                border: "1px solid",
                borderColor: activeTab === tab.id ? "var(--accent)" : "transparent",
                transition: "all 0.2s ease"
              }}
              onClick={() => onChange(tab.id)}
            >
              {tab.icon && <i className={`fas ${tab.icon} mr-2`}></i>}
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
