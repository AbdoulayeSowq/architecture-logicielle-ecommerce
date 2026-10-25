import React from 'react';
import Button from './Button';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'fa-inbox',
    title,
    description,
    actionLabel,
    onAction,
}) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
    }}>
        <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--accent-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
        }}>
            <i className={`fas ${icon}`} style={{ fontSize: '1.5rem', color: 'var(--accent)' }} />
        </div>
        <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '0 0 .5rem', fontSize: '1.05rem' }}>
            {title}
        </h4>
        {description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', margin: '0 0 1.25rem', maxWidth: 360 }}>
                {description}
            </p>
        )}
        {actionLabel && onAction && (
            <Button onClick={onAction} size="sm">
                {actionLabel}
            </Button>
        )}
    </div>
);

export default EmptyState;
