import React from 'react';

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ animation: 'pageIn 0.15s ease-out' }}>
        {children}
    </div>
);

export default PageTransition;
