import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssignmentBuilder from './AssignmentBuilder';

const AssignmentBuilderPage: React.FC = () => {
    const { moduleId, assignmentId } = useParams<{ moduleId: string, assignmentId: string }>();
    const navigate = useNavigate();

    const handleClose = () => {
        navigate(`/lecturer/${moduleId}`, { state: { activeTab: 'assignments' } });
    };

    const isNew = assignmentId === 'new';

    return (
        <AssignmentBuilder 
            moduleId={moduleId!} 
            assignmentId={isNew ? undefined : assignmentId} 
            onSuccess={handleClose} 
            onCancel={handleClose} 
            isFullScreenMode={true}
        />
    );
};

export default AssignmentBuilderPage;
