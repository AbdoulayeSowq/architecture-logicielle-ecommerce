import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface PrivateRouteProps {
    element: React.ReactElement;
    allowedGroups: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, allowedGroups }) => {
    const { token, role } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (window.location.pathname === '/' && role) {
        if (role === 'ADMIN' || role === 'SCOLARITE' || role === 'CHEF_DEPT' || role === 'RESP_PEDAGO') return <Navigate to="/admin/index" replace />;
        if (role === 'STUDENT') return <Navigate to="/student" replace />;
        if (role === 'LECTURER') return <Navigate to="/lecturer" replace />;
    }

    if (!role || !allowedGroups.includes(role)) {
        if (role === 'ADMIN' || role === 'SCOLARITE' || role === 'CHEF_DEPT' || role === 'RESP_PEDAGO') return <Navigate to="/admin/index" replace />;
        if (role === 'STUDENT') return <Navigate to="/student" replace />;
        if (role === 'LECTURER') return <Navigate to="/lecturer" replace />;
        return <Navigate to="/unauthorized" replace />;
    }

    return element;
};

export default PrivateRoute;
