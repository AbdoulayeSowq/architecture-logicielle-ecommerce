import React, { useEffect, useState } from "react";
import { getLecturerDetailsByUsername } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";
import { StudentCard } from "../../../components/Student/StudentCard";

const LecturerProfile = () => {
    const [userDetails, setUserDetails] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const go = async () => {
            try {
                const stored = localStorage.getItem('user');
                const username = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';
                const details = await getLecturerDetailsByUsername(username);
                setUserDetails(details || {});
            } catch (error) {
                console.error("Error fetching lecturer details:", error);
            } finally {
                setLoading(false);
            }
        };
        go();
    }, []);

    if (loading) return <PageLoading />;

    const initials = userDetails?.fullName
        ?.split(' ')
        .map((n: string) => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 1) || '?';

    return (
        <div className="content">
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <StudentCard className="border-0 shadow-sm overflow-hidden p-0">
                            <div className="row no-gutters">
                                {/* Left: Avatar & Basic Info */}
                                <div className="col-md-4 p-5 text-center" style={{ background: 'var(--bg-elevated)', borderRight: '1px solid var(--border)' }}>
                                    <div className="avatar mx-auto mb-4" style={{
                                        width: 100, height: 100, fontSize: '2.5rem', borderRadius: 20,
                                        background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }} aria-hidden="true">
                                        {initials}
                                    </div>
                                    <h2 className="font-weight-bold mb-1" style={{ color: 'var(--text-primary)' }}>{userDetails.fullName}</h2>
                                    <p className="small font-weight-bold mb-3" style={{ color: 'var(--text-secondary)' }}>@{userDetails.username}</p>
                                    <span className="badge px-3 py-2" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)', borderRadius: '8px', fontWeight: 800 }}>
                                        ENSEIGNANT
                                    </span>
                                </div>

                                {/* Right: Details */}
                                <div className="col-md-8 p-5">
                                    <h2 className="font-weight-bold mb-4" style={{ color: 'var(--text-primary)' }}>Détails Professionnels</h2>

                                    <div className="row">
                                        <div className="col-md-6 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="lecturer-id">ID Enseignant</label>
                                            <div id="lecturer-id" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{userDetails.lecturerId || '—'}</div>
                                        </div>
                                        <div className="col-md-6 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="join-date">Date d'arrivée</label>
                                            <div id="join-date" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{userDetails.joiningDate ? new Date(userDetails.joiningDate).toLocaleDateString('fr-FR') : '—'}</div>
                                        </div>
                                        <div className="col-md-6 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="lecturer-email">Email</label>
                                            <div id="lecturer-email" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{userDetails.email || '—'}</div>
                                        </div>
                                        <div className="col-md-6 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="lecturer-phone">Téléphone</label>
                                            <div id="lecturer-phone" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{userDetails.phone || 'Non renseigné'}</div>
                                        </div>
                                        <div className="col-md-6 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="lecturer-faculty">Faculté / École</label>
                                            <div id="lecturer-faculty" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{userDetails.faculty || 'EPT'}</div>
                                        </div>
                                        <div className="col-md-6 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="lecturer-dept">Département</label>
                                            <div id="lecturer-dept" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{userDetails.department || '—'}</div>
                                        </div>
                                        <div className="col-md-12 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="lecturer-course">Cours & Spécialités</label>
                                            <div id="lecturer-course" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{userDetails.course || '—'}</div>
                                        </div>
                                    </div>

                                    <hr className="my-4" style={{ borderColor: 'var(--border)' }} />

                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="small font-weight-bold text-muted">Paramètres de sécurité</div>
                                        <button className="btn btn-outline-primary font-weight-bold" style={{ borderRadius: '8px' }} aria-label="Changer le mot de passe">
                                            Changer le mot de passe
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </StudentCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LecturerProfile;