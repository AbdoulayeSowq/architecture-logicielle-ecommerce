import api from "./api";
import { notifyError, notifySuccess } from "../../components/notify";

export interface Message {
    id: number;
    senderUsername: string;
    receiverUsername: string;
    subject: string;
    body: string;
    read: boolean;
    deletedBySender: boolean;
    deletedByReceiver: boolean;
    createdAt: string;
}

export interface SendMessageDto {
    senderUsername: string;
    receiverUsername: string;
    subject: string;
    body: string;
}

export const getInbox = async (username: string): Promise<Message[]> => {
    try {
        const res = await api.get(`/announcement/messages/inbox/${username}`);
        return res.data;
    } catch (e: any) {
        notifyError("Erreur lors du chargement de la boîte de réception");
        return [];
    }
};

export const getSent = async (username: string): Promise<Message[]> => {
    try {
        const res = await api.get(`/announcement/messages/sent/${username}`);
        return res.data;
    } catch (e: any) {
        notifyError("Erreur lors du chargement des messages envoyés");
        return [];
    }
};

export const countUnread = async (username: string): Promise<number> => {
    try {
        const res = await api.get(`/announcement/messages/unread/${username}`);
        return res.data.unread;
    } catch {
        return 0;
    }
};

export const sendMessage = async (dto: SendMessageDto): Promise<Message | null> => {
    try {
        const res = await api.post(`/announcement/messages/send`, dto);
        notifySuccess("Message envoyé avec succès");
        return res.data;
    } catch (e: any) {
        notifyError("Erreur lors de l'envoi du message");
        return null;
    }
};

export const markAsRead = async (id: number): Promise<void> => {
    try {
        await api.put(`/announcement/messages/${id}/read`);
    } catch { }
};

export const deleteMessageByReceiver = async (id: number): Promise<void> => {
    try {
        await api.delete(`/announcement/messages/${id}/receiver`);
    } catch (e: any) {
        notifyError("Erreur lors de la suppression");
    }
};

export const deleteMessageBySender = async (id: number): Promise<void> => {
    try {
        await api.delete(`/announcement/messages/${id}/sender`);
    } catch (e: any) {
        notifyError("Erreur lors de la suppression");
    }
};
