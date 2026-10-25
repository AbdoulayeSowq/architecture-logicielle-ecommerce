import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RoomContext, VideoConference, RoomAudioRenderer, useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import '@livekit/components-styles';
import { mlog, clearMeetingLog } from '../../services/meetingLogger';
import { endMeeting } from '../../services/api/meeting';
import { Button } from '../../components/ui';
import { useMeeting } from '../../context/MeetingContext';
import { useRef } from 'react';
import webSocketService from '../../services/WebSocketService';

const styleSheet = `
@keyframes floatUpAndFadePill {
  0% {
    transform: translateY(0) scale(0.6);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translateY(-30px) scale(1.1);
  }
  100% {
    transform: translateY(-350px) scale(1);
    opacity: 0;
  }
}

.floating-emoji-pill {
  position: absolute;
  bottom: 80px;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: #fff;
  font-size: 0.9rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  animation: floatUpAndFadePill 2.5s ease-out forwards;
  pointer-events: none;
  z-index: 9999;
}

.lk-start-audio-button,
.start-audio-button {
  display: none !important;
}
`;

interface FloatingEmojiItem {
  id: number;
  emoji: string;
  left: number;
  sender: string;
}

const CustomLiveKitInteractions: React.FC = () => {
  const room = useRoomContext();
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [localHandRaised, setLocalHandRaised] = useState(false);
  const [activeEmojis, setActiveEmojis] = useState<FloatingEmojiItem[]>([]);
  const [tileReactions, setTileReactions] = useState<Record<string, string>>({});
  const [showScreenShareWarning, setShowScreenShareWarning] = useState(false);

  const getParticipantName = (identity: string) => {
    if (!room) return identity;
    if (room.localParticipant.identity === identity) {
      return room.localParticipant.name || 'Moi';
    }
    const participant = room.remoteParticipants.get(identity);
    return participant?.name || identity;
  };

  // Détecter le partage d'écran qui contient cette fenêtre (boucle infinie)
  useEffect(() => {
    if (!room) return;

    const checkScreenShare = () => {
      const localParticipant = room.localParticipant;
      const screenTrack: any = Array.from(localParticipant.videoTrackPublications.values() as any)
        .find((pub: any) => pub.source === 'screen_share');
      
      if (screenTrack && screenTrack.track) {
        // L'utilisateur partage son écran - afficher l'avertissement
        setShowScreenShareWarning(true);
      } else {
        setShowScreenShareWarning(false);
      }
    };

    // Vérifier initialement
    checkScreenShare();

    // Écouter les changements de tracks
    const handleTrackPublished = () => checkScreenShare();
    const handleTrackUnpublished = () => checkScreenShare();

    room.localParticipant.on('trackPublished', handleTrackPublished);
    room.localParticipant.on('trackUnpublished', handleTrackUnpublished);

    return () => {
      room.localParticipant.off('trackPublished', handleTrackPublished);
      room.localParticipant.off('trackUnpublished', handleTrackUnpublished);
    };
  }, [room]);

  useEffect(() => {
    if (!room) return;

    // livekit-client v2.x changed the DataReceived signature.
    // The event can fire with (payload, participant, kind, topic) where
    // participant may be undefined (e.g. when mobile sends without topic).
    // We wrap everything defensively to prevent "e.participants is undefined" crashes.
    const handleDataReceived = (...args: any[]) => {
      try {
        // args[0] = Uint8Array payload, args[1] = participant (may be undefined)
        const payload = args[0] as Uint8Array | undefined;
        if (!payload) return;

        const participant = args[1]; // may be undefined — that's OK
        const decoded = new TextDecoder().decode(payload);
        const data = JSON.parse(decoded);

        if (data.type === 'raise_hand') {
          const identity: string | undefined = participant?.identity || data.identity;
          if (identity) {
            setRaisedHands((prev) => {
              const next = new Set(prev);
              if (data.isRaised) {
                next.add(identity);
              } else {
                next.delete(identity);
              }
              return next;
            });
          }
        } else if (data.type === 'reaction') {
          const emoji: string = data.emoji || '💖';
          const identity: string | undefined = participant?.identity || data.identity;
          const senderName = getParticipantName(identity || 'Utilisateur');
          triggerEmoji(emoji, senderName);
          if (identity) {
            triggerTileReaction(identity, emoji);
          }
        } else if (data.type === 'sync_request') {
          if (localHandRaised) {
            publishHandState(true);
          }
        }
      } catch (err) {
        console.error('Erreur décodage paquet WebRTC:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Demander la synchronisation après 2 secondes
    const syncTimeout = setTimeout(() => {
      publishSyncRequest();
    }, 2000);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      clearTimeout(syncTimeout);
    };
  }, [room, localHandRaised]);

  const triggerTileReaction = (identity: string, emoji: string) => {
    setTileReactions((prev) => ({ ...prev, [identity]: emoji }));
    setTimeout(() => {
      setTileReactions((prev) => {
        const next = { ...prev };
        if (next[identity] === emoji) {
          delete next[identity];
        }
        return next;
      });
    }, 3000);
  };

  const triggerEmoji = (emoji: string, senderName: string) => {
    const newItem: FloatingEmojiItem = {
      id: Date.now() + Math.random(),
      emoji,
      left: 10 + Math.random() * 80,
      sender: senderName,
    };
    setActiveEmojis((prev) => [...prev, newItem]);
    setTimeout(() => {
      setActiveEmojis((prev) => prev.filter((item) => item.id !== newItem.id));
    }, 2500);
  };

  const publishHandState = async (isRaised: boolean) => {
    if (!room?.localParticipant) return;
    const me = room.localParticipant.identity;
    const payload = {
      type: 'raise_hand',
      identity: me,
      isRaised,
    };
    try {
      const encoded = new TextEncoder().encode(JSON.stringify(payload));
      await room.localParticipant.publishData(encoded, { reliable: true });
    } catch (e) {
      console.error('Error publishing hand state:', e);
    }
  };

  const publishSyncRequest = async () => {
    if (!room?.localParticipant) return;
    const payload = {
      type: 'sync_request',
    };
    try {
      const encoded = new TextEncoder().encode(JSON.stringify(payload));
      await room.localParticipant.publishData(encoded, { reliable: true });
    } catch (e) {
      console.error('Error publishing sync request:', e);
    }
  };

  const toggleHand = async () => {
    const nextState = !localHandRaised;
    const me = room?.localParticipant?.identity || '';
    
    setLocalHandRaised(nextState);
    setRaisedHands((prev) => {
      const next = new Set(prev);
      if (nextState) {
        next.add(me);
      } else {
        next.delete(me);
      }
      return next;
    });

    await publishHandState(nextState);
  };

  const sendReaction = async (emoji: string) => {
    if (!room?.localParticipant) return;
    const me = room.localParticipant.identity;
    const senderName = room.localParticipant.name || 'Moi';
    const payload = {
      type: 'reaction',
      identity: me,
      emoji,
    };
    try {
      const encoded = new TextEncoder().encode(JSON.stringify(payload));
      await room.localParticipant.publishData(encoded, { reliable: false });
      triggerEmoji(emoji, senderName);
      triggerTileReaction(me, emoji);
    } catch (e) {
      console.error('Error publishing reaction:', e);
    }
  };

  const popInAnimation = `
    @keyframes popInBadge {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;

  const raisedHandsStyles = Array.from(raisedHands)
    .map((identity) => `
      [data-lk-participant-identity="${identity}"] {
        position: relative !important;
      }
      [data-lk-participant-identity="${identity}"]::before {
        content: "✋" !important;
        position: absolute !important;
        top: 12px !important;
        right: 12px !important;
        font-size: 1rem !important;
        background: rgba(0, 0, 0, 0.85) !important;
        border: 1.5px solid #f97316 !important;
        border-radius: 50% !important;
        width: 28px !important;
        height: 28px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
        z-index: 100 !important;
        animation: popInBadge 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important;
      }
    `)
    .join('\n');

  const tileReactionsStyles = Object.entries(tileReactions)
    .map(([identity, emoji]) => {
      const hasRaisedHand = raisedHands.has(identity);
      const rightOffset = hasRaisedHand ? '46px' : '12px';
      return `
        [data-lk-participant-identity="${identity}"] {
          position: relative !important;
        }
        [data-lk-participant-identity="${identity}"]::after {
          content: "${emoji}" !important;
          position: absolute !important;
          top: 12px !important;
          right: ${rightOffset} !important;
          font-size: 1.2rem !important;
          background: rgba(0, 0, 0, 0.85) !important;
          border: 1.5px solid #eab308 !important;
          border-radius: 50% !important;
          width: 32px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
          z-index: 101 !important;
          animation: popInBadge 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important;
        }
      `;
    })
    .join('\n');

  return (
    <>
      <style>{styleSheet}</style>
      <style>{popInAnimation}</style>
      <style>{raisedHandsStyles}</style>
      <style>{tileReactionsStyles}</style>

      {/* Rendu des émojis flottants */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 9999 }}>
        {activeEmojis.map((item) => (
          <div
            key={item.id}
            className="floating-emoji-pill"
            style={{ left: `${item.left}%` }}
          >
            <span style={{ marginRight: '6px', fontWeight: 600 }}>{item.sender}</span>
            <span>{item.emoji}</span>
          </div>
        ))}
      </div>

      {/* Panneau des mains levées */}
      {raisedHands.size > 0 && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 999,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '12px 16px',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          maxWidth: '300px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '6px' }}>
            <span style={{ fontSize: '18px' }}>✋</span>
            <strong style={{ fontSize: '14px', color: '#f97316' }}>Mains levées ({raisedHands.size})</strong>
          </div>
          <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Array.from(raisedHands).map((username) => (
              <div key={username} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316' }} />
                <span>{getParticipantName(username)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Palette de réactions & Bouton main levée - déplacée en haut pour ne pas cacher les contrôles */}
      <div style={{
        position: 'absolute',
        top: 70,  // En haut, sous le panneau des mains levées
        left: 16,
        zIndex: 999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '30px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        flexWrap: 'wrap',
        maxWidth: '90vw',  // Responsive sur mobile
      }}>
        <button
          onClick={toggleHand}
          style={{
            background: localHandRaised ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: localHandRaised ? '1px solid #f97316' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '6px 12px',
            color: localHandRaised ? '#f97316' : '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <span>✋</span>
          <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>
            {localHandRaised ? 'Baisser la main' : 'Lever la main'}
          </span>
        </button>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.2)' }} />

        <div style={{ display: 'flex', gap: '8px' }}>
          {['💖', '👍', '👏', '🎉'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
                transition: 'transform 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Avertissement de boucle infinie quand on partage l'écran contenant cette fenêtre */}
      {showScreenShareWarning && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          background: 'rgba(234, 179, 8, 0.95)',
          backdropFilter: 'blur(15px)',
          border: '2px solid #eab308',
          borderRadius: '16px',
          padding: '24px 32px',
          maxWidth: '500px',
          boxShadow: '0 8px 40px rgba(234, 179, 8, 0.4)',
          textAlign: 'center',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: translate(-50%, -50%) scale(1); }
              50% { transform: translate(-50%, -50%) scale(1.02); }
            }
          `}</style>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ margin: '0 0 12px 0', color: '#000', fontWeight: 700, fontSize: '20px' }}>
            Vous partagez cet onglet
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#000', fontSize: '14px', lineHeight: '1.6' }}>
            Vous partagez l'écran qui contient cette réunion. Cela peut créer un effet miroir infini.
            <br /><strong>Conseil</strong>: Partagez plutôt une fenêtre ou un onglet spécifique.
          </p>
          <button
            onClick={() => setShowScreenShareWarning(false)}
            style={{
              background: '#000',
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            J'ai compris
          </button>
        </div>
      )}
    </>
  );
};

