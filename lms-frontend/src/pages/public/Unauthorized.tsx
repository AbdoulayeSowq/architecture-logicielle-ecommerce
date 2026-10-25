import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 p-4" style={{ background: 'var(--bg-base)' }}>
            <div className="card p-5 text-center shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxWidth: '420px', width: '100%', borderRadius: '12px' }}>
                <div className="d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '64px', height: '64px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <i className="fas fa-shield-alt text-danger" style={{ fontSize: '1.75rem' }} />
                </div>
                <div className="mb-2">
                    <span className="text-danger font-weight-bold" style={{ fontSize: '4rem', lineHeight: 1, fontFamily: "'Courier New', monospace" }}>401</span>
                </div>
                <h1 className="font-weight-bold mb-3" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Accès refusé</h1>
                <p className="mb-4 pb-2" style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>Vous n'avez pas les permissions requises pour accéder à cette ressource.</p>
                <button className="btn btn-outline-danger font-weight-bold py-2 px-4 rounded" onClick={() => navigate('/login')}>
                    <i className="fas fa-sign-in-alt mr-2" /> Se connecter
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;