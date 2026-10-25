import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getGamificationProfile, recordLoginStreak } from "../../services/api/gamification";
import { getStudentDetailsByUsername } from "../../services/api/user";
import NotificationBell from "../NotificationBell";
import UnreadBadge from "../UnreadBadge";
import { useTheme } from "../../services/ThemeContext";
import keycloak from "../../services/keycloak";
import Avatar from "../ui/Avatar";
import { useMeeting } from "../../context/MeetingContext";

const Navbar = () => {
    const [username, setUsername] = useState("");
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [streak, setStreak] = useState(0);
    const [fullName, setFullName] = useState("");
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
                const details = await getStudentDetailsByUsername(uname);
                if (details) {
                    const fName = details.firstName || '';
                    const lName = (details.lastName || '').toUpperCase();
                    setFullName(`${fName} ${lName}`.trim() || uname);
                } else {
                    setFullName(uname);
                }

                await recordLoginStreak(uname);
                const profile = await getGamificationProfile(uname);
                if (profile) {
                    setLevel(profile.level);
                    setXp(profile.xpPoints);
                    setStreak(profile.currentStreak);
                }
            } catch (err) {
                console.error("Erreur gamification/details", err);
                setFullName(uname);
            }
        }
    };

    const handleSignOut = () => {
        localStorage.clear();
        sessionStorage.clear();
        keycloak.logout({ redirectUri: window.location.origin });
    };

    const onClickProfile = () => {
        navigate("/student/profile");
    }

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
            zIndex: 1030
        }}>
            <div className="container-fluid">
                <Link to={"/student"} className="navbar-brand d-flex align-items-center mr-5" style={{ gap: '12px' }}>
                    <img src="/dist/img/main-logo.png" alt="LMS Logo" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '1px' }}>
                        EPT
                    </span>
                </Link>

                <button className="navbar-toggler border-0" type="button" data-toggle="collapse" data-target="#navbarCollapse">
                    <i className="fas fa-bars" style={{ color: 'var(--text-primary)' }}></i>
                </button>

                <div className="collapse navbar-collapse order-3" id="navbarCollapse">
                    <ul className="navbar-nav mx-auto" style={{ gap: '0.5rem' }}>
                         <li className="nav-item">
                            <Link to={"/student"} style={navLinkStyle("/student")} className="nav-link-custom">
                                <i className="fas fa-home"></i> Accueil
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/student/timetable"} style={navLinkStyle("/student/timetable")} className="nav-link-custom">
                                <i className="fas fa-calendar-alt"></i> Planning
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/student/messages"} style={{ ...navLinkStyle("/student/messages"), position: 'relative' }} className="nav-link-custom">
                                <i className="fas fa-envelope"></i> Messages
                                <UnreadBadge username={username} style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '0.6rem' }} />
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/student/announcements"} style={navLinkStyle("/student/announcements")} className="nav-link-custom">
                                <i className="fas fa-bullhorn"></i> Annonces
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/student/practice"} style={navLinkStyle("/student/practice")} className="nav-link-custom">
                                <i className="fas fa-code"></i> Practice
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/student/grades"} style={navLinkStyle("/student/grades")} className="nav-link-custom">
                                <i className="fas fa-star"></i> Notes
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/student/mentorship"} style={navLinkStyle("/student/mentorship")} className="nav-link-custom">
                                <i className="fas fa-hands-helping"></i> Mentorat
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/student/certificates"} style={navLinkStyle("/student/certificates")} className="nav-link-custom">
                                <i className="fas fa-graduation-cap"></i> Certificats
                            </Link>
                        </li>
                    </ul>

                    {/* Search Bar */}
                    <div className="d-none d-xl-flex align-items-center ml-3 mr-4">
                        <div className="input-group" style={{
                            background: 'var(--bg-base)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            width: '180px',
                            transition: 'all 0.3s ease'
                        }}>
                            <div className="input-group-prepend">
                                <span className="input-group-text border-0 bg-transparent" style={{ color: 'var(--text-secondary)' }}>
                                    <i className="fas fa-search" style={{ fontSize: '0.85rem' }}></i>
                                </span>
                            </div>
                            <input className="form-control shadow-none border-0" 
                                   style={{ background: 'transparent', fontSize: '0.85rem', color: 'var(--text-primary)', height: '38px', paddingLeft: 0 }} 
                                   type="search" placeholder="Rechercher un cours..."/>
                        </div>
                    </div>
                </div>

                <ul className="order-1 order-md-3 navbar-nav navbar-no-expand ml-auto d-flex align-items-center" style={{ gap: '1rem' }}>
                    
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
                            className="btn btn-link nav-link p-2" 
                            onClick={toggleTheme} 
                            style={{ 
                                color: 'var(--text-secondary)', 
                                background: 'var(--bg-base)', 
                                borderRadius: '10px',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--border)'
                            }}
                        >
                            {theme === 'light' ? <i className="fas fa-moon" /> : <i className="fas fa-sun text-warning" />}
                        </button>
                    </li>

                    <li className="nav-item">
                        <NotificationBell userId={username} />
                    </li>

                    <li className="nav-item d-none d-sm-block">
                        <div style={{ 
                            background: 'rgba(255, 175, 0, 0.1)', 
                            color: '#ffaf00',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: '1px solid rgba(255, 175, 0, 0.2)'
                        }}>
                            <i className="fas fa-fire"></i> {streak}
                        </div>
                    </li>

                    <li className="nav-item dropdown ml-2">
                        <a className="nav-link p-0 d-flex align-items-center" data-toggle="dropdown" href="#">
                            <div className="user-avatar-wrap">
                                <Avatar name={fullName || username || "Étudiant"} size={42} />
                            </div>
                        </a>
                        <div className="dropdown-menu dropdown-menu-right shadow-lg border-0 mt-2" style={{ background: 'var(--bg-card)', borderRadius: '12px', minWidth: '240px', overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
                                    {fullName}
                                </div>
                                <div className="text-muted small mt-1">Étudiant EPT</div>
                            </div>
                            <div className="p-2">
                                <button className="dropdown-item d-flex align-items-center py-2 px-3 mb-1" onClick={onClickProfile} 
                                        style={{ gap: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>
                                    <i className="fas fa-user-circle text-primary" style={{ width: '20px' }}></i> Mon Profil
                                </button>
                                <button className="dropdown-item d-flex align-items-center py-2 px-3 mb-1" onClick={() => navigate("/student/analytics")} 
                                        style={{ gap: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>
                                    <i className="fas fa-chart-line text-primary" style={{ width: '20px' }}></i> Statistiques
                                </button>
                                <div className="dropdown-divider mx-2" style={{ borderColor: 'var(--border)' }}></div>
                                <button className="dropdown-item d-flex align-items-center py-2 px-3 text-danger font-weight-bold" onClick={handleSignOut}
                                        style={{ gap: '0.75rem', borderRadius: '8px' }}>
                                    <i className="fas fa-sign-out-alt" style={{ width: '20px' }}></i> Déconnexion
                                </button>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
            <style>{`
                .nav-link-custom {
                    transition: all 0.2s ease;
                }
                .nav-link-custom:hover {
                    background: var(--btn-soft-bg) !important;
                    color: var(--btn-soft-text) !important;
                    transform: translateY(-1px);
                }
                .user-avatar-wrap:hover {
                    border-color: var(--btn-soft-text) !important;
                    transform: scale(1.05);
                }
                .dropdown-item {
                    transition: all 0.15s ease;
                }
                .dropdown-item:hover {
                    background: var(--bg-hover) !important;
                    transform: translateX(4px);
                }
                .navbar-toggler:focus {
                    box-shadow: none;
                }
                @media (max-width: 991.98px) {
                    .navbar-collapse {
                        background: var(--bg-card);
                        margin-top: 1rem;
                        padding: 1rem;
                        border-radius: 12px;
                        border: 1px solid var(--border);
                        box-shadow: var(--shadow-lg);
                    }
                }
            `}</style>
        </nav>
    );
}

export default Navbar;