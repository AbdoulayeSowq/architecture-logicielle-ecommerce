import { notifyError } from "../../components/notify";
import api from "./api";

// ── Profil Adaptatif ───────────────────────────────────────

export const getProfilAdaptatif = async (username: string) => {
  try {
    const response = await api.get(
      `/user/analytics/student/${username}/profil-adaptatif`,
    );
    return response.data;
  } catch (error: any) {
    // 404 = profil non encore créé, pas d'erreur affichée
    return null;
  }
};

export const updateProfilAdaptatif = async (
  username: string,
  data: {
    classeMoyenne?: number;
    niveauGlobal?: string;
    competences?: Record<string, string>;
  },
) => {
  try {
    const response = await api.post(
      `/user/analytics/student/${username}/profil-adaptatif`,
      data,
    );
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

// ── Recommandations ────────────────────────────────────────

export const getRecommandations = async (username: string) => {
  try {
    const response = await api.get(
      `/user/analytics/student/${username}/recommandations`,
    );
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
    return [];
  }
};

export const createRecommandation = async (
  username: string,
  data: {
    typeReco: string;
    cibleId: string;
    raison?: string;
  },
) => {
  try {
    const response = await api.post(
      `/user/analytics/student/${username}/recommandations`,
      data,
    );
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const markRecommandationAsVue = async (id: number) => {
  try {
    const response = await api.put(`/user/analytics/recommandation/${id}/view`);
    return response.data;
  } catch (error: any) {
    return null;
  }
};

// ── Sessions Adaptatives (course-service) ─────────────────

export const startAdaptiveSession = async (studentId: string, moduleId: number) => {
  const response = await api.post(`/course/adaptive/session/start`, null, {
    params: { studentId, moduleId },
  });
  return response.data;
};

export const getNextAdaptiveQuestion = async (sessionId: number, studentId: string) => {
  try {
    const response = await api.get(`/course/adaptive/session/${sessionId}/next`, {
      params: { studentId },
    });
    // Return null if session completed (empty response)
    if (!response.data) return null;
    return response.data;
  } catch (error: any) {
    // Session completed or no more questions
    return null;
  }
};

export const submitAdaptiveAnswer = async (
  sessionId: number,
  studentId: string,
  body: { questionId: number; selectedOptionId?: string; textAnswer?: string }
) => {
  const response = await api.post(`/course/adaptive/session/${sessionId}/answer`, body, {
    params: { studentId },
  });
  return response.data;
};

export const completeAdaptiveSession = async (sessionId: number, studentId: string) => {
  const response = await api.post(`/course/adaptive/session/${sessionId}/complete`, null, {
    params: { studentId },
  });
  return response.data;
};

export const getAdaptiveSessions = async (studentId: string) => {
  try {
    const response = await api.get(`/course/adaptive/sessions`, { params: { studentId } });
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
};

export const getAdaptiveSessionsByModule = async (studentId: string, moduleId: number) => {
  try {
    const response = await api.get(`/course/adaptive/sessions/module/${moduleId}`, { params: { studentId } });
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
};

// ── Lacunes (course-service) ───────────────────────────────

export const getLacunesEtudiant = async (username: string) => {
  try {
    const response = await api.get(`/course/lacune/student/${username}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    return [];
  }
};
