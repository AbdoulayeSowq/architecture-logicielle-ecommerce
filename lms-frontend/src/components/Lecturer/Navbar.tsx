import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getLecturerDetailsByUsername } from "../../services/api/user";
import NotificationBell from "../NotificationBell";
import UnreadBadge from "../UnreadBadge";
import { useTheme } from "../../services/ThemeContext";
import keycloak from "../../services/keycloak";
import Avatar from "../ui/Avatar";
import { useMeeting } from "../../context/MeetingContext";
import { useAuth } from "../../services/AuthContext";

const Navbar = () => {
    const { switchRole, role } = useAuth();
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [supervisedClass, setSupervisedClass] = useState("");
    const [supervisedDept, setSupervisedDept] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { isConnected, activeMeeting } = useMeeting();

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const user = JSON.parse(stored);
            const uname = user.username || user.email || '';
            setUsername(uname);
            try {
                const details = await getLecturerDetailsByUsername(uname);
                if (details) {
                    const fName = details.firstName || '';
                    const lName = (details.lastName || '').toUpperCase();
                    setFullName(`${fName} ${lName}`.trim() || uname);
                    setSupervisedClass(details.supervisedClassName || "");
                    setSupervisedDept(details.supervisedDepartmentCode || "");
                } else {
                    setFullName(uname);
                }
            } catch (err) {
                setFullName(uname);
            }
        }
    };

    const handleSignOut = () => {
        localStorage.clear();
        sessionStorage.clear();
        keycloak.logout({ redirectUri: window.location.origin });
    };

    const isActive = (path: string) => location.pathname === path;

    const navLinkStyle = (path: string) => ({
        color: isActive(path) ? 'var(--btn-soft-text)' : 'var(--text-secondary)',
        fontWeight: isActive(path) ? 600 : 500,
        padding: '0.4rem 0.8rem',
        borderRadius: 'var(--radius)',
        transition: 'var(--t)',
        background: isActive(path) ? 'var(--btn-soft-bg)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        textDecoration: 'none',
        fontSize: '0.85rem'
    });

    return (
        <nav className="main-header navbar navbar-expand-xl" style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '0.75rem 1.5rem',
            marginLeft: 0,
            position: 'sticky',
            top: 0,
            zIndex: 1041
        }}>
            <div className="container-fluid">
                <Link to={"/lecturer"} className="navbar-brand d-flex align-items-center mr-5" style={{ gap: '12px' }}>
                    <img src="/dist/img/main-logo.png" alt="LMS Logo" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '1px' }}>
                        EPT
                    </span>
                </Link>

                <button
                    className="navbar-toggler border-0 d-xl-none"
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{ padding: '8px' }}
                    aria-label="Menu"
                >
                    <i className="fas fa-bars" style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}></i>
                </button>

                <div className={`navbar-collapse order-3 ${mobileMenuOpen ? 'show' : ''}`} id="navbarCollapse"
                    style={{
                        position: mobileMenuOpen ? 'absolute' : 'relative',
                        top: mobileMenuOpen ? '100%' : 'auto',
                        left: 0,
                        right: 0,
                        background: 'var(--bg-card)',
                        padding: mobileMenuOpen ? '1rem' : '0',
                        borderTop: mobileMenuOpen ? '1px solid var(--border)' : 'none',
                        zIndex: 1029,
                    }}>
                    <ul className="navbar-nav mx-auto" style={{ gap: '0.5rem', flexDirection: mobileMenuOpen ? 'column' : 'row' }}>
                        <li className="nav-item">
                            <Link to={"/lecturer"} style={navLinkStyle("/lecturer")} className="nav-link-custom">
                                <i className="fas fa-home"></i> Accueil
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/lecturer/messages"} style={{ ...navLinkStyle("/lecturer/messages"), position: 'relative' }} className="nav-link-custom">
                                <i className="fas fa-envelope"></i> Messages
                                <UnreadBadge username={username} style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '0.6rem' }} />
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/lecturer/announcements"} style={navLinkStyle("/lecturer/announcements")} className="nav-link-custom">
                                <i className="fas fa-bullhorn"></i> Annonces
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/lecturer/mentorship"} style={navLinkStyle("/lecturer/mentorship")} className="nav-link-custom">
                                <i className="fas fa-hands-helping"></i> Mentorat
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/lecturer/at-risk"} style={navLinkStyle("/lecturer/at-risk")} className="nav-link-custom text-warning">
                                <i className="fas fa-exclamation-triangle"></i> Risques
                            </Link>
                        </li>
                        {role === "CHEF_DEPT" && supervisedDept && (
                            <li className="nav-item">
                                <Link to={`/admin/university/department`} style={navLinkStyle("/admin/university/department")} className="nav-link-custom text-info">
                                    <i className="fas fa-university"></i> Dépt. {supervisedDept.toUpperCase()}
                                </Link>
                            </li>
                        )}
                        {role === "RESP_PEDAGO" && supervisedClass && (
                            <li className="nav-item">
                                <Link to={`/admin/university/class`} style={navLinkStyle("/admin/university/class")} className="nav-link-custom text-primary">
                                    <i className="fas fa-graduation-cap"></i> Classe ({supervisedClass.toUpperCase()})
                                </Link>
                            </li>
                        )}
                    </ul>

                    <ul className="navbar-nav ml-auto align-items-center" style={{ gap: '1rem' }}>
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
                                    width: '38px',
                                    height: '38px',
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
                                <div className="user-avatar-wrap">
                                    <Avatar name={fullName || username || "Enseignant"} size={38} />
                                </div>
                            </a>
                            <div className="dropdown-menu dropdown-menu-right shadow-lg border-0 mt-2" style={{ background: 'var(--bg-card)', borderRadius: '12px', minWidth: '220px' }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{fullName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {role === "CHEF_DEPT" ? `Chef du Département ${supervisedDept.toUpperCase()}` : 
                                         role === "RESP_PEDAGO" ? `Responsable Pédagogique ${supervisedClass.toUpperCase()}` : 
                                         "Enseignant"}
                                    </div>
                                </div>
                                <div className="p-2">
                                    <button className="dropdown-item d-flex align-items-center" onClick={() => navigate("/lecturer/profile")} 
                                            style={{ gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                        <i className="fas fa-user-circle text-muted"></i> Mon Profil
                                    </button>

                                    {/* Action de Bascule Dynamique de Rôle de pilotage */}
                                    {JSON.parse(localStorage.getItem('allRoles') || '[]').some((r: string) => r.includes("CHEF_DEPT") || r.includes("ROLE_CHEF_DEPT")) && (
                                        <button className="dropdown-item d-flex align-items-center text-info font-weight-bold"
                                                onClick={() => {
                                                    const target = role === "CHEF_DEPT" ? "LECTURER" : "CHEF_DEPT";
                                                    switchRole(target);
                                                    navigate(target === "CHEF_DEPT" ? "/admin/university/department" : "/lecturer");
                                                }}
                                                style={{ gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                            <i className="fas fa-exchange-alt"></i> {role === "CHEF_DEPT" ? "Passer en vue Enseignant" : "Passer en vue Chef Dept"}
                                        </button>
                                    )}

                                    {JSON.parse(localStorage.getItem('allRoles') || '[]').some((r: string) => r.includes("RESP_PEDAGO") || r.includes("ROLE_RESP_PEDAGO")) && (
                                        <button className="dropdown-item d-flex align-items-center text-primary font-weight-bold"
                                                onClick={() => {
                                                    const target = role === "RESP_PEDAGO" ? "LECTURER" : "RESP_PEDAGO";
                                                    switchRole(target);
                                                    navigate(target === "RESP_PEDAGO" ? "/admin/university/class" : "/lecturer");
                                                }}
                                                style={{ gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                            <i className="fas fa-exchange-alt"></i> {role === "RESP_PEDAGO" ? "Passer en vue Enseignant" : "Passer en vue Resp. Pédago"}
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
                </div>
            </div>
            <style>{`
                .nav-link-custom:hover {
                    color: var(--btn-soft-text) !important;
                    background: var(--btn-soft-bg) !important;
                }
                .user-avatar-wrap:hover {
                    border-color: var(--accent);
                }
                .dropdown-item:hover {
                    background: var(--bg-hover) !important;
                }
            `}</style>
        </nav>
    );
}

export default Navbar;