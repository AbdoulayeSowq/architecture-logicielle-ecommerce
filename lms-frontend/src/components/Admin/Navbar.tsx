import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import NotificationBell from "../NotificationBell";
import { useTheme } from "../../services/ThemeContext";
import keycloak from "../../services/keycloak";
import Avatar from "../ui/Avatar";
import { useMeeting } from "../../context/MeetingContext";
import { useAuth } from "../../services/AuthContext";

const ROLE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    CHEF_DEPT:   { label: 'Chef de Département',    color: '#3b82f6', icon: 'fa-building' },
    RESP_PEDAGO: { label: 'Responsable Pédagogique', color: 'var(--accent)', icon: 'fa-chalkboard-teacher' },
    SCOLARITE:   { label: 'Scolarité',               color: '#f59e0b', icon: 'fa-university' },
    ADMIN:       { label: 'Administrateur',           color: '#8b5cf6', icon: 'fa-shield-alt' },
};

const Navbar = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const { theme, toggleTheme } = useTheme();
    const { isConnected, activeMeeting } = useMeeting();
    const { role, switchRole } = useAuth();
    const activeRole = role || localStorage.getItem('role') || 'ADMIN';
    const roleInfo = ROLE_LABELS[activeRole] || ROLE_LABELS['ADMIN'];
    const canSwitchToLecturer = ['CHEF_DEPT', 'RESP_PEDAGO'].includes(activeRole);
    const allRoles = JSON.parse(localStorage.getItem('allRoles') || '[]');
    const hasChefDeptRole = allRoles.some((r: string) => r.includes("CHEF_DEPT") || r.includes("ROLE_CHEF_DEPT"));
    const hasRespPedagoRole = allRoles.some((r: string) => r.includes("RESP_PEDAGO") || r.includes("ROLE_RESP_PEDAGO"));

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUsername(parsed.username || parsed.sub || 'Admin');
        }
    }, []);

    const handleSignOut = () => {
        localStorage.clear();
        sessionStorage.clear();
        keycloak.logout({ redirectUri: window.location.origin });
    };

    return (
        <nav className="main-header navbar navbar-expand" style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            padding: '0.75rem 1.5rem',
            marginLeft: 'var(--sidebar-w)',
            transition: 'var(--t)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <ul className="navbar-nav" />

            <ul className="navbar-nav ml-auto" style={{ alignItems: 'center', gap: '1rem' }}>
                {isConnected && activeMeeting && (
                    <li className="nav-item mr-2">
                        <style>{`
                            @keyframes pulseBluePill {
                                0% { transform: scale(0.9); opacity: 0.6; }
                                50% { transform: scale(1.15); opacity: 1; }
                                100% { transform: scale(0.9); opacity: 0.6; }
                            }
                        `}</style>
                        <Link
                            to={`/meeting?token=${localStorage.getItem('meeting_token') || ''}&url=${localStorage.getItem('meeting_url') || ''}&room=${activeMeeting.roomName}&isHost=${activeMeeting.isHost}&meetingId=${activeMeeting.meetingId}&title=${encodeURIComponent(activeMeeting.title)}`}
                            className="btn d-flex align-items-center"
                            style={{
                                background: 'rgba(59, 130, 246, 0.12)',
                                color: '#3b82f6',
                                border: '1.5px solid rgba(59, 130, 246, 0.35)',
                                borderRadius: '24px',
                                padding: '0.45rem 0.9rem',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                gap: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                boxShadow: '0 0 10px rgba(59, 130, 246, 0.15)',
                                textDecoration: 'none'
                            }}
                        >
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#3b82f6',
                                display: 'inline-block',
                                boxShadow: '0 0 8px #3b82f6',
                                animation: 'pulseBluePill 1.4s infinite'
                            }} />
                            <i className="fas fa-phone-alt"></i>
                            <span className="d-none d-md-inline" style={{ fontSize: '0.8rem' }}>Retour à l'appel</span>
                        </Link>
                    </li>
                )}

                <li className="nav-item">
                    <button 
                        onClick={toggleTheme} 
                        style={{ 
                            background: 'var(--bg-base)', 
                            border: '1px solid var(--border)', 
                            borderRadius: '10px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'var(--t)'
                        }}
                    >
                        {theme === 'light' ? <i className="fas fa-moon" /> : <i className="fas fa-sun text-warning" />}
                    </button>
                </li>

                <li className="nav-item">
                    <NotificationBell userId={username} />
                </li>

                <li className="nav-item dropdown">
                    <a className="nav-link p-0 d-flex align-items-center" data-toggle="dropdown" href="#">
                        <div className="admin-avatar">
                            <Avatar name={username || "Admin"} size={40} />
                        </div>
                    </a>
                    <div className="dropdown-menu dropdown-menu-right shadow-lg border-0 mt-2" style={{ background: 'var(--bg-card)', borderRadius: '12px', minWidth: '220px' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{username}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.3px',
                                    color: roleInfo.color,
                                    background: `${roleInfo.color}18`,
                                    border: `1px solid ${roleInfo.color}40`,
                                    borderRadius: '20px', padding: '2px 10px'
                                }}>
                                    <i className={`fas ${roleInfo.icon}`} style={{ fontSize: '0.68rem' }} />
                                    {roleInfo.label}
                                </span>
                            </div>
                        </div>
                        <div className="p-2">
                            {activeRole === 'LECTURER' && (hasChefDeptRole || hasRespPedagoRole) && (
                                <>
                                    {hasChefDeptRole && (
                                        <button
                                            className="dropdown-item d-flex align-items-center font-weight-bold"
                                            onClick={() => { switchRole('CHEF_DEPT'); navigate('/admin/university/department'); }}
                                            style={{ gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#3b82f6' }}
                                        >
                                            <i className="fas fa-exchange-alt" style={{ color: '#3b82f6' }}></i>
                                            Espace Chef Dépt
                                        </button>
                                    )}
                                    {hasRespPedagoRole && (
                                        <button
                                            className="dropdown-item d-flex align-items-center font-weight-bold"
                                            onClick={() => { switchRole('RESP_PEDAGO'); navigate('/admin/university/class'); }}
                                            style={{ gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--accent)' }}
                                        >
                                            <i className="fas fa-exchange-alt" style={{ color: 'var(--accent)' }}></i>
                                            Espace Resp. Pédago
                                        </button>
                                    )}
                                    <div className="dropdown-divider mx-2" style={{ borderColor: 'var(--border)' }}></div>
                                </>
                            )}
                            {canSwitchToLecturer && (
                                <>
                                    <button
                                        className="dropdown-item d-flex align-items-center font-weight-bold"
                                        onClick={() => { switchRole('LECTURER'); navigate('/lecturer'); }}
                                        style={{ gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--accent)' }}
                                    >
                                        <i className="fas fa-exchange-alt" style={{ color: 'var(--accent)' }}></i>
                                        Espace Enseignant
                                    </button>
                                    <div className="dropdown-divider mx-2" style={{ borderColor: 'var(--border)' }}></div>
                                </>
                            )}
                            {activeRole === 'ADMIN' && (
                                <button className="dropdown-item d-flex align-items-center" onClick={() => navigate("/admin/settings")}
                                        style={{ gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                    <i className="fas fa-cog text-muted"></i> Paramètres
                                </button>
                            )}
                            <div className="dropdown-divider mx-2" style={{ borderColor: 'var(--border)' }}></div>
                            <button className="dropdown-item d-flex align-items-center text-danger font-weight-bold" onClick={handleSignOut}
                                    style={{ gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                <i className="fas fa-sign-out-alt"></i> Déconnexion
                            </button>
                        </div>
                    </div>
                </li>
            </ul>
            <style>{`
                .admin-avatar:hover {
                    border-color: var(--accent);
                    background: var(--accent-light);
                }
                .dropdown-item:hover {
                    background: var(--bg-hover) !important;
                }
            `}</style>
        </nav>
    );
}

export default Navbar;