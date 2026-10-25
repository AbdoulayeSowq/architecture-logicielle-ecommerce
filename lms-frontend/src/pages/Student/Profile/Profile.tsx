import React, { useEffect, useState } from "react";
import { getStudentDetailsByUsername } from "../../../services/api/user";
import { getCourseById, getLacunes } from "../../../services/api/course";
import { getDepartmentById } from "../../../services/api/university";
import PageLoading from "../../../components/Admin/PageLoading";
import { StudentCard } from "../../../components/Student/StudentCard";
import { RadarChart } from "../../../components/Student/RadarChart";

const Profile = () => {
    const [userDetails, setUserDetails] = useState<any>({});
    const [academicInfo, setAcademicInfo] = useState<any>({ course: "Chargement...", department: "Chargement...", faculty: "Chargement..." });
    const [skillsData, setSkillsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const go = async () => {
            try {
                const stored = localStorage.getItem('user');
                const userObj = stored ? JSON.parse(stored) : null;
                const username = userObj ? (userObj.username || userObj.email || '') : '';
                
                const student = await getStudentDetailsByUsername(username);
                if (!student) { setLoading(false); return; }
                setUserDetails(student);

                // Fetch academic details and lacunes in parallel
                const [course, lacunes] = await Promise.all([
                    student.courseId ? getCourseById(student.courseId) : null,
                    getLacunes(username)
                ]);

                if (course) {
                    const dept = await getDepartmentById(course.departmentId);
                    setAcademicInfo({ course: course.title, department: dept?.name || "Non assigné", faculty: "École Polytechnique de Thiès" });
                } else {
                    setAcademicInfo({ course: "Non inscrit", department: "N/A", faculty: "N/A" });
                }

                // Process Skills Data for Radar Chart
                // We mock some base skills and reduce them based on lacunes
                const baseSkills = [
                    { subject: 'Java', value: 85 },
                    { subject: 'SQL', value: 70 },
                    { subject: 'Réseaux', value: 75 },
                    { subject: 'Algo', value: 90 },
                    { subject: 'Sécurité', value: 65 },
                ];

                const processed = baseSkills.map(s => {
                    // Penalty for each lacune in this competence
                    const count = Array.isArray(lacunes) ? lacunes.filter((l: any) => l.competence?.toLowerCase().includes(s.subject.toLowerCase())).length : 0;
                    return { ...s, value: Math.max(20, s.value - (count * 15)) };
                });
                setSkillsData(processed);

            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        go();
    }, []);

    if (loading && !userDetails?.username) return <PageLoading />;

    return (
        <div className="content">
            <div className="container py-5">
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
                                        <i className="fas fa-user" />
                                    </div>
                                    <h2 className="font-weight-bold mb-1" style={{ color: 'var(--text-primary)' }}>{userDetails?.fullName}</h2>
                                    <p className="small font-weight-bold mb-3" style={{ color: 'var(--text-secondary)' }}>@{userDetails?.username}</p>
                                    <span className="badge px-3 py-2" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)', borderRadius: '8px', fontWeight: 800 }}>
                                        ÉTUDIANT EPT
                                    </span>
                                </div>

                                {/* Right: Details */}
                                <div className="col-md-8 p-5">
                                    <h2 className="font-weight-bold mb-4" style={{ color: 'var(--text-primary)' }}>Informations Académiques</h2>

                                    <div className="row">
                                        <div className="col-md-6 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="student-id">Matricule</label>
                                            <div id="student-id" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{userDetails?.studentId || '—'}</div>
                                        </div>
                                        <div className="col-md-6 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="student-email">Email</label>
                                            <div id="student-email" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{userDetails?.email || '—'}</div>
                                        </div>
                                        <div className="col-md-6 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="join-date">Date d'inscription</label>
                                            <div id="join-date" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{userDetails?.joiningDate ? new Date(userDetails.joiningDate).toLocaleDateString('fr-FR') : '—'}</div>
                                        </div>
                                        <div className="col-md-6 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="student-level">Niveau</label>
                                            <div id="student-level" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{userDetails?.intake || 'DIC2'}</div>
                                        </div>
                                        <div className="col-md-12 mb-4">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="student-dept">Département</label>
                                            <div id="student-dept" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{academicInfo.department}</div>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="small font-weight-bold text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }} htmlFor="student-course">Filière</label>
                                            <div id="student-course" className="font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{academicInfo.course}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </StudentCard>
                    </div>
                </div>

                {/* Adaptive Skills Radar */}
                <div className="row justify-content-center mt-4 mb-5">
                    <div className="col-lg-10">
                        <div className="card border-0 shadow-sm" style={{ background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <div className="card-body p-4 p-md-5">
                                <div className="row align-items-center">
                                    <div className="col-md-6 mb-5 mb-md-0">
                                        <div className="d-flex align-items-center mb-4">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center mr-3" style={{ width: '40px', height: '40px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)' }} aria-hidden="true">
                                                <i className="fas fa-brain" />
                                            </div>
                                            <h2 className="font-weight-bold mb-0" style={{ color: 'var(--text-primary)' }}>Analyse des Compétences</h2>
                                        </div>
                                        <p className="text-muted small mb-5">Visualisation de votre progression basée sur vos évaluations et lacunes identifiées par l'IA.</p>

                                        <div className="d-flex flex-column" style={{ gap: '1.5rem' }} role="list" aria-label="Compétences">
                                            {skillsData.map((s, i) => (
                                                <div key={i} role="listitem">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span className="small font-weight-bold" style={{ color: 'var(--text-secondary)' }}>{s.subject}</span>
                                                        <span className="small font-weight-bold" style={{ color: 'var(--accent)' }}>{s.value}%</span>
                                                    </div>
                                                    <div className="progress" style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-elevated)', border: 'none' }} role="progressbar" aria-valuenow={s.value} aria-valuemin={0} aria-valuemax={100} aria-label={`${s.subject}: ${s.value}%`}>
                                                        <div className="progress-bar" style={{ width: `${s.value}%`, background: 'var(--accent)', borderRadius: '4px', transition: 'width 1s ease-in-out' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-md-6 d-flex justify-content-center">
                                        <div className="radar-wrapper" style={{ width: '100%', maxWidth: '350px' }} role="img" aria-label="Graphique radar des compétences">
                                            <RadarChart data={skillsData} size={320} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;