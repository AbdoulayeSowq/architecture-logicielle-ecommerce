import React, { useEffect, useState } from 'react';
import { getAtRiskStudents, getModulesByLecturer } from '../../../services/api/course';
import { sendMessage } from '../../../services/api/messages';
import { notifySuccess, notifyError } from '../../../components/notify';
import { useAuth } from '../../../services/AuthContext';
import PageLoading from '../../../components/Admin/PageLoading';

interface AtRiskStudent {
  username: string;
  fullName: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  lastActivity: string | null;
  averageGrade: number;
  trend?: number;
}

interface CModule {
  id: number;
  name: string;
  codeEC: string;
  level: string;
}

const AtRiskStudents: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [modules, setModules] = useState<CModule[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [sending, setSending] = useState(false);

  // Filters State
  const [selectedModuleId, setSelectedModuleId] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  // Individual Messaging Modal State
  const [activeContactStudent, setActiveContactStudent] = useState<AtRiskStudent | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');

  // Bulk Messaging Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSubject, setBulkSubject] = useState("Suivi pédagogique — Accompagnement de soutien");
  const [bulkBody, setBulkBody] = useState(
    `Bonjour {studentName},\n\nJe vous écris pour faire un point sur votre parcours dans notre module. J'ai remarqué quelques difficultés ou baisses d'activité récemment.\n\nJe souhaite vous soutenir activement pour vous aider à surmonter ces obstacles. Discutons-en au prochain cours ou contactez-moi par message pour fixer un créneau !\n\nCordialement,\n${user?.fullName || 'Votre enseignant'}`
  );
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  const fetchStudentsData = async (modId?: number) => {
    if (user?.username) {
      setLoadingStudents(true);
      try {
        const data = await getAtRiskStudents(user.username, modId);
        setStudents(data);
      } catch (error) {
        console.error("Error loading warning data", error);
        notifyError("Impossible de charger les données prédictives.");
      }
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    const fetchModulesAndData = async () => {
      setLoading(true);
      if (user?.username) {
        try {
          // Fetch Lecturer Modules
          const mods = await getModulesByLecturer(user.username);
          if (mods) setModules(mods);
          
          // Fetch Initial At Risk Students (all modules)
          const data = await getAtRiskStudents(user.username);
          setStudents(data);
        } catch (error) {
          console.error("Error loading early warning data", error);
        }
      }
      setLoading(false);
    };
    fetchModulesAndData();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.username || !activeContactStudent) return;

    setSending(true);
    const result = await sendMessage({
      senderUsername: user.username,
      receiverUsername: activeContactStudent.username,
      subject: messageSubject,
      body: messageBody
    });

    setSending(false);
    if (result) {
      notifySuccess(`Message de soutien envoyé à ${activeContactStudent.fullName} !`);
      setActiveContactStudent(null);
    } else {
      notifyError("Une erreur s'est produite lors de l'envoi du message.");
    }
  };

  const handleSendBulkMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.username || filteredStudents.length === 0) return;

    setSending(true);
    setBulkProgress({ current: 0, total: filteredStudents.length });

    let sentCount = 0;
    for (let i = 0; i < filteredStudents.length; i++) {
      const student = filteredStudents[i];
      try {
        await sendMessage({
          senderUsername: user.username,
          receiverUsername: student.username,
          subject: bulkSubject,
          body: bulkBody.replace("{studentName}", student.fullName),
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send message to ${student.username}`, err);
      }
      setBulkProgress({ current: i + 1, total: filteredStudents.length });
    }

    setSending(false);
    setBulkProgress(null);
    setShowBulkModal(false);
    notifySuccess(`Relance groupée envoyée avec succès à ${sentCount} étudiant(s) ! 🎉`);
  };

  const openContactModal = (student: AtRiskStudent) => {
    setActiveContactStudent(student);
    setMessageSubject(`Suivi pédagogique - Échange de soutien`);
    setMessageBody(
      `Bonjour ${student.fullName},\n\nJe me permets de vous contacter car j'ai remarqué quelques difficultés ou absences lors des dernières séances de cours ou évaluations.\n\nJe reste à votre entière disposition pour échanger, vous aider à surmonter ces difficultés et vous accompagner au mieux dans votre réussite.\n\nCordialement,\n${user?.fullName || 'Votre enseignant'}`
    );
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'HIGH': return <span className="badge badge-danger px-3 py-2" style={{ fontSize: '0.8rem', borderRadius: '20px', background: '#dc3545', color: '#fff' }}><i className="fas fa-exclamation-triangle mr-2"></i>CRITIQUE</span>;
      case 'MEDIUM': return <span className="badge badge-warning px-3 py-2" style={{ fontSize: '0.8rem', borderRadius: '20px', background: '#ffc107', color: '#000' }}><i className="fas fa-exclamation-circle mr-2"></i>ALERTE</span>;
      case 'LOW': return <span className="badge badge-info px-3 py-2" style={{ fontSize: '0.8rem', borderRadius: '20px', background: '#17a2b8', color: '#fff' }}><i className="fas fa-info-circle mr-2"></i>VIGILANCE</span>;
      default: return null;
    }
  };

  // Filter students based on UI selections
  const filteredStudents = students.filter(student => {
    // Filter by risk level
    if (riskFilter !== 'ALL' && student.riskLevel !== riskFilter) {
      return false;
    }
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const nameMatch = student.fullName.toLowerCase().includes(query);
      const usernameMatch = student.username.toLowerCase().includes(query);
      return nameMatch || usernameMatch;
    }
    return true;
  });

  // Calculate Class Health Index
  const averageClassGrade = students.length > 0 
    ? students.reduce((acc, s) => acc + s.averageGrade, 0) / students.length 
    : 100;
  const criticalRatio = students.length > 0 
    ? students.filter(s => s.riskLevel === 'HIGH').length / students.length 
    : 0;
  const classHealthScore = Math.max(0, Math.min(100, averageClassGrade * (1 - criticalRatio)));

  if (loading) return <PageLoading />;

  return (
    <div className="page-content py-4">
      {/* Upper header section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 font-weight-bold mb-1">Suivi des Risques (Early Warning)</h1>
          <p className="text-muted">Détection automatique des étudiants en difficulté ou inactifs.</p>
        </div>
      </div>

      {/* Premium Statistics Deck */}
      <div className="row mb-4">
        {/* Class Health Score */}
        <div className="col-lg-4 mb-3 mb-lg-0">
          <div className="card border-0 shadow-sm p-4 h-100 bg-gradient-primary text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #1e3a8a 0%, var(--accent) 100%)', color: '#fff' }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="small text-white-50 text-uppercase font-weight-bold" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Santé de la Classe</span>
                <h3 className="font-weight-bold mb-0 mt-1" style={{ fontSize: '2rem' }}>{classHealthScore.toFixed(0)} / 100</h3>
              </div>
              <div className="rounded-circle p-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <i className="fas fa-heartbeat text-white" style={{ fontSize: '20px' }}></i>
              </div>
            </div>
            <div className="progress mb-2" style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)' }}>
              <div className="progress-bar bg-white" style={{ width: `${classHealthScore}%`, borderRadius: '4px', background: '#fff' }}></div>
            </div>
            <span className="small text-white-50" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Indice de risque académique et de présence global</span>
          </div>
        </div>

        {/* Warning Counts Dashboard */}
        <div className="col-lg-4 mb-3 mb-lg-0">
          <div className="card border-0 shadow-sm p-4 h-100 bg-white" style={{ borderRadius: '16px', borderLeft: '5px solid #dc3545' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="small text-muted text-uppercase font-weight-bold" style={{ fontSize: '0.75rem' }}>Indicateurs</span>
                <h4 className="font-weight-bold text-dark mt-1" style={{ fontSize: '1.25rem' }}>Alertes Actives</h4>
              </div>
              <div className="rounded-circle p-2 bg-light">
                <i className="fas fa-bell text-danger"></i>
              </div>
            </div>
            <div className="d-flex mt-2" style={{ gap: '24px' }}>
              <div>
                <div className="h3 font-weight-bold text-danger mb-0" style={{ fontSize: '1.75rem' }}>{students.filter(s => s.riskLevel === 'HIGH').length}</div>
                <div className="small text-muted" style={{ fontSize: '0.75rem' }}>Critique(s)</div>
              </div>
              <div className="border-left pl-3" style={{ borderLeft: '1px solid #e2e8f0' }}>
                <div className="h3 font-weight-bold text-warning mb-0" style={{ fontSize: '1.75rem' }}>{students.filter(s => s.riskLevel === 'MEDIUM').length}</div>
                <div className="small text-muted" style={{ fontSize: '0.75rem' }}>Alerte(s)</div>
              </div>
              <div className="border-left pl-3" style={{ borderLeft: '1px solid #e2e8f0' }}>
                <div className="h3 font-weight-bold text-info mb-0" style={{ fontSize: '1.75rem' }}>{students.filter(s => s.riskLevel === 'LOW').length}</div>
                <div className="small text-muted" style={{ fontSize: '0.75rem' }}>Vigilance(s)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Action Relance */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 h-100 bg-gradient-dark text-white" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff' }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="small text-white-50 text-uppercase font-weight-bold" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Communication</span>
                <h4 className="font-weight-bold mb-0 mt-1" style={{ fontSize: '1.25rem' }}>Relance Groupée</h4>
              </div>
              <div className="rounded-circle p-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <i className="fas fa-paper-plane text-warning" style={{ fontSize: '20px' }}></i>
              </div>
            </div>
            <button 
              className="btn btn-warning rounded-pill py-2 w-100 font-weight-bold transition-all hover-shadow mt-2" 
              onClick={() => setShowBulkModal(true)}
              disabled={filteredStudents.length === 0}
              style={{ fontSize: '0.85rem', background: '#ffc107', border: 'none', color: '#000' }}
            >
              <i className="fas fa-bullhorn mr-2"></i> Relancer les {filteredStudents.length} étudiants
            </button>
          </div>
        </div>
      </div>

      {/* Modern filters bar */}
      <div className="row mb-4 align-items-center">
        {/* Search */}
        <div className="col-lg-4 mb-3 mb-lg-0">
          <div className="input-group bg-white border-0 shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <span className="input-group-text bg-white border-0 pr-0 pl-3 text-muted">
              <i className="fas fa-search"></i>
            </span>
            <input 
              type="text" 
              className="form-control border-0 pl-2 py-2" 
              placeholder="Rechercher un étudiant..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ boxShadow: 'none' }}
            />
          </div>
        </div>

        {/* Module select */}
        <div className="col-lg-4 col-md-6 mb-3 mb-md-0">
          <select 
            className="form-control border-0 shadow-sm px-3 py-2 w-100" 
            style={{ borderRadius: '10px', height: '42px', appearance: 'auto' }}
            value={selectedModuleId || ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              setSelectedModuleId(val);
              fetchStudentsData(val);
            }}
          >
            <option value="">Tous les modules</option>
            {modules.map(mod => (
              <option key={mod.id} value={mod.id}>{mod.name} ({mod.codeEC})</option>
            ))}
          </select>
        </div>

        {/* Risk Tabs */}
        <div className="col-lg-4 col-md-6">
          <div className="bg-white p-1 shadow-sm d-flex justify-content-between text-center" style={{ borderRadius: '10px' }}>
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(lvl => (
              <button
                key={lvl}
                className={`btn btn-sm flex-fill py-2 border-0 rounded-lg font-weight-bold transition-all ${
                  riskFilter === lvl 
                    ? 'btn-primary text-white shadow-sm' 
                    : 'btn-light bg-white text-muted'
                }`}
                onClick={() => setRiskFilter(lvl)}
                style={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                {lvl === 'ALL' ? 'Tous' : lvl === 'HIGH' ? 'Critique' : lvl === 'MEDIUM' ? 'Alerte' : 'Vigilance'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Student list card */}
      {loadingStudents ? (
        <div className="empty-state-box py-5">
          <i className="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
          <p className="mb-0">Chargement des étudiants...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="empty-state-box py-5">
          <i className="fas fa-info-circle"></i>
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Aucun étudiant détecté</h4>
          <p className="mb-0">Ajustez vos filtres ou votre recherche pour afficher plus de résultats.</p>
        </div>
      ) : (
        <div className="stat-card border-0 shadow-sm p-0 overflow-hidden mb-4 bg-white" style={{ borderRadius: '15px' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                <tr>
                  <th className="px-4 py-3 border-0">Étudiant</th>
                  <th className="py-3 border-0">Niveau de Risque</th>
                  <th className="py-3 border-0">Dernière Activité</th>
                  <th className="py-3 border-0">Moyenne Quiz</th>
                  <th className="py-3 border-0">Tendance</th>
                  <th className="py-3 border-0">Raisons de l'alerte</th>
                  <th className="px-4 py-3 border-0 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => (
                  <tr key={idx} className="transition-all">
                    {/* Student Full Name & Profile */}
                    <td className="px-4 py-4 border-bottom-0">
                      <div className="d-flex align-items-center">
                        <div className="avatar-sm mr-3 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', marginRight: '12px' }}>
                          <i className="fas fa-user text-muted"></i>
                        </div>
                        <div>
                          <div className="font-weight-bold">{student.fullName}</div>
                          <div className="small text-muted">@{student.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-4 border-bottom-0">
                      {getRiskBadge(student.riskLevel)}
                    </td>

                    {/* Last Login Date */}
                    <td className="py-4 border-bottom-0">
                      {student.lastActivity ? (
                        <div className="small">
                          <div className="font-weight-bold text-dark">
                            {new Date(student.lastActivity).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                          <div className="text-muted text-xs">
                            {new Date(student.lastActivity).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted small font-italic">Jamais connecté</span>
                      )}
                    </td>

                    {/* Premium Average Grade with Progress Bar & Trend Indicator */}
                    <td className="py-4 border-bottom-0" style={{ minWidth: '160px' }}>
                      <div className="d-flex align-items-center mb-1">
                        <span className={`font-weight-bold mr-2 ${student.averageGrade < 50 ? 'text-danger' : 'text-dark'}`} style={{ fontSize: '0.95rem', marginRight: '8px' }}>
                          {student.averageGrade.toFixed(1)}%
                        </span>
                        {student.averageGrade < 50 ? (
                          <i className="fas fa-arrow-down text-danger small" title="Niveau critique"></i>
                        ) : student.averageGrade < 65 ? (
                          <i className="fas fa-exclamation text-warning small" title="Niveau fragile"></i>
                        ) : (
                          <i className="fas fa-arrow-up text-primary small" title="Niveau satisfaisant"></i>
                        )}
                      </div>
                      <div className="progress progress-sm w-100 bg-light" style={{ height: '6px', borderRadius: '3px', maxWidth: '120px' }}>
                        <div 
                          className={`progress-bar ${student.averageGrade < 50 ? 'bg-danger' : student.averageGrade < 65 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${Math.min(100, student.averageGrade)}%`, borderRadius: '3px', background: student.averageGrade < 50 ? '#dc3545' : student.averageGrade < 65 ? '#ffc107' : 'var(--accent)' }}
                        />
                      </div>
                    </td>

                    {/* Trend Indicator Column */}
                    <td className="py-4 border-bottom-0">
                      {student.trend !== undefined ? (
                        student.trend < -10 ? (
                          <span className="text-danger font-weight-bold small d-flex align-items-center" style={{ color: '#dc3545' }}>
                            <i className="fas fa-chevron-circle-down mr-1" style={{ marginRight: '4px' }}></i> ↘ {student.trend.toFixed(1)}%
                          </span>
                        ) : student.trend < 0 ? (
                          <span className="text-warning font-weight-bold small d-flex align-items-center" style={{ color: '#fd7e14' }}>
                            <i className="fas fa-chevron-down mr-1" style={{ marginRight: '4px' }}></i> ↘ {student.trend.toFixed(1)}%
                          </span>
                        ) : student.trend > 0 ? (
                          <span className="text-success font-weight-bold small d-flex align-items-center" style={{ color: '#28a745' }}>
                            <i className="fas fa-chevron-up mr-1" style={{ marginRight: '4px' }}></i> ↗ +{student.trend.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted small">Stable</span>
                        )
                      ) : (
                        <span className="text-muted small">Stable</span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="py-4 border-bottom-0">
                      <div className="small text-muted text-wrap" style={{ maxWidth: '280px', lineHeight: '1.4' }}>
                        {student.reason.split(', ').map((r, i) => (
                          <div key={i} className="mb-1 d-flex align-items-baseline">
                            <span className="bullet-point text-primary" style={{ fontSize: '0.6rem', marginRight: '8px' }}>●</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Contact Button */}
                    <td className="px-4 py-4 border-bottom-0 text-right">
                      <button 
                        className="btn btn-sm btn-outline-primary rounded-pill px-3 transition-all hover-shadow"
                        onClick={() => openContactModal(student)}
                      >
                        <i className="fas fa-envelope mr-2"></i>Contacter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info panel explaining warning indicators */}
      <div className="mt-5 p-4 bg-light border-0 shadow-sm bg-white" style={{ borderRadius: '15px' }}>
        <h5 className="font-weight-bold mb-3"><i className="fas fa-info-circle mr-2 text-primary"></i>Comment fonctionne la détection ?</h5>
        <div className="row">
          <div className="col-md-4">
            <div className="d-flex mb-3">
              <div className="mr-3 text-primary" style={{ marginRight: '16px' }}><i className="fas fa-clock fa-2x mt-1"></i></div>
              <div className="small text-muted">
                <h6 className="font-weight-bold text-dark mb-1">Inactivité prolongée</h6>
                Une alerte est déclenchée si un étudiant ne s'est pas connecté depuis plus de 7 jours (vigilance) ou 14 jours (critique).
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="d-flex mb-3">
              <div className="mr-3 text-warning" style={{ marginRight: '16px' }}><i className="fas fa-chart-line fa-2x mt-1"></i></div>
              <div className="small text-muted">
                <h6 className="font-weight-bold text-dark mb-1">Baisse de régime</h6>
                Analyse comparative des notes de quiz. Une baisse ou chute progressive de performances active une alerte prédictive de tendance.
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="d-flex mb-3">
              <div className="mr-3 text-danger" style={{ marginRight: '16px' }}><i className="fas fa-graduation-cap fa-2x mt-1"></i></div>
              <div className="small text-muted">
                <h6 className="font-weight-bold text-dark mb-1">Difficultés académiques</h6>
                Une moyenne générale inférieure à 50% ou une absence totale de participation (étudiant fantôme) déclenche une alerte critique.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic contact modal */}
      {activeContactStudent && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', background: '#fff' }}>
              <div className="modal-header border-bottom-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-weight-bold text-dark mb-0">
                  <i className="fas fa-envelope-open-text mr-2 text-primary"></i>Contacter {activeContactStudent.fullName}
                </h5>
                <button type="button" className="close border-0 bg-transparent text-muted" onClick={() => setActiveContactStudent(null)} style={{ fontSize: '1.5rem', outline: 'none' }}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSendMessage}>
                <div className="modal-body px-4 py-3">
                  <div className="form-group mb-3">
                    <label className="small font-weight-bold text-muted mb-1">Sujet du message</label>
                    <input 
                      type="text" 
                      className="form-control border-0 bg-light rounded-lg px-3 py-2 w-100" 
                      style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                      value={messageSubject} 
                      onChange={(e) => setMessageSubject(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="small font-weight-bold text-muted mb-1">Message d'accompagnement</label>
                    <textarea 
                      className="form-control border-0 bg-light rounded-lg p-3 w-100" 
                      rows={6}
                      style={{ borderRadius: '8px', resize: 'none', fontSize: '0.9rem', lineHeight: '1.5' }}
                      value={messageBody} 
                      onChange={(e) => setMessageBody(e.target.value)} 
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-top-0 px-4 pb-4 pt-0 d-flex justify-content-between">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setActiveContactStudent(null)} style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={sending} style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {sending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>Envoi...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>Envoyer le message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Bulk Relance modal */}
      {showBulkModal && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', background: '#fff' }}>
              <div className="modal-header border-bottom-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-weight-bold text-dark mb-0">
                  <i className="fas fa-bullhorn mr-2 text-warning" style={{ color: '#ffc107', marginRight: '8px' }}></i>Relance Groupée ({filteredStudents.length} étudiants)
                </h5>
                <button type="button" className="close border-0 bg-transparent text-muted" onClick={() => setShowBulkModal(false)} style={{ fontSize: '1.5rem', outline: 'none' }}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSendBulkMessage}>
                <div className="modal-body px-4 py-3">
                  <p className="small text-muted mb-3">Ce message sera envoyé individuellement à chacun des <strong>{filteredStudents.length}</strong> étudiants en surveillance affichés dans votre vue filtrée.</p>
                  <div className="form-group mb-3">
                    <label className="small font-weight-bold text-muted mb-1">Sujet commun</label>
                    <input 
                      type="text" 
                      className="form-control border-0 bg-light rounded-lg px-3 py-2 w-100" 
                      style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                      value={bulkSubject} 
                      onChange={(e) => setBulkSubject(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="small font-weight-bold text-muted mb-1">Message d'accompagnement (Balise <code>{"{studentName}"}</code> autorisée)</label>
                    <textarea 
                      className="form-control border-0 bg-light rounded-lg p-3 w-100" 
                      rows={6}
                      style={{ borderRadius: '8px', resize: 'none', fontSize: '0.9rem', lineHeight: '1.5' }}
                      value={bulkBody} 
                      onChange={(e) => setBulkBody(e.target.value)} 
                      required
                    />
                  </div>

                  {bulkProgress && (
                    <div className="mt-3">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Transmission en cours...</span>
                        <span>{bulkProgress.current} / {bulkProgress.total}</span>
                      </div>
                      <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                        <div className="progress-bar bg-warning progress-bar-striped progress-bar-animated" style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%`, borderRadius: '4px', background: '#ffc107' }}></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top-0 px-4 pb-4 pt-0 d-flex justify-content-between">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowBulkModal(false)} style={{ fontSize: '0.9rem', fontWeight: 600 }} disabled={sending}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-warning rounded-pill px-4" disabled={sending} style={{ fontSize: '0.9rem', fontWeight: 600, background: '#ffc107', border: 'none', color: '#000' }}>
                    {sending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>Envoi groupé...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>Lancer la relance
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtRiskStudents;
