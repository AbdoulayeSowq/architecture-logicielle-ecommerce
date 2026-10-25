import React, { useEffect } from 'react';

const FocusLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        // Cacher la barre latérale AdminLTE si elle est présente
        document.body.classList.add('sidebar-collapse');
        document.body.classList.remove('sidebar-open');
        
        // S'assurer que le body n'a pas de padding/margin bizarre
        const originalStyle = document.body.style.overflow;
        // document.body.style.overflow = 'hidden'; // Optionnel: empêche le scroll du body entier
        
        return () => {
            document.body.classList.remove('sidebar-collapse');
            document.body.style.overflow = originalStyle;
        };
    }, []);

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'var(--bg-main)', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            overflowY: 'auto'
        }}>
            <div style={{ flex: 1, position: 'relative' }}>
                {children}
            </div>
        </div>
    );
};

export default FocusLayout;
