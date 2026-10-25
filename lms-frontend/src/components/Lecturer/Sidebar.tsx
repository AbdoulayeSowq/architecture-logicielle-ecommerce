import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import UnreadBadge from "../UnreadBadge";
import { getLecturerDetailsByUsername } from "../../services/api/user";

const Sidebar = ({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const user = JSON.parse(stored);
                const uname = user.username || user.email || 'Lecturer';
                setUsername(uname);
                setDisplayName(uname);
                getLecturerDetailsByUsername(uname)
                    .then(details => { if (details?.fullName) setDisplayName(details.fullName); })
                    .catch(() => {});
            } catch {
                setUsername('Lecturer');
                setDisplayName('Lecturer');
            }
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 992) {
                setCollapsed(true);
            } else {
                setCollapsed(false);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && window.innerWidth < 992 && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1039,
                    }}
                />
            )}
            <aside
                className="main-sidebar elevation-0"
                style={{
                    background: 'var(--bg-sidebar)',
                    borderRight: 'none',
                    transition: 'transform 0.3s ease',
                    position: 'fixed',
                    height: '100vh',
                    width: 'var(--sidebar-w)',
                    zIndex: 1040,
                    transform: !isOpen && window.innerWidth < 992 ? 'translateX(-100%)' : 'translateX(0)',
                }}
            >
            <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--accent)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-university" style={{ color: 'white', fontSize: '1.2rem' }}></i>
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-sidebar-active)', letterSpacing: '0.5px' }}>
                        LMS <span style={{ color: 'var(--accent)' }}>EPT</span>
                    </span>
                </div>
                {window.innerWidth < 992 && (
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-sidebar)',
                            cursor: 'pointer',
                            padding: '8px',
                            fontSize: '1rem',
                        }}
                        aria-label="Fermer le menu"
                    >
                        <i className="fas fa-times" />
                    </button>
                )}
            </div>

            <div className="sidebar" style={{ padding: '12px 0' }}>
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        <i className="fas fa-user" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-sidebar-active)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{displayName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-sidebar)', fontWeight: 500 }}>Enseignant</div>
                    </div>
                </div>

                <nav className="mt-2">
                    <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false" style={{ gap: '4px' }}>
                        
                        <li className="nav-item">
                            <NavLink to="/lecturer" end className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                                <i className="nav-icon fas fa-home"></i>
                                <p>Accueil</p>
                            </NavLink>
                        </li>

                        <li className="nav-header-custom">Interactions</li>

                        <li className="nav-item">
                            <NavLink to="/lecturer/announcements" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                                <i className="nav-icon fas fa-bullhorn"></i>
                                <p>Annonces</p>
                            </NavLink>
                        </li>

                        <li className="nav-item">
                            <NavLink to="/lecturer/messages" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                                <i className="nav-icon fas fa-envelope"></i>
                                <p>Messages</p>
                                <UnreadBadge username={username} />
                            </NavLink>
                        </li>

                        <li className="nav-item">
                            <NavLink to="/lecturer/mentorship" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                                <i className="nav-icon fas fa-hands-helping"></i>
                                <p>Mentorats</p>
                            </NavLink>
                        </li>

                        <li className="nav-header-custom">Pédagogie</li>

                        <li className="nav-item">
                            <NavLink to="/lecturer/practice" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                                <i className="nav-icon fas fa-code"></i>
                                <p>Practice</p>
                            </NavLink>
                        </li>

                        <li className="nav-header-custom">Suivi</li>

                        <li className="nav-item">
                            <NavLink to="/lecturer/at-risk" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                                <i className="nav-icon fas fa-exclamation-triangle"></i>
                                <p>Étudiants à risque</p>
                            </NavLink>
                        </li>

                        <li className="nav-header-custom">Compte</li>

                        <li className="nav-item">
                            <NavLink to="/lecturer/profile" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                                <i className="nav-icon fas fa-user-circle"></i>
                                <p>Mon Profil</p>
                            </NavLink>
                        </li>

                        <li className="nav-item" style={{ marginTop: '20px' }}>
                            <button 
                                onClick={() => {
                                    localStorage.clear();
                                    navigate("/login");
                                }}
                                className="nav-link-custom"
                                style={{ width: 'calc(100% - 24px)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <i className="nav-icon fas fa-sign-out-alt"></i>
                                <p>Déconnexion</p>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
            </aside>
            <style>{`
                .nav-link-custom {
                    margin: 2px 12px !important;
                    padding: 10px 16px !important;
                    border-radius: 12px !important;
                    color: var(--text-sidebar) !important;
                    font-size: 0.875rem !important;
                    font-weight: 500 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                    transition: all 0.2s ease !important;
                    text-decoration: none !important;
                }
                .nav-link-custom:hover {
                    background: var(--bg-sidebar-hover) !important;
                    color: var(--text-sidebar-active) !important;
                }
                .nav-link-custom.active {
                    background: var(--bg-sidebar-active) !important;
                    color: var(--text-sidebar-active) !important;
                    font-weight: 700 !important;
                }
                .nav-link-custom.active .nav-icon {
                    color: var(--text-sidebar-active) !important;
                }
                .nav-link-custom .nav-icon {
                    width: 16px !important;
                    flex-shrink: 0 !important;
                    text-align: center !important;
                    font-size: 0.9rem !important;
                    color: var(--text-sidebar) !important;
                    line-height: 1 !important;
                }
                .nav-link-custom p {
                    margin: 0 !important;
                    padding: 0 !important;
                    line-height: 1 !important;
                    font-size: 0.875rem !important;
                }
                .nav-header-custom {
                    padding: 24px 24px 8px !important;
                    font-size: 0.7rem !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 1px !important;
                    color: var(--text-sidebar) !important;
                    opacity: 0.8;
                }
            `}</style>
        </>
    );
};

export default Sidebar;
