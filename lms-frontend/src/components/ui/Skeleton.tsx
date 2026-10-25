import React from 'react';

const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--bg-hover) 25%, var(--border-light) 50%, var(--bg-hover) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
    borderRadius: 'var(--radius)',
};

export const Skeleton: React.FC<{
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    style?: React.CSSProperties;
}> = ({ width = '100%', height = 16, borderRadius, style }) => (
    <div style={{ ...shimmerStyle, width, height, borderRadius: borderRadius ?? 'var(--radius)', ...style }} />
);

export const SkeletonText: React.FC<{ lines?: number; widths?: string[] }> = ({
    lines = 3,
    widths = ['100%', '85%', '60%'],
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} height={14} width={widths[i % widths.length]} />
        ))}
    </div>
);

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg, 10px)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }}
            >
                <Skeleton height={120} borderRadius="var(--radius)" />
                <Skeleton height={18} width="70%" />
                <SkeletonText lines={2} widths={['90%', '60%']} />
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <Skeleton height={28} width={80} borderRadius={14} />
                    <Skeleton height={28} width={60} borderRadius={14} />
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg, 10px)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} height={14} width="60%" />
            ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
            <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0, padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
                {Array.from({ length: cols }).map((_, c) => (
                    <Skeleton key={c} height={12} width={c === 0 ? '80%' : '50%'} />
                ))}
            </div>
        ))}
    </div>
);

export const SkeletonList: React.FC<{ count?: number; showAvatar?: boolean }> = ({ count = 5, showAvatar = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                }}
            >
                {showAvatar && <Skeleton width={40} height={40} borderRadius="50%" />}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Skeleton height={16} width="60%" />
                    <Skeleton height={12} width="40%" />
                </div>
                <Skeleton width={80} height={28} borderRadius={14} />
            </div>
        ))}
    </div>
);

export default Skeleton;
