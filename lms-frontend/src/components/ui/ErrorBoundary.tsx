import React, { Component, ErrorInfo } from 'react';
import Button from './Button';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <ErrorState
                    title="Une erreur inattendue est survenue"
                    description={this.state.error?.message}
                    onRetry={this.handleRetry}
                />
            );
        }
        return this.props.children;
    }
}

export const ErrorState: React.FC<{
    title?: string;
    description?: string;
    onRetry?: () => void;
}> = ({
    title = 'Erreur de chargement',
    description = 'Impossible de charger les donnees. Verifiez votre connexion.',
    onRetry,
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
            background: 'rgba(220,38,38,.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
        }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.5rem', color: 'var(--danger)' }} />
        </div>
        <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '0 0 .5rem', fontSize: '1.05rem' }}>
            {title}
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', margin: '0 0 1.25rem', maxWidth: 400 }}>
            {description}
        </p>
        {onRetry && (
            <Button onClick={onRetry} size="sm" leftIcon={<i className="fas fa-redo" style={{ fontSize: '.75rem' }} />}>
                Réessayer
            </Button>
        )}
    </div>
);

export default ErrorBoundary;
