import api from './api';
import { toast } from 'react-toastify';

const notifyError = (msg: string) => {
    if (typeof toast !== 'undefined') toast.error(msg);
    else console.error(msg);
};

export const getGamificationProfile = async (username: string) => {
    try {
        const response = await api.get(`/user/gamification/${username}`);
        return response.data;
    } catch (e) { return null; }
};

export const recordLoginStreak = async (username: string) => {
    try {
        const response = await api.post(`/user/gamification/${username}/login`);
        return response.data;
    } catch (e) { return null; }
};

export const requestMentorship = async (data: { mentorUsername: string, menteeUsername: string, moduleId: number, mentorRole?: string }) => {
    const response = await api.post(`/user/gamification/mentorship/request`, data);
    return response.data;
};

export const getMenteeRequests = async (username: string) => {
    try {
        const response = await api.get(`/user/gamification/mentorship/mentee/${username}`);
        return response.data;
    } catch (e) { return []; }
};

export const getMentorRequests = async (username: string) => {
    try {
        const response = await api.get(`/user/gamification/mentorship/mentor/${username}`);
        return response.data;
    } catch (e) { return []; }
};

export const updateMentorshipStatus = async (id: number, status: string) => {
    const response = await api.put(`/user/gamification/mentorship/${id}/status?status=${status}`);
    return response.data;
};

export const getLeaderboard = async () => {
    try {
        const response = await api.get(`/user/gamification/leaderboard`);
        return response.data;
    } catch (e) { return []; }
};
