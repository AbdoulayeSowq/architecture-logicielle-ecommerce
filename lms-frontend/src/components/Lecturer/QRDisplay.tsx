import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api/api';
import { notifyError } from '../notify';

interface QRDisplayProps {
    moduleId: string;
    sessionId: number | string;
}

const QRDisplay: React.FC<QRDisplayProps> = ({ moduleId, sessionId }) => {
    const [token, setToken] = useState<string | null>(null);
    const [sessionActive, setSessionActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);       // session 5min
    const [listType, setListType] = useState<'present' | 'absent'>('present');
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const QR_SESSION_TIME = 300;  // 5 minutes
    const [isOnline, setIsOnline] = useState(false);
    const isOnlineRef = useRef(false);

    // Polling for real-time updates — stable reference via useCallback
    const fetchRealTimeReport = useCallback(async () => {
        try {
            // Add timestamp to bypass any residual browser/proxy cache
            const response = await api.get(
                `/course/attendance/report/${moduleId}?sessionId=${sessionId}&_t=${Date.now()}`
            );
            setReport(response.data);
        } catch (error) {
            console.error("Error polling report", error);
        }
    }, [moduleId, sessionId]);

    // Keep a ref to always have the latest version inside the interval
    const fetchReportRef = useRef(fetchRealTimeReport);
    useEffect(() => { fetchReportRef.current = fetchRealTimeReport; }, [fetchRealTimeReport]);

    // Session timer (5 min) — only depends on sessionActive
    useEffect(() => {
        if (!sessionActive) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [sessionActive]);

    // Polling (3s) — uses ref so it always calls the latest fetchRealTimeReport
    useEffect(() => {
        if (!sessionActive) return;
        fetchReportRef.current(); // immediate first poll
        pollRef.current = setInterval(() => fetchReportRef.current(), 3000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [sessionActive]);

    // Session expiry — fetch final report when 5 min elapsed
    useEffect(() => {
        if (timeLeft === 0 && sessionActive) {
            if (pollRef.current) clearInterval(pollRef.current);
            fetchReportRef.current().then(() => {
                setSessionActive(false);
                setToken(null);
            });
        }
    }, [timeLeft, sessionActive]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerStyles = (seconds: number) => {
        if (seconds > 120) {
            return {
                bg: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                border: '2px solid rgba(59, 130, 246, 0.2)',
                label: 'Session Active',
                className: ''
            };
        } else if (seconds > 60) {
            return {
                bg: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                border: '2px solid rgba(245, 158, 11, 0.2)',
                label: 'Temps Limité',
                className: ''
            };
        } else {
            return {
                bg: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                label: 'Expiration Imminente',
                className: 'animate__animated animate__pulse animate__infinite'
            };
        }
    };

    const generateToken = async () => {
        if (!sessionId) {
            notifyError("Impossible de lancer l'émargement : cette séance n'a pas encore été enregistrée. Sauvegardez-la d'abord.");
            return;
        }
        setLoading(true);
        setReport(null);
        isOnlineRef.current = isOnline;

        let profLatitude: number | undefined;
        let profLongitude: number | undefined;
        if (!isOnline) {
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true })
                );
                profLatitude = pos.coords.latitude;
                profLongitude = pos.coords.longitude;
            } catch {
                setLoading(false);
                notifyError("Impossible d'obtenir votre position GPS. Activez la géolocalisation ou cochez \"Cours en ligne\".");
                return;
            }
        }

        try {
            const response = await api.post('/course/attendance/qr-token', { moduleId, sessionId, isOnline, profLatitude, profLongitude });
            setToken(response.data.token);
            setSessionActive(true);
            setTimeLeft(QR_SESSION_TIME);
        } catch (error) {
            console.error("Error generating QR token", error);
        } finally {
            setLoading(false);
        }
    };

    const stopSession = async () => {
        setLoading(true);
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        try {
            // Use fetchReportRef to get a guaranteed fresh (non-cached) response
            await fetchReportRef.current();
        } catch (error) {
            console.error("Error fetching final report", error);
        } finally {
            setSessionActive(false);
            setToken(null);
            setTimeLeft(0);
            setFullScreen(false);
            setLoading(false);
        }
    };

    const [fullScreen, setFullScreen] = useState(false);

    const toggleFullScreen = () => setFullScreen(!fullScreen);

    const timerStyles = getTimerStyles(timeLeft);

    const qrContent = (
        <div className="text-center">
            <div className="p-3 bg-white d-inline-block rounded-xl shadow-lg mb-4" style={{ border: '12px solid #f8f9fa' }}>
                <QRCodeSVG value={token || ''} size={250} level="H" />
            </div>
            
            <div className="mb-4">
                <div 
                    className={`d-inline-flex flex-column align-items-center px-4 py-2 ${timerStyles.className}`} 
                    style={{ 
                        background: timerStyles.bg, 
                        color: timerStyles.color,
                        borderRadius: '20px',
                        fontWeight: 800,
                        fontSize: '1.6rem',
                        border: timerStyles.border,
                        transition: 'all 0.5s ease',
                        minWidth: '180px'
                    }}
                >
                    <div className="d-flex align-items-center">
                        <i className="fas fa-stopwatch mr-2"></i>
                        {formatTime(timeLeft)}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, marginTop: '2px' }}>
                        {timerStyles.label}
                    </span>
                </div>
            </div>

            <p className="text-muted mb-4 small">
                Scannez ce code avec votre application mobile pour valider votre présence.
            </p>
        </div>
    );

    return (
        <div className="card shadow-lg border-0 p-4" style={{ borderRadius: '24px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', minHeight: '400px' }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
                        <i className="fas fa-qrcode fa-lg"></i>
                    </div>
                    <h5 className="font-weight-bold m-0">Contrôle de Présence</h5>
                </div>
                {token && (
                    <button className="btn btn-link text-accent p-0" onClick={toggleFullScreen} title="Mode Projection">
                        <i className={`fas fa-${fullScreen ? 'compress' : 'expand'}-arrows-alt fa-lg`}></i>
                    </button>
                )}
            </div>
            
            {!token ? (
                <div className="py-5 text-center">
                    <div className="mb-4" style={{ opacity: 0.8 }}>
                        <div className="mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-hover)' }}>
                            <i className="fas fa-shield-alt fa-3x text-muted"></i>
                        </div>
                        <h6 className="font-weight-bold mb-2">Prêt pour l'Émargement</h6>
                        <p className="text-muted small mx-auto" style={{ maxWidth: '250px' }}>Activez le scan pour cette séance. Le code sera projetable en plein écran.</p>
                    </div>
                    <div className="mb-3 d-flex align-items-center justify-content-center">
                        <div
                            className={`d-flex align-items-center px-3 py-2 rounded-pill cursor-pointer ${isOnline ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                            style={{ border: `2px solid ${isOnline ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', userSelect: 'none', fontSize: '0.85rem', fontWeight: 600 }}
                            onClick={() => setIsOnline(v => !v)}
                        >
                            <i className={`fas fa-${isOnline ? 'wifi' : 'map-marker-alt'} mr-2`}></i>
                            {isOnline ? 'Cours en ligne (sans restriction GPS)' : 'Cours en présentiel (GPS requis)'}
                        </div>
                    </div>
                    <button 
                        className="btn btn-primary rounded-pill px-5 py-3 font-weight-bold shadow-lg transform-hover" 
                        style={{ background: 'var(--accent)', border: 'none', fontSize: '1.1rem' }}
                        onClick={generateToken}
                        disabled={loading}
                    >
                        {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-play-circle mr-2"></i>}
                        Lancer l'Émargement
                    </button>
                </div>
            ) : (
                <div className="animate__animated animate__zoomIn">
                    {qrContent}

                    {/* Feedback en temps réel */}
                    <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="small font-weight-bold text-muted text-uppercase">Statut en direct</span>
                            <span className="badge badge-success px-3 rounded-pill animate__animated animate__pulse animate__infinite">
                                {report?.totalPresent || 0} PRÉSENTS
                            </span>
                        </div>
                        {report?.present?.length > 0 ? (
                            <div className="text-left" style={{ fontSize: '0.8rem' }}>
                                <div className="text-muted mb-1">Derniers émargements :</div>
                                {report.present.slice(-3).reverse().map((s: any) => (
                                    <div key={s.username} className="d-flex align-items-center py-1 animate__animated animate__fadeInLeft">
                                        <i className="fas fa-check-circle text-success mr-2" style={{ fontSize: '0.7rem' }}></i>
                                        <span className="font-weight-bold">{s.fullName || s.username}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-muted small py-2">En attente des premiers scans...</div>
                        )}
                    </div>

                    <div className="d-flex justify-content-center gap-3 mt-2">
                        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={async () => {
                            try {
                                const res = await api.post('/course/attendance/qr-token', { 
                                    moduleId, 
                                    sessionId, 
                                    isOnline: isOnlineRef.current 
                                }); 
                                setToken(res.data.token); 
                            } catch(e) {
                                console.error("Erreur de renouvellement du QR Code", e);
                            }
                        }} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                            <i className="fas fa-sync-alt mr-1"></i> Régénérer QR
                        </button>
                        <button className="btn btn-danger rounded-pill px-4 shadow-sm" onClick={stopSession} style={{ background: '#ef4444', border: 'none' }}>
                            <i className="fas fa-stop-circle mr-1"></i> Clôturer
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Projection Plein Écran */}
            {fullScreen && token && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: '#000',
                    zIndex: 9999,
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '40px'
                }}>
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <div>
                            <h1 className="display-4 font-weight-bold mb-0" style={{ color: 'var(--ept-gold)' }}>ÉMARGEMENT EN COURS</h1>
                            <p className="h3 text-light opacity-75">Scannez le QR Code pour valider votre présence</p>
                        </div>
                        <div className="d-flex align-items-center gap-5">
                            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', minWidth: '200px' }}>
                                <div className="h1 font-weight-bold m-0" style={{ color: '#22c55e', fontSize: '4rem' }}>{report?.totalPresent || 0}</div>
                                <div className="h4 text-muted text-uppercase mb-0">Présents</div>
                            </div>
                            <button 
                                className="btn btn-link text-white p-0" 
                                style={{ fontSize: '3rem' }}
                                onClick={toggleFullScreen}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <div className="row flex-grow-1" style={{ minHeight: 0 }}>
                        {/* Colonne Gauche: QR Code */}
                        <div className="col-md-7 d-flex flex-column align-items-center justify-content-center border-right" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className="p-4 bg-white rounded-3xl shadow-lg mb-5" style={{ border: '15px solid #fff' }}>
                                <QRCodeSVG value={token || ''} size={450} level="H" />
                            </div>
                            
                            <div 
                                className={`d-inline-flex flex-column align-items-center px-5 py-3 ${timerStyles.className}`} 
                                style={{ 
                                    background: timerStyles.bg, 
                                    color: timerStyles.color,
                                    borderRadius: '30px',
                                    fontWeight: 900,
                                    border: timerStyles.border,
                                    transition: 'all 0.5s ease',
                                    minWidth: '320px'
                                }}
                            >
                                <div className="d-flex align-items-center justify-content-center" style={{ fontSize: '3.5rem' }}>
                                    <i className="fas fa-stopwatch mr-4"></i>
                                    {formatTime(timeLeft)}
                                </div>
                                <div className="text-uppercase font-weight-bold" style={{ fontSize: '1.2rem', letterSpacing: '2px', opacity: 0.9, marginTop: '5px' }}>
                                    {timerStyles.label}
                                </div>
                            </div>
                        </div>

                        {/* Colonne Droite: Liste des Présents en temps réel */}
                        <div className="col-md-5 d-flex flex-column p-4">
                            <div className="d-flex align-items-center mb-4">
                                <i className="fas fa-list-ul fa-2x mr-3 text-accent"></i>
                                <h2 className="font-weight-bold m-0">LISTE DES PRÉSENTS</h2>
                            </div>
                            <div className="flex-grow-1 overflow-auto pr-3 custom-scrollbar" style={{ maxHeight: '60vh' }}>
                                {report?.present?.length > 0 ? (
                                    <div className="row">
                                        {[...report.present].reverse().map((s: any, idx: number) => (
                                            <div key={s.username} className="col-12 mb-3">
                                                <div className={`p-3 rounded-xl d-flex align-items-center animate__animated ${idx === 0 ? 'animate__bounceInRight' : 'animate__fadeIn'}`} style={{ background: 'rgba(255,255,255,0.05)', borderLeft: '5px solid #22c55e' }}>
                                                    <div className="avatar-circle mr-3" style={{ width: '50px', height: '50px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                        {s.fullName?.charAt(0) || s.username.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="h4 font-weight-bold mb-0">{s.fullName || s.username}</div>
                                                        <div className="text-muted">{s.username}</div>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <i className="fas fa-check-circle text-success fa-2x"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50">
                                        <i className="fas fa-user-clock fa-5x mb-4"></i>
                                        <p className="h3">En attente des premiers scans...</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Bouton de clôture rapide en plein écran */}
                            <div className="mt-4 pt-4 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                <button 
                                    className="btn btn-danger btn-lg w-100 rounded-pill py-3 font-weight-bold shadow-lg"
                                    style={{ background: '#ef4444', border: 'none', fontSize: '1.5rem' }}
                                    onClick={stopSession}
                                    disabled={loading}
                                >
                                    {loading ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-stop-circle mr-3"></i>}
                                    CLÔTURER LA SESSION
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {report && !token && (
                <div className="mt-4 animate__animated animate__fadeIn">
                    <hr />
                    <h6 className="font-weight-bold">Rapport d'Assiduité</h6>
                    <div className="row mt-3">
                        <div className="col-6">
                            <div className="p-2 bg-primary-soft rounded">
                                <div className="h4 font-weight-bold text-primary m-0">{report.totalPresent}</div>
                                <div className="x-small text-muted text-uppercase">Présents</div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-2 bg-danger-soft rounded">
                                <div className="h4 font-weight-bold text-danger m-0">{report.absent?.length || 0}</div>
                                <div className="x-small text-muted text-uppercase">Absents</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="btn-group w-100 shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                            <button 
                                className={`btn btn-sm ${listType === 'present' ? 'btn-primary' : 'btn-light'}`}
                                onClick={() => setListType('present')}
                                style={{ border: 'none' }}
                            >
                                <i className="fas fa-check-circle mr-2"></i> Présents ({report.present?.length || 0})
                            </button>
                            <button 
                                className={`btn btn-sm ${listType === 'absent' ? 'btn-danger' : 'btn-light'}`}
                                onClick={() => setListType('absent')}
                                style={{ border: 'none' }}
                            >
                                <i className="fas fa-times-circle mr-2"></i> Absents ({report.absent?.length || 0})
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 text-left">
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem' }}>
                            {listType === 'present' ? (
                                report.present?.length > 0 ? report.present.map((s: any) => (
                                    <div key={s.username} className="x-small py-2 border-bottom d-flex align-items-center">
                                        <i className="fas fa-user-check mr-2 text-primary"></i>
                                        <div>
                                            <div className="font-weight-bold">{s.fullName || s.username}</div>
                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>{s.username}</div>
                                        </div>
                                    </div>
                                )) : <p className="x-small text-muted text-center py-3">Aucun étudiant n'a encore émargé.</p>
                            ) : (
                                report.absent?.length > 0 ? report.absent.map((s: any) => (
                                    <div key={s.username} className="x-small py-2 border-bottom d-flex align-items-center">
                                        <i className="fas fa-user-times mr-2 text-danger"></i>
                                        <div>
                                            <div className="font-weight-bold">{s.fullName || s.username}</div>
                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>{s.username}</div>
                                        </div>
                                    </div>
                                )) : <p className="x-small text-success text-center py-3">Tout le monde est présent ! 🎉</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRDisplay;
