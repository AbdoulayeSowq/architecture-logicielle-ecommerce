import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignmentById } from '../../../services/api/course';
import AssignmentTake from './AssignmentTake';

const AssignmentTakePage: React.FC = () => {
    const { moduleId, assignmentId } = useParams<{ moduleId: string, assignmentId: string }>();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssignment = async () => {
            if (!assignmentId) return;
            try {
                const data = await getAssignmentById(assignmentId);
                setAssignment(data);
            } catch (err: any) {
                setError(err.message || "Erreur de chargement");
            } finally {
                setLoading(false);
            }
        };
        fetchAssignment();
    }, [assignmentId]);

    const handleClose = () => {
        navigate(`/student/${moduleId}`, { state: { activeTab: 'assignments' } });
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="lms-spinner" />
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="alert alert-danger">{error || "Devoir introuvable"}</div>
                <button className="btn btn-secondary mt-3" onClick={handleClose}>Retour</button>
            </div>
        );
    }

    return (
        <AssignmentTake assignment={assignment} onClose={handleClose} isFullScreenMode={true} />
    );
};

export default AssignmentTakePage;
