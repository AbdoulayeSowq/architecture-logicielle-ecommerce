import React from 'react';

interface ConfirmModalProps {
    show: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    show,
    title = 'Confirmation',
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
}) => {
    if (!show) return null;

    const accentColor = danger ? 'var(--danger)' : 'var(--accent)';

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,.4)',
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn .15s ease',
        }} onClick={onCancel}>
            <div
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '1.75rem',
                    width: '100%',
                    maxWidth: 420,
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'slideUp .2s ease',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: danger ? 'rgba(220,38,38,.08)' : 'var(--accent-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <i className={`fas ${danger ? 'fa-trash-alt' : 'fa-question-circle'}`}
                           style={{ color: accentColor, fontSize: '1rem' }} />
                    </div>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem' }}>
                        {title}
                    </h4>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                    {message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            padding: '.5rem 1rem',
                            fontSize: '.85rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            background: accentColor,
                            border: 'none',
                            borderRadius: 'var(--radius)',
                            padding: '.5rem 1rem',
                            fontSize: '.85rem',
                            fontWeight: 600,
                            color: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '.4rem',
                        }}
                    >
                        {loading && <i className="fas fa-spinner fa-spin" style={{ fontSize: '.75rem' }} />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
