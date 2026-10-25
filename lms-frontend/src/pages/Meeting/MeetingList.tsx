import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveModuleMeetings, createMeeting, joinMeeting, endMeeting, deleteMeeting } from '../../services/api/meeting';
import { mlog } from '../../services/meetingLogger';
import webSocketService from '../../services/WebSocketService';
import { ConfirmModal } from '../../components/ui';

interface Meeting {
    id: number;
    moduleId: number;
    roomName: string;
    createdBy: string;
    createdAt: string;
    status: string;
    title: string;
    description: string;
}

interface MeetingListProps {
    moduleId: number;
    userRole: string;
    username: string;
}

const MeetingList: React.FC<MeetingListProps> = ({ moduleId, userRole, username }) => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadMeetings();
    }, [moduleId]);

    /* Temps réel — meeting créé ou terminé */
    useEffect(() => {
        const startId = `ml-started-${moduleId}`;
        const endId   = `ml-ended-${moduleId}`;
        webSocketService.subscribeTopic(startId, `/topic/module/${moduleId}/meeting-started`, (m: any) => {
            setMeetings(prev => prev.some(x => x.id === m.id) ? prev : [m, ...prev]);
        });
        webSocketService.subscribeTopic(endId, `/topic/module/${moduleId}/meeting-ended`, (m: any) => {
            setMeetings(prev => prev.filter(x => x.id !== m.id));
        });
        return () => {
            webSocketService.unsubscribeTopic(startId);
            webSocketService.unsubscribeTopic(endId);
        };
    }, [moduleId]);

    const loadMeetings = async () => {
        const data = await getActiveModuleMeetings(moduleId);
        setMeetings(data || []);
    };

    const handleCreateMeeting = async () => {
        if (!title.trim()) return;
        setLoading(true);
        const result = await createMeeting(moduleId, { title, description });
        if (result) {
            /* Mise à jour optimiste — pas besoin de refetch HTTP */
            setMeetings(prev => prev.some(m => m.id === result.id) ? prev : [result, ...prev]);
            setShowCreateModal(false);
            setTitle('');
            setDescription('');
            
            /* ✅ Auto-rejoindre le meeting après création */
            mlog('INFO', '--- Auto-rejoindre après création ---');
            mlog('INFO', 'meetingId:', result.id, '| roomName:', result.roomName);
            const joinResult = await joinMeeting(result.id, { roomName: result.roomName, role: 'HOST' });
            if (joinResult) {
                const stored = localStorage.getItem('user');
                const userObj = stored ? JSON.parse(stored) : null;
                const email = userObj?.email || '';
                const isHost = 'true'; // Le créateur est toujours host
                
                const params = new URLSearchParams({
                    token: joinResult.token,
                    url: joinResult.livekitUrl,
                    room: result.roomName,
                    meetingId: result.id.toString(),
                    isHost: isHost,
                    moduleId: moduleId.toString(),
                    title: result.title || 'Réunion'
                });
                mlog('INFO', 'Navigation auto vers /meeting après création');
                navigate(`/meeting?${params.toString()}`);
            }
        }
        setLoading(false);
    };

    const handleJoinMeeting = async (meeting: Meeting) => {
        setLoading(true);
        const role = userRole === 'LECTURER' ? 'HOST' : 'PARTICIPANT';
        mlog('INFO', '--- Rejoindre meeting ---');
        mlog('INFO', 'meetingId:', meeting.id, '| roomName:', meeting.roomName, '| role:', role);
        const result = await joinMeeting(meeting.id, { roomName: meeting.roomName, role });
        mlog('INFO', 'Réponse joinMeeting:', result);
        if (result) {
            mlog('INFO', 'livekitUrl:', result.livekitUrl, '| token présent:', !!result.token);
            const stored = localStorage.getItem('user');
            const userObj = stored ? JSON.parse(stored) : null;
            const email = userObj?.email || '';
            const isHost = (meeting.createdBy === username || (email && meeting.createdBy === email)).toString();

            const params = new URLSearchParams({
                token: result.token,
                url: result.livekitUrl,
                room: meeting.roomName,
                meetingId: meeting.id.toString(),
                isHost: isHost,
                moduleId: (meeting.moduleId || moduleId).toString(),
            });
            mlog('INFO', 'Navigation vers /meeting?' + params.toString().substring(0, 80) + '...');
            navigate(`/meeting?${params.toString()}`);
        } else {
            mlog('ERROR', 'joinMeeting a retourné null — erreur API');
        }
        setLoading(false);
    };

    const [confirmMeetingAction, setConfirmMeetingAction] = useState<{ type: 'end' | 'delete'; meetingId: number } | null>(null);

    const handleEndMeeting = (meetingId: number) => setConfirmMeetingAction({ type: 'end', meetingId });

    const handleDeleteMeeting = (meetingId: number) => setConfirmMeetingAction({ type: 'delete', meetingId });

    const runConfirmedMeetingAction = async () => {
        if (!confirmMeetingAction) return;
        const { type, meetingId } = confirmMeetingAction;
        setConfirmMeetingAction(null);
        /* Mise à jour optimiste immédiate */
        setMeetings(prev => prev.filter(m => m.id !== meetingId));
        if (type === 'end') await endMeeting(meetingId);
        else await deleteMeeting(meetingId);
    };

    const isLecturer = userRole === 'LECTURER';

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                    <i className="fas fa-video me-2"></i>Réunions en direct
                </h5>
                {isLecturer && (
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <i className="fas fa-plus me-1"></i>Démarrer une réunion
                    </button>
                )}
            </div>
            <div className="card-body">
                {meetings.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <i className="fas fa-video-slash fa-2x mb-2"></i>
                        <p>Aucune réunion active pour le moment</p>
                    </div>
                ) : (
                    <div className="list-group">
                        {meetings.map((meeting) => (
                            <div key={meeting.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1">{meeting.title}</h6>
                                    {meeting.description && (
                                        <small className="text-muted">{meeting.description}</small>
                                    )}
                                    <br />
                                    <small className="text-muted">
                                        <i className="fas fa-user me-1"></i>
                                        Créée par {meeting.createdBy}
                                    </small>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleJoinMeeting(meeting)}
                                        disabled={loading}
                                    >
                                        <i className="fas fa-sign-in-alt me-1"></i>Rejoindre
                                    </button>
                                    {(isLecturer && meeting.createdBy === username) && (
                                        <>
                                            <button
                                                className="btn btn-warning btn-sm"
                                                onClick={() => handleEndMeeting(meeting.id)}
                                                title="Terminer la réunion (met fin à la session)"
                                            >
                                                <i className="fas fa-stop me-1"></i>Terminer
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDeleteMeeting(meeting.id)}
                                                title="Supprimer définitivement la réunion"
                                            >
                                                <i className="fas fa-trash me-1"></i>Supprimer
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Meeting Modal */}
            {showCreateModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Démarrer une réunion</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Titre *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ex: Cours en direct - Chapitre 3"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Description (optionnel)</label>
                                    <textarea
                                        className="form-control"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Description de la réunion..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleCreateMeeting}
                                    disabled={!title.trim() || loading}
                                >
                                    {loading ? 'Création...' : 'Démarrer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                show={!!confirmMeetingAction}
                title={confirmMeetingAction?.type === 'delete' ? 'Supprimer la réunion' : 'Terminer la réunion'}
                message={confirmMeetingAction?.type === 'delete'
                    ? 'Voulez-vous vraiment supprimer cette réunion ? Cette action est irréversible.'
                    : 'Voulez-vous vraiment terminer cette réunion ?'}
                confirmLabel={confirmMeetingAction?.type === 'delete' ? 'Supprimer' : 'Terminer'}
                danger={confirmMeetingAction?.type === 'delete'}
                onConfirm={runConfirmedMeetingAction}
                onCancel={() => setConfirmMeetingAction(null)}
            />
        </div>
    );
};

export default MeetingList;
