import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getCycles, getDepartmentsByCycleId, getClasses } from "../../services/api/university";
import UnreadBadge from "../UnreadBadge";
import { useAuth } from "../../services/AuthContext";
import { getLecturerDetailsByUsername } from "../../services/api/user";

type Department = { id: number; name: string; abbreviation?: string };

const normalizeClassName = (name: string) => {
    return (name || '').toLowerCase().replace(/[-_\s]/g, '');
};

const Sidebar = () => {
    const [username, setUsername] = useState("");
    const [departments, setDepartments] = useState<Department[]>([]);
    const [myClasses, setMyClasses] = useState<{ id: number; name: string }[]>([]);
    const [loadingDeps, setLoadingDeps] = useState(true);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const location = useLocation();
    const { role } = useAuth();

    const activeRole = role || localStorage.getItem('role') || 'ADMIN';
    const isChefDept   = activeRole === 'CHEF_DEPT';
    const isRespPedago = activeRole === 'RESP_PEDAGO';
    const isScolarite  = activeRole === 'SCOLARITE';
    const isAdmin      = !isChefDept && !isRespPedago && !isScolarite;

    useEffect(() => {
        fetchUser();
        if (isChefDept) {
            loadMyDepartments();
        } else if (isRespPedago) {
            loadMyClasses();
        } else if (isAdmin) {
            loadAllDepartments();
        }
    }, [activeRole]);

    const fetchUser = () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const user = JSON.parse(stored);
                setUsername(user.username || user.email || 'Admin');
            } catch { setUsername('Admin'); }
        }
    };

    /** Charge tous les départements ingénieur (ADMIN only) */
    const loadAllDepartments = async () => {
        setLoadingDeps(true);
        try {
            const cycles = await getCycles();
            const list = Array.isArray(cycles) ? cycles : [];
            const ing = list.find((c: any) =>
                (c.name || '').toLowerCase().includes('ingénieur') ||
                (c.name || '').toLowerCase().includes('ingenieur')
            );
            if (!ing) {
                setDepartments([]);
                return;
            }
            const deps = await getDepartmentsByCycleId(String(ing.id));
            setDepartments(Array.isArray(deps) ? deps : []);
        } catch { 
            setDepartments([]);
        } finally {
            setLoadingDeps(false);
        }
    };

    /** Charge uniquement le(s) département(s) supervisés par cet utilisateur */
    const loadMyDepartments = async () => {
        setLoadingDeps(true);
        try {
            const cycles = await getCycles();
            const list = Array.isArray(cycles) ? cycles : [];
            const ing = list.find((c: any) =>
                (c.name || '').toLowerCase().includes('ingénieur') ||
                (c.name || '').toLowerCase().includes('ingenieur')
            );
            if (!ing) {
                setDepartments([]);
                return;
            }

            const deps = await getDepartmentsByCycleId(String(ing.id));
            let dList: Department[] = Array.isArray(deps) ? deps : [];

            const stored = localStorage.getItem('user');
            const uname = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';
            const me = await getLecturerDetailsByUsername(uname).catch(() => null);

            if (me) {
                if (isChefDept) {
                    const code = (me.supervisedDepartmentCode || me.department || '').trim().toLowerCase();
                    if (code) {
                        dList = dList.filter((dep: any) => {
                            const abb  = (dep.abbreviation || dep.did || '').toLowerCase();
                            const name = (dep.name || '').toLowerCase();
                            return abb === code || name === code;
                        });
                    } else {
                        dList = [];
                    }
                } else if (isRespPedago && me.supervisedClassName) {
                    const suffixes = me.supervisedClassName.split(',')
                        .map((c: string) => c.trim().toLowerCase())
                        .map((c: string) => {
                            if (c.includes('-')) return c.substring(c.lastIndexOf('-') + 1).trim();
                            if (c.includes(' ')) return c.substring(c.lastIndexOf(' ') + 1).trim();
                            return c;
                        })
                        .filter(Boolean);
                    dList = dList.filter((dep: any) => {
                        const abb = (dep.abbreviation || dep.did || '').toLowerCase();
                        return suffixes.some((s: string) => abb === s);
                    });
                } else {
                    dList = [];
                }
            } else {
                dList = [];
            }
            setDepartments(dList);
        } catch { 
            setDepartments([]);
        } finally {
            setLoadingDeps(false);
        }
    };

    /** Charge uniquement la/les classe(s) supervisées par cet enseignant */
    const loadMyClasses = async () => {
        setLoadingClasses(true);
        try {
            const stored = localStorage.getItem('user');
            const uname = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';
            const me = await getLecturerDetailsByUsername(uname).catch(() => null);

            if (me && me.supervisedClassName) {
                const supervisedNames = me.supervisedClassName.split(',')
                    .map((c: string) => normalizeClassName(c))
                    .filter(Boolean);

                const allClasses = await getClasses();
                const filtered = (Array.isArray(allClasses) ? allClasses : []).filter((c: any) => {
                    const normCName = normalizeClassName(c.name);
                    return supervisedNames.includes(normCName);
                });
                setMyClasses(filtered);
            } else {
                setMyClasses([]);
            }
        } catch { 
            setMyClasses([]);
        } finally {
            setLoadingClasses(false);
        }
    };

    const shortLabel = (dep: Department) => {
        if (dep.abbreviation) return dep.abbreviation;
        const match = dep.name.match(/\(([^)]+)\)/);
        return match ? match[1] : dep.name;
    };

    const isDeptActive = (id: number) => {
        const params = new URLSearchParams(location.search);
        return location.pathname === '/admin/university/class' && params.get('department') === String(id);
    };

    const isTcActive = (q: string) =>
        location.pathname === '/admin/university/class' && location.search === `?q=${q}`;

    /* ── Bloc réutilisable : liste des départements filtrés ── */
    const DeptList = () => (
        <>
            {loadingDeps ? (
                <li className="nav-item">
                    <span className="nav-link-custom text-muted" style={{ paddingLeft: '32px' }}>Chargement…</span>
                </li>
            ) : departments.length === 0 ? (
                <li className="nav-item">
                    <span className="nav-link-custom text-muted" style={{ paddingLeft: '32px' }}>Aucun département</span>
                </li>
            ) : departments.map(dep => (
                <li key={dep.id} className="nav-item">
                    <NavLink
                        to={`/admin/university/class?department=${dep.id}`}
                        className={() => `nav-link-custom child-link ${isDeptActive(dep.id) ? 'active' : ''}`}
                    >
                        {shortLabel(dep)}
                    </NavLink>
                </li>
            ))}
        </>
    );

    /* ── Messagerie (commun) ── */
    const MessagerieItem = () => (
        <li className="nav-item">
            <NavLink to="/admin/messages" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                <i className="nav-icon fas fa-envelope" />
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Messagerie
                    <UnreadBadge username={username} style={{ scale: '0.8' }} />
                </div>
            </NavLink>
        </li>
    );

    /* ════════════════════ MENUS PAR RÔLE ════════════════════ */

    /** CHEF DE DÉPARTEMENT — supervision de son seul département */
    const MenuChefDept = () => (
        <>
            <li className="nav-header-custom">Mon Département</li>
            {loadingDeps ? (
                <li className="nav-item">
                    <span className="nav-link-custom text-muted" style={{ paddingLeft: '24px' }}>Chargement…</span>
                </li>
            ) : departments.length === 0 ? (
                <li className="nav-item">
                    <span className="nav-link-custom text-muted" style={{ paddingLeft: '24px' }}>Aucun département</span>
                </li>
            ) : departments.map(dep => {
                // Affiche uniquement l'abréviation pour gagner de l'espace (ex: "GIT")
                const depAbbrev = dep.abbreviation || shortLabel(dep);
                return (
                    <li key={dep.id} className="nav-item">
                        <NavLink
                            to={`/admin/university/class?department=${dep.id}`}
                            className={() => `nav-link-custom ${isDeptActive(dep.id) ? 'active' : ''}`}
                        >
                            <i className="nav-icon fas fa-sitemap" />
                            {depAbbrev}
                        </NavLink>
                    </li>
                );
            })}

            <li className="nav-header-custom">Supervision</li>
            <li className="nav-item">
                <NavLink to="/admin/analytics" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-chart-line" />
                    Analytics
                </NavLink>
            </li>
            <li className="nav-item">
                <NavLink to="/admin/student/enrolled" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-user-graduate" />
                    Étudiants
                </NavLink>
            </li>
            <li className="nav-item">
                <NavLink to="/admin/attendance" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-clipboard-check" />
                    Assiduité
                </NavLink>
            </li>

            <li className="nav-header-custom">Communication</li>
            <li className="nav-item">
                <NavLink to="/admin/announcements" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-bullhorn" />
                    Annonces
                </NavLink>
            </li>
            <MessagerieItem />
        </>
    );

    /** RESPONSABLE PÉDAGOGIQUE — ses classes uniquement (ou aucune si pas encore assigné) */
    const MenuRespPedago = () => (
        <>
            <li className="nav-header-custom">
                {!loadingClasses && myClasses.length > 1 ? "Mes Classes" : "Ma Classe"}
            </li>
            {loadingClasses ? (
                <li className="nav-item">
                    <span className="nav-link-custom text-muted" style={{ paddingLeft: '24px' }}>Chargement…</span>
                </li>
            ) : myClasses.length === 0 ? (
                <li className="nav-item">
                    <span className="nav-link-custom text-muted" style={{ paddingLeft: '24px' }}>Aucune classe</span>
                </li>
            ) : myClasses.map(cls => (
                <li key={cls.id} className="nav-item">
                    <NavLink
                        to={`/admin/university/class/${cls.id}/details`}
                        className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
                    >
                        <i className="nav-icon fas fa-graduation-cap" />
                        {cls.name.toUpperCase()}
                    </NavLink>
                </li>
            ))}
            <li className="nav-item">
                <NavLink to="/admin/university/timetable" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-calendar-alt" />
                    Emplois du Temps
                </NavLink>
            </li>

            <li className="nav-header-custom">Suivi</li>
            <li className="nav-item">
                <NavLink to="/admin/analytics" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-chart-line" />
                    Analytics
                </NavLink>
            </li>
            <li className="nav-item">
                <NavLink to="/admin/student/enrolled" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-user-graduate" />
                    Étudiants
                </NavLink>
            </li>
            <li className="nav-item">
                <NavLink to="/admin/attendance" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-clipboard-check" />
                    Assiduité
                </NavLink>
            </li>

            <li className="nav-header-custom">Communication</li>
            <li className="nav-item">
                <NavLink to="/admin/announcements" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-bullhorn" />
                    Annonces
                </NavLink>
            </li>
            <MessagerieItem />
        </>
    );

    /** SCOLARITÉ — gestion administrative des étudiants */
    const MenuScolarite = () => (
        <>
            <li className="nav-header-custom">Gestion Administrative</li>
            <li className="nav-item">
                <NavLink to="/admin/student/enrolled" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-user-graduate" />
                    Étudiants
                </NavLink>
            </li>
            <li className="nav-item">
                <NavLink to="/admin/student/new" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-user-plus" />
                    Inscrire un Étudiant
                </NavLink>
            </li>

            <li className="nav-header-custom">Communication</li>
            <li className="nav-item">
                <NavLink to="/admin/announcements" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-bullhorn" />
                    Annonces
                </NavLink>
            </li>
            <MessagerieItem />
        </>
    );

    /** SUPER ADMIN — menu complet */
    const MenuAdmin = () => (
        <>
            <li className="nav-item">
                <NavLink to="/admin/index" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-th-large" />
                    Tableau de bord
                </NavLink>
            </li>

            <li className="nav-header-custom">Académique</li>
            <li className="nav-item">
                <div className="nav-link-custom" style={{ cursor: 'default', fontWeight: 600 }}>
                    <i className="nav-icon fas fa-book" />
                    Tronc Commun
                </div>
                <ul className="nav nav-treeview" style={{ display: 'block' }}>
                    <li className="nav-item">
                        <NavLink to="/admin/university/class?q=TC1" className={() => `nav-link-custom child-link ${isTcActive('TC1') ? 'active' : ''}`}>TC1</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/admin/university/class?q=TC2" className={() => `nav-link-custom child-link ${isTcActive('TC2') ? 'active' : ''}`}>TC2</NavLink>
                    </li>
                </ul>
            </li>
            <li className="nav-item">
                <div className="nav-link-custom" style={{ cursor: 'default', fontWeight: 600 }}>
                    <i className="nav-icon fas fa-cogs" />
                    Cycle Ingénieur
                </div>
                <ul className="nav nav-treeview" style={{ display: 'block' }}>
                    <DeptList />
                </ul>
            </li>


            <li className="nav-header-custom">Utilisateurs</li>
            <li className="nav-item">
                <NavLink to="/admin/student/enrolled" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-user-graduate" />
                    Étudiants
                </NavLink>
            </li>
            <li className="nav-item">
                <NavLink to="/admin/lecturer/all" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-chalkboard-teacher" />
                    Enseignants
                </NavLink>
            </li>
            <li className="nav-item">
                <NavLink to="/admin/attendance" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-clipboard-check" />
                    Assiduité
                </NavLink>
            </li>

            <li className="nav-header-custom">Communication</li>
            <li className="nav-item">
                <NavLink to="/admin/announcements" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-bullhorn" />
                    Annonces
                </NavLink>
            </li>
            <MessagerieItem />

            <li className="nav-header-custom">Système</li>
            <li className="nav-item">
                <NavLink to="/admin/settings" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-sliders-h" />
                    Configuration
                </NavLink>
            </li>
            <li className="nav-item">
                <NavLink to="/admin/support" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-life-ring" />
                    Assistance
                </NavLink>
            </li>
        </>
    );

    /* ════════════════════ RENDER ════════════════════ */
    return (
        <aside className="main-sidebar elevation-0" style={{
            background: 'var(--bg-sidebar)',
            borderRight: 'none',
            transition: 'var(--t)'
        }}>
            <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/dist/img/main-logo.png" alt="LMS Logo" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-sidebar-active)', letterSpacing: '1px' }}>
                    EPT
                </span>
            </div>

            <div className="sidebar" style={{ padding: '8px 0' }}>
                <nav className="mt-2">
                    <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false" style={{ gap: '2px' }}>
                        {isChefDept   && <MenuChefDept />}
                        {isRespPedago && <MenuRespPedago />}
                        {isScolarite  && <MenuScolarite />}
                        {isAdmin      && <MenuAdmin />}
                    </ul>
                </nav>
            </div>

            <style>{`
                .nav-link-custom {
                    margin: 1px 12px !important;
                    padding: 6px 14px !important;
                    border-radius: 8px !important;
                    color: var(--text-sidebar) !important;
                    font-size: 0.9rem !important;
                    font-weight: 500 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                    transition: all 0.15s ease !important;
                    text-decoration: none !important;
                    height: 36px !important;
                }
                .nav-link-custom:hover {
                    background: var(--bg-sidebar-hover) !important;
                    color: var(--text-sidebar-active) !important;
                }
                .nav-link-custom.active {
                    background: var(--bg-sidebar-active) !important;
                    color: var(--text-sidebar-active) !important;
                    font-weight: 600 !important;
                }
                .nav-link-custom .nav-icon {
                    width: 20px !important;
                    text-align: center !important;
                    font-size: 1rem !important;
                    color: var(--text-sidebar) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                .nav-link-custom:hover .nav-icon,
                .nav-link-custom.active .nav-icon {
                    color: var(--text-sidebar-active) !important;
                }
                .nav-treeview {
                    padding: 2px 0 !important;
                    margin: 0 !important;
                }
                .child-link {
                    padding-left: 42px !important;
                    font-size: 0.85rem !important;
                    position: relative !important;
                    height: 30px !important;
                    transition: all 0.2s ease !important;
                }
                .child-link:hover { color: var(--text-sidebar-active) !important; }
                .child-link:hover::before { border-color: var(--text-sidebar-active) !important; }
                .child-link::before {
                    content: '';
                    position: absolute;
                    left: 22px;
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    border: 1px solid var(--text-muted);
                    top: 50%;
                    transform: translateY(-50%);
                    transition: all 0.2s ease;
                }
                .child-link.active {
                    color: var(--text-sidebar-active) !important;
                    background: transparent !important;
                    font-weight: 700 !important;
                }
                .child-link.active::before {
                    background: var(--text-sidebar-active);
                    border-color: var(--text-sidebar-active);
                    box-shadow: 0 0 0 3px var(--bg-sidebar-active);
                }
                .nav-header-custom {
                    padding: 16px 24px 6px !important;
                    font-size: 0.75rem !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    color: var(--text-sidebar) !important;
                    opacity: 0.6;
                }
                .sidebar::-webkit-scrollbar { width: 4px; }
                .sidebar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            `}</style>
        </aside>
    );
};

export default Sidebar;
