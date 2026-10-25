import React, { useEffect, useState } from "react";
import { getLeaderboard } from "../../../services/api/gamification";
import PageLoading from "../../../components/Admin/PageLoading";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";

const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

const LVL_NAMES: Record<number, string> = {
    1: 'Novice', 2: 'Apprenti', 3: 'Étudiant', 4: 'Avancé',
    5: 'Expert', 6: 'Maître', 7: 'Élite', 8: 'Légende',
};
const getLevelName = (lvl: number) => LVL_NAMES[lvl] || `Niveau ${lvl}`;

const Leaderboard = () => {
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setCurrentUser(JSON.parse(stored).username || '');
        getLeaderboard()
            .then(data => setPlayers(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <PageLoading />;

    const top3 = players.slice(0, 3);
    const rest = players.slice(3);

    return (
        <div className="content">
            <div className="container py-4">
                <StudentPageHeader
                    title="Classement Global"
                    subtitle="Top étudiants par points XP."
                    icon="fa-trophy"
                />

                {players.length === 0 ? (
                    <div className="empty-state-box">
                        <i className="fas fa-trophy" />
                        <p>Aucun joueur classé pour le moment.</p>
                    </div>
                ) : (
                    <>
                        {/* Podium top 3 */}
                        <div className="d-flex justify-content-center align-items-end flex-wrap mb-5" style={{ gap: 16 }}>
                            {/* 2nd (left) */}
                            {top3[1] && <PodiumCard player={top3[1]} rank={2} isMe={top3[1].username === currentUser} />}
                            {/* 1st (center) */}
                            {top3[0] && <PodiumCard player={top3[0]} rank={1} isMe={top3[0].username === currentUser} />}
                            {/* 3rd (right) */}
                            {top3[2] && <PodiumCard player={top3[2]} rank={3} isMe={top3[2].username === currentUser} />}
                        </div>

                        {/* Rest of the table */}
                        {rest.length > 0 && (
                            <div className="table-card">
                                <div className="table-card__header">
                                    <span className="table-card__title">Classement complet</span>
                                </div>
                                <table className="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 48 }}>#</th>
                                            <th>Joueur</th>
                                            <th style={{ width: 100 }}>Niveau</th>
                                            <th style={{ width: 100 }}>XP</th>
                                            <th style={{ width: 80 }}>🔥 Série</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rest.map((p, i) => (
                                            <tr key={p.username} style={{ background: p.username === currentUser ? 'var(--accent-light)' : '' }}>
                                                <td className="text-muted font-weight-bold">#{i + 4}</td>
                                                <td>
                                                    <span className={p.username === currentUser ? 'font-weight-bold' : ''} style={{ color: p.username === currentUser ? 'var(--accent)' : 'inherit' }}>
                                                        {p.username}
                                                    </span>
                                                    {p.username === currentUser && <span className="badge badge-primary ml-2">Vous</span>}
                                                </td>
                                                <td className="text-muted small">Niv. {p.level} — {getLevelName(p.level)}</td>
                                                <td className="font-weight-bold" style={{ color: 'var(--accent)' }}>{p.xpPoints} XP</td>
                                                <td className="text-muted">{p.currentStreak}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const PODIUM_SIZE = { 1: { mt: 0, scale: 1 }, 2: { mt: 30, scale: 0.92 }, 3: { mt: 50, scale: 0.85 } };

const PodiumCard = ({ player, rank, isMe }: { player: any; rank: number; isMe: boolean }) => {
    const sz = PODIUM_SIZE[rank as keyof typeof PODIUM_SIZE];
    return (
        <div
            className="card text-center"
            style={{
                marginTop: sz.mt,
                width: 180,
                border: isMe ? '2px solid var(--accent)' : '1px solid var(--border)',
                transform: `scale(${sz.scale})`,
                transformOrigin: 'bottom center',
            }}
        >
            <div className="card-body p-3">
                <div style={{ fontSize: rank === 1 ? '2rem' : '1.5rem', marginBottom: 8 }}>
                    {RANK_EMOJIS[rank - 1]}
                </div>
                <div className="avatar mx-auto mb-2" style={{ fontSize: rank === 1 ? '1.25rem' : '1rem' }}>
                    <i className="fas fa-user" />
                </div>
                <p className="font-weight-bold mb-0 text-truncate" style={{ color: isMe ? 'var(--accent)' : 'var(--text-primary)', fontSize: '0.875rem' }}>
                    {player.username}
                </p>
                <p className="mb-1" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.875rem' }}>
                    {player.xpPoints} XP
                </p>
                <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                    Niv. {player.level} — {getLevelName(player.level)}
                </p>
                {player.currentStreak > 0 && (
                    <small style={{ color: 'var(--warning)' }}>🔥 {player.currentStreak} jours</small>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
