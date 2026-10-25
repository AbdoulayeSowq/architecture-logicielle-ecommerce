import React from 'react';
import { Link } from 'react-router-dom';

export interface Crumb {
    label: string;
    path?: string;
}

interface BreadcrumbsProps {
    items: Crumb[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    if (items.length === 0) return null;

    return (
        <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '.4rem',
            fontSize: '.8rem',
            fontWeight: 500,
            marginBottom: '1rem',
            flexWrap: 'wrap',
        }}>
            {items.map((item, i) => {
                const isLast = i === items.length - 1;
                return (
                    <React.Fragment key={i}>
                        {i > 0 && (
                            <i className="fas fa-chevron-right"
                               style={{ fontSize: '.55rem', color: 'var(--text-muted)' }} />
                        )}
                        {isLast || !item.path ? (
                            <span style={{ color: isLast ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                to={item.path}
                                style={{
                                    color: 'var(--accent)',
                                    textDecoration: 'none',
                                }}
                            >
                                {item.label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
