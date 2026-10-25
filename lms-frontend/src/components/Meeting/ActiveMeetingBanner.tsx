import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMeeting } from '../../context/MeetingContext';

/**
 * Bannière flottante affichée quand une réunion est active en arrière-plan.
 * Visible sur toutes les pages sauf /meeting lui-même.
 */
const ActiveMeetingBanner: React.FC = () => {
    const { activeMeeting, leaveMeeting, room } = useMeeting();
    const navigate = useNavigate();
    const location = useLocation();

    // Ne rien afficher si pas de réunion active ou si on est déjà dans le meeting
    if (!activeMeeting || location.pathname.startsWith('/meeting')) return null;

    const goToMeeting = () => {
        if (room) {
            room.startAudio().catch((err) => {
                console.warn('[ActiveMeetingBanner] Impossible de démarrer l\'audio sur le geste utilisateur:', err);
            });
        }
        navigate('/meeting?' + new URLSearchParams({
            meetingId: String(activeMeeting.meetingId),
            room: activeMeeting.roomName,
            title: activeMeeting.title,
            isHost: String(activeMeeting.isHost),
            // token et url sont dans localStorage
            token: localStorage.getItem('meeting_token') || '',
            url: localStorage.getItem('meeting_url') || '',
            moduleId: localStorage.getItem('meeting_module_id') || '',
        }).toString());
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 15, 25, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(249, 115, 22, 0.5)',
            borderRadius: '50px',
            padding: '10px 16px',
            boxShadow: '0 4px 24px rgba(249, 115, 22, 0.25)',
            animation: 'meetingPulse 2.5s ease-in-out infinite',
            cursor: 'pointer',
        }}
            onClick={goToMeeting}
            title="Cliquer pour retourner à la réunion"
        >
            <style>{`
                @keyframes meetingPulse {
                    0%, 100% { box-shadow: 0 4px 24px rgba(249, 115, 22, 0.25); }
                    50% { box-shadow: 0 4px 30px rgba(249, 115, 22, 0.5); }
                }
                .meeting-banner-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #f97316;
                    animation: meetingDotBlink 1.2s ease-in-out infinite;
                }
                @keyframes meetingDotBlink {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.75); }
                }
            `}</style>

            {/* Indicateur pulsant */}
            <div className="meeting-banner-dot" />

            {/* Texte */}
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                    Réunion en cours
                </span>
                <span style={{ color: '#f97316', fontSize: '11px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeMeeting.title}
                </span>
            </div>

            {/* Bouton rejoindre */}
            <button
                onClick={(e) => { e.stopPropagation(); goToMeeting(); }}
                style={{
                    background: '#f97316',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}
            >
                Retour à l'appel
            </button>

            {/* Bouton quitter la réunion */}
            <button
                onClick={async (e) => {
                    e.stopPropagation();
                    await leaveMeeting();
                }}
                style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#aaa',
                    fontSize: '12px',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0,
                }}
                title="Quitter la réunion"
            >
                ✕
            </button>
        </div>
    );
};

export default ActiveMeetingBanner;