const HostDisconnectInterceptor: React.FC<{ isHost: boolean; meetingId: number }> = ({ isHost, meetingId }) => {
  const room = useRoomContext();
  const { leaveMeeting, endMeetingForEveryone } = useMeeting();
  const [showDialog, setShowDialog] = useState(false);
  const origDisconnectRef = React.useRef<((stopTracks?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (!room || !isHost) return;
    if (!origDisconnectRef.current) {
      origDisconnectRef.current = room.disconnect.bind(room);
    }
    room.disconnect = async (stopTracks?: boolean) => {
      setShowDialog(true);
      return Promise.resolve();
    };
    return () => {
      if (origDisconnectRef.current) {
        room.disconnect = origDisconnectRef.current;
        origDisconnectRef.current = null;
      }
    };
  }, [room, isHost]);

  if (!showDialog) return null;

  const handleLeaveOnly = async () => {
    setShowDialog(false);
    if (origDisconnectRef.current) {
        room.disconnect = origDisconnectRef.current;
    }
    await leaveMeeting();
  };

  const handleEndForAll = async () => {
    setShowDialog(false);
    if (origDisconnectRef.current) {
        room.disconnect = origDisconnectRef.current;
    }
    await endMeetingForEveryone();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1E1E2E', padding: '24px', borderRadius: '16px', maxWidth: '400px', color: 'white', border: '1px solid #333', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-sign-out-alt" style={{ color: '#f97316' }}></i> Quitter la réunion ?
        </h4>
        <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.5' }}>Vous êtes l'organisateur. Souhaitez-vous terminer la réunion pour tous les participants ou simplement quitter ?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
           <Button onClick={() => setShowDialog(false)} style={{ background: 'transparent', color: '#aaa', border: 'none' }}>Annuler</Button>
           <Button onClick={handleLeaveOnly} style={{ background: 'transparent', border: '1px solid #555', color: 'white' }}>Quitter</Button>
           <Button onClick={handleEndForAll} style={{ background: '#ef4444', border: 'none', color: 'white' }}>Terminer pour tous</Button>
        </div>
      </div>
    </div>
  );
};


