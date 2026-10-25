import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 p-4" style={{ background: 'var(--bg-base)' }}>
            <div className="card p-5 text-center shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxWidth: '440px', width: '100%', borderRadius: '12px' }}>
                <div className="d-flex align-items-baseline justify-content-center mb-4" style={{ gap: '4px' }}>
                    <span className="font-weight-bold text-primary" style={{ fontSize: '5rem', lineHeight: 1, fontFamily: "'Courier New', monospace" }}>404</span>
                    <span className="text-primary blink-cursor" style={{ fontSize: '4rem', lineHeight: 1, fontFamily: "'Courier New', monospace" }}>_</span>
                </div>
                <h1 className="font-weight-bold mb-3" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Page introuvable</h1>
                <p className="mb-4 pb-2" style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>La ressource demandée n'existe pas ou a été supprimée.</p>
                <div className="d-flex justify-content-center" style={{ gap: '0.75rem' }}>
                    <button className="btn btn-primary font-weight-bold py-2 px-4 rounded d-flex align-items-center" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left mr-2" /> Retour
                    </button>
                    <button className="btn btn-outline-secondary font-weight-bold py-2 px-4 rounded d-flex align-items-center" onClick={() => navigate('/login')}>
                        <i className="fas fa-home mr-2" /> Accueil
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                .blink-cursor {
                    animation: blink 1s step-end infinite;
                }
            `}</style>
        </div>
    );
};

export default NotFound;