import { notifyError, notifySuccess } from "../../components/notify";
import api from "./api";

export const getAllAnnouncements = async () => {
  try {
    const response = await api.get("/announcement/all");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const createAssignment = async (data: any) => {
  try {
    const response = await api.post("/announcement/assignment", data);
    notifySuccess("Announcement created successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const createExam = async (data: any) => {
  try {
    const response = await api.post("/announcement/exam", data);
    notifySuccess("Announcement created successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const createEvent = async (data: any) => {
  try {
    const response = await api.post("/announcement/event", data);
    notifySuccess("Announcement created successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const createMaintenance = async (data: any) => {
  try {
    const response = await api.post("/announcement/maintenance", data);
    notifySuccess("Announcement created successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const updateAssignment = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`/announcement/assignment/${id}`, data);
    notifySuccess("Assignment updated successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const updateExam = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`/announcement/exam/${id}`, data);
    notifySuccess("Exam updated successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const updateEvent = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`/announcement/event/${id}`, data);
    notifySuccess("Event updated successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const updateMaintenance = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`/announcement/maintenance/${id}`, data);
    notifySuccess("Maintenance updated successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const deleteAnnouncement = async (id: string) => {
  try {
    const response = await api.delete(`/announcement/${id}`);
    notifySuccess("Announcement deleted successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

// ── Filtrage par type ───────────────────────────────────────

export const listByType = async (type: string) => {
  try {
    const response = await api.get(`/announcement/type/${type}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const listAssignments = async () => listByType("assignment");
export const listExams = async () => listByType("exam");
export const listEvents = async () => listByType("event");
export const listMaintenances = async () => listByType("maintenance");

// ── Filtrage par audience ───────────────────────────────────

export const listByAudience = async (audience: string) => {
  try {
    const response = await api.get(`/announcement/audience/${audience}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const listByCourse = async (courseCode: string) => {
  try {
    const response = await api.get(`/announcement/course/${courseCode}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const listByClass = async (classId: string) => {
  try {
    const response = await api.get(`/announcement/class/${classId}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const listForStudent = async (courseCodes: string[], classIds: string[]) => {
  const params = new URLSearchParams();
  if (courseCodes && courseCodes.length > 0) {
    courseCodes.forEach(code => params.append("courseCodes", code));
  }
  if (classIds && classIds.length > 0) {
    classIds.forEach(id => params.append("classIds", id));
  }

  try {
    const response = await api.get(`/announcement/for/student?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

/** Toutes les annonces visibles par les enseignants, filtrées sur leur périmètre */
export const listForLecturer = async (classIds: string[], courseCodes: string[], username: string) => {
  const params = new URLSearchParams();
  if (classIds && classIds.length > 0) {
    classIds.forEach(id => params.append("classIds", id));
  }
  if (courseCodes && courseCodes.length > 0) {
    courseCodes.forEach(code => params.append("courseCodes", code));
  }
  if (username) {
    params.append("username", username);
  }

  try {
    const response = await api.get(`/announcement/for/lecturer?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

// ── Notifications ──────────────────────────────────────────

export const getUserNotifications = async (userId: string) => {
  try {
    const response = await api.get(`/announcement/notifications/user/${userId}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const getUnreadNotifications = async (userId: string) => {
  try {
    const response = await api.get(`/announcement/notifications/user/${userId}/unread`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const sendNotification = async (data: {
  userId: string;
  title: string;
  content: string;
  type?: string;
}) => {
  try {
    const response = await api.post(`/announcement/notifications/send`, data);
    notifySuccess("Notification envoyée");
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const markNotificationAsRead = async (id: number) => {
  try {
    await api.put(`/announcement/notifications/${id}/read`);
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    await api.put(`/announcement/notifications/user/${userId}/read-all`);
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const deleteNotification = async (id: number) => {
  try {
    await api.delete(`/announcement/notifications/${id}`);
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};