const MeetingRoom: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { room, isConnected, activeMeeting, joinMeeting, leaveMeeting, navigateAway } = useMeeting();

    const token = searchParams.get('token') || '';
    const rawUrl = searchParams.get('url') || '';
    const serverUrl = rawUrl.replace(/^(wss?:\/\/)[^:\/]+(:\d+.*)$/, `$1${window.location.hostname}$2`);
    const roomName = searchParams.get('room') || '';
    const isHost = searchParams.get('isHost') === 'true';
    const meetingId = parseInt(searchParams.get('meetingId') || '0', 10);
    const title = searchParams.get('title') || 'Réunion';
    const moduleIdParam = searchParams.get('moduleId') || '';

    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Ref synchrone pour signaler une navigation volontaire AVANT le démontage du composant
    const isNavigatingRef = useRef(false);

    useEffect(() => {
        // Réinitialiser le flag de navigation à chaque montage du composant
        isNavigatingRef.current = false;

        clearMeetingLog();
        mlog('INFO', '=== MeetingRoom monté ===');
        mlog('INFO', 'rawUrl (backend):', rawUrl);
        mlog('INFO', 'serverUrl (resolved):', serverUrl);
        mlog('INFO', 'roomName:', roomName);
        mlog('INFO', 'meetingId:', meetingId);
        mlog('INFO', 'isHost:', isHost);
        mlog('INFO', 'token présent:', !!token, '| longueur:', token.length);
        if (!token) mlog('ERROR', 'TOKEN MANQUANT');
        if (!serverUrl) mlog('ERROR', 'SERVER URL MANQUANT');
        if (token) localStorage.setItem('meeting_token', token);
        if (serverUrl) localStorage.setItem('meeting_url', serverUrl);
        if (moduleIdParam) localStorage.setItem('meeting_module_id', moduleIdParam);

        // Rejoindre automatiquement sans activer audio/vidéo (permissions demandées au clic)
        const autoConnect = async () => {
            if (!token || !serverUrl) return;
            
            // Si la room est déjà connectée, pas besoin de reconnecter
            if (room && activeMeeting?.meetingId === meetingId && (room as any).state === 'connected') {
                mlog('INFO', '✅ Room déjà connectée — réutilisation de la session existante');
                return;
            }
            
            try {
                mlog('INFO', '🔌 Connexion automatique LiveKit (audio/vidéo désactivés)...');
                setConnecting(true);
                await joinMeeting(token, serverUrl, meetingId, roomName, title, isHost);
                mlog('INFO', '✅ joinMeeting réussi — room connectée | room:', roomName);
                setConnecting(false);
            } catch (e: any) {
                mlog('ERROR', '❌ Échec connexion LiveKit:', e?.message || String(e));
                setError(e.message || 'Erreur de connexion');
                setConnecting(false);
            }
        };

        autoConnect();
    }, [token, serverUrl, meetingId, moduleIdParam]);

    // Redirection automatique vers la page d'accueil SEULEMENT en cas de déconnexion RÉELLE après avoir été connecté
    useEffect(() => {
        // Ne rediriger que si on était connecté avant (pas pendant la phase de connexion initiale)
        if (!connecting && room && (room as any).state === 'disconnected' && !isNavigatingRef.current) {
            mlog('INFO', '🚪 Déconnexion réelle détectée — redirection automatique vers l\'accueil');
            navigate('/', { replace: true });
        }
    }, [connecting, room, navigate]);

    // Éviction automatique en temps réel lorsque l'organisateur ferme le salon Live
    useEffect(() => {
        const mId = searchParams.get('moduleId') || localStorage.getItem('meeting_module_id') || '';
        if (!mId || !meetingId) return;

        const subId = `mr-ended-${meetingId}-${mId}`;
        mlog('INFO', `📡 [MeetingRoom] Abonnement au topic /topic/module/${mId}/meeting-ended`);
        
        webSocketService.subscribeTopic(subId, `/topic/module/${mId}/meeting-ended`, async (msg: any) => {
            mlog('INFO', `📥 [MeetingRoom] Event meeting-ended reçu:`, msg);
            if (msg && (msg.id === meetingId || parseInt(msg.meetingId || msg.id || '0', 10) === meetingId)) {
                mlog('INFO', `🔴 La réunion actuelle ${meetingId} a été terminée. Éviction immédiate.`);
                await leaveMeeting();
                navigate('/', { replace: true });
            }
        });

        return () => {
            mlog('INFO', `📡 [MeetingRoom] Désabonnement du topic /topic/module/${mId}/meeting-ended`);
            webSocketService.unsubscribeTopic(subId);
        };
    }, [searchParams, meetingId, navigate, leaveMeeting]);

    const handleDisconnected = () => {
        // La gestion de l'état est centralisée dans MeetingContext (RoomEvent.Disconnected).
        // On loggue juste ici pour debug — pas d'action directe.
        if (isNavigatingRef.current) {
            mlog('INFO', '↩️ Navigation volontaire — room maintenue active');
        } else {
            mlog('WARN', '⚠️ onDisconnected reçu depuis LiveKitRoom');
        }
    };

    if (error || !token || !serverUrl) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e' }}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                    <h2>Erreur de connexion</h2>
                    <p>{error || 'Token ou URL du serveur manquant.'}</p>
                    <Button onClick={() => navigate(-1)} style={{ background: '#4a90d9', border: 'none' }}>
                        Retour
                    </Button>
                </div>
            </div>
        );
    }

    if (connecting) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e' }}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                    <div style={{
                        border: '4px solid rgba(255,255,255,0.1)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        borderLeftColor: '#f97316',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 15px'
                    }}></div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                    <h4>Connexion à la visioconférence...</h4>
                </div>
            </div>
        );
    }

    // "Réunion terminée" : redirection automatique immédiate (pas de bouton de retour manuel)
    if (!isConnected || !room || (room as any).state === 'disconnected') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e' }}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                    <div style={{
                        border: '4px solid rgba(255,255,255,0.1)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        borderLeftColor: '#f97316',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 15px'
                    }}></div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                    <h2>Réunion terminée</h2>
                    <p>Vous avez été déconnecté. Redirection vers l'accueil...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Boutons d'action en haut à gauche */}
            <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 9999, display: 'flex', gap: '12px' }}>
                <Button
                    onClick={() => {
                        // ✅ Marquer la navigation comme intentionnelle AVANT de naviguer
                        isNavigatingRef.current = true;
                        navigateAway(); // signale au contexte que c'est une navigation volontaire
                        navigate(-1);
                    }}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                    <i className="fas fa-arrow-left"></i> Retour (Garder l'appel actif)
                </Button>
            </div>

            <RoomContext.Provider value={room}>
                <div className="lk-room-container" data-lk-theme="default" style={{ height: '100%' }}>
                    <VideoConference 
                        options={{
                            audio: false,  // Audio désactivé par défaut
                            video: false,  // Vidéo désactivée par défaut
                        }}
                    />
                    <RoomAudioRenderer />
                    <CustomLiveKitInteractions />
                    <HostDisconnectInterceptor isHost={isHost} meetingId={meetingId} />
                </div>
            </RoomContext.Provider>
        </div>
    );
};

export default MeetingRoom;
