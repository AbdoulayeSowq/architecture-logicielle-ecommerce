import { notifyError, notifySuccess } from "../../components/notify";
import api from "./api";

export const createMeeting = async (moduleId: number, data: { title: string; description?: string }) => {
    try {
        const response = await api.post(`/meeting/modules/${moduleId}/meetings`, data);
        notifySuccess("Réunion créée avec succès");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur lors de la création de la réunion");
        return null;
    }
};

export const getModuleMeetings = async (moduleId: number) => {
    try {
        const response = await api.get(`/meeting/modules/${moduleId}/meetings`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur lors du chargement des réunions");
        return [];
    }
};

export const getActiveModuleMeetings = async (moduleId: number) => {
    try {
        const response = await api.get(`/meeting/modules/${moduleId}/meetings/active`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur lors du chargement des réunions");
        return [];
    }
};

export const joinMeeting = async (meetingId: number, data: { roomName: string; role: string }) => {
    try {
        const response = await api.post(`/meeting/meetings/${meetingId}/join`, data);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur lors de la connexion à la réunion");
        return null;
    }
};

export const endMeeting = async (meetingId: number) => {
    try {
        await api.post(`/meeting/meetings/${meetingId}/end`);
        notifySuccess("Réunion terminée");
        return true;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur lors de la fin de la réunion");
        return false;
    }
};

export const getMeetingParticipants = async (meetingId: number) => {
    try {
        const response = await api.get(`/meeting/meetings/${meetingId}/participants`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur lors du chargement des participants");
        return [];
    }
};

export const deleteMeeting = async (meetingId: number) => {
    try {
        await api.delete(`/meeting/meetings/${meetingId}`);
        notifySuccess("Réunion supprimée");
        return true;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur lors de la suppression de la réunion");
        return false;
    }
};
