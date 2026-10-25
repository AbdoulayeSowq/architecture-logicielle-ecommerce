import React from 'react';

interface Skill {
    subject: string;
    value: number;
    fullMark: number;
}

interface RadarChartProps {
    data: Skill[];
    size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, size = 300 }) => {
    const padding = 65; // Increased padding for labels
    const center = size / 2;
    const radius = (size - padding * 2) / 2;
    const angleStep = (Math.PI * 2) / data.length;

    // Helper to get coordinates
    const getPoint = (value: number, angle: number) => {
        const r = (value / 100) * radius;
        return {
            x: center + r * Math.cos(angle - Math.PI / 2),
            y: center + r * Math.sin(angle - Math.PI / 2)
        };
    };

    // Background polygons (axis)
    const axisPolygons = [0.2, 0.4, 0.6, 0.8, 1.0].map(level => {
        return data.map((_, i) => {
            const p = getPoint(level * 100, i * angleStep);
            return `${p.x},${p.y}`;
        }).join(' ');
    });

    // Data polygon
    const dataPoints = data.map((d, i) => {
        const p = getPoint(d.value, i * angleStep);
        return `${p.x},${p.y}`;
    }).join(' ');

    return (
        <div className="radar-chart-container" style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
            <svg width={size} height={size}>
                {/* Background circles/polygons */}
                {axisPolygons.map((points, i) => (
                    <polygon
                        key={i}
                        points={points}
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="1"
                        opacity={0.5}
                    />
                ))}

                {/* Axis lines */}
                {data.map((_, i) => {
                    const p = getPoint(100, i * angleStep);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={p.x}
                            y2={p.y}
                            stroke="var(--border)"
                            strokeWidth="1"
                            opacity={0.3}
                        />
                    );
                })}

                {/* Data area */}
                <polygon
                    points={dataPoints}
                    fill="var(--accent)"
                    fillOpacity={0.15}
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {data.map((d, i) => {
                    const p = getPoint(d.value, i * angleStep);
                    return (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="4"
                            fill="var(--accent)"
                            stroke="#fff"
                            strokeWidth="2"
                        />
                    );
                })}

                {/* Labels */}
                {data.map((d, i) => {
                    const angle = i * angleStep;
                    const p = getPoint(120, angle);
                    
                    // Smart anchoring
                    let anchor = 'middle';
                    if (p.x < center - 20) anchor = 'end';
                    else if (p.x > center + 20) anchor = 'start';

                    return (
                        <text
                            key={i}
                            x={p.x}
                            y={p.y + 4}
                            textAnchor={anchor}
                            fontSize="11"
                            fontWeight="800"
                            fill="var(--text-secondary)"
                            style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                            {d.subject}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};
