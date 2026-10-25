import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import webSocketService from './WebSocketService';
import { toast } from 'react-toastify';
import keycloak from './keycloak';

interface AuthContextType {
    user: any;
    token: string | null;
    role: string | null;
    signIn: (token: string, user: any, role: string) => void;
    signOut: () => void;
    switchRole: (newRole: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<any>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [role, setRole] = useState<string | null>(localStorage.getItem('role'));

    useEffect(() => {
        if (user && user.username && token) {
            webSocketService.connect(
                user.username,
                token,
                (msg) => {
                    toast.info(`Nouveau message de ${msg.senderUsername}: ${(msg.body || msg.content || '').substring(0, 40)}...`, {
                        position: "top-right",
                        autoClose: 5000
                    });
                    window.dispatchEvent(new CustomEvent('wsNewMessage', { detail: msg }));
                },
                (notif) => {
                    toast.success(`🔔 ${notif.title}`, {
                        position: "top-right",
                        autoClose: 5000
                    });
                    window.dispatchEvent(new CustomEvent('wsNewNotification', { detail: notif }));
                }
            );
        }
        return () => {
            webSocketService.disconnect();
        };
    }, [user, token]);

    const signIn = (newToken: string, newUser: any, newRole: string) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('role', newRole);
        setToken(newToken);
        setUser(newUser);
        setRole(newRole);
    };

    const signOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('allRoles');
        setToken(null);
        setUser(null);
        setRole(null);
        try {
            keycloak.logout({ redirectUri: window.location.origin });
        } catch (err) {
            console.error("Erreur lors de la déconnexion Keycloak:", err);
        }
    };

    const switchRole = (newRole: string) => {
        localStorage.setItem('role', newRole);
        setRole(newRole);
    };

    return (
        <AuthContext.Provider value={{ user, token, role, signIn, signOut, switchRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};