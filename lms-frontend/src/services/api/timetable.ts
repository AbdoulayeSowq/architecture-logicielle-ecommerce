import api from "./api";
import { notifyError, notifySuccess } from "../../components/notify";

export const getTimetablesByClass = async (classId: string) => {
  try {
    const response = await api.get(`/uni/timetables/class/${classId}`);
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const getLatestPublishedTimetable = async (classId: string) => {
  try {
    const response = await api.get(`/uni/timetables/class/${classId}/latest`);
    return response.data;
  } catch (error: any) {
    // Silent for public view if not found
    return null;
  }
};

export const createTimetable = async (data: any) => {
  try {
    const response = await api.post("/uni/timetables", data);
    notifySuccess("Emploi du temps créé avec succès");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const updateTimetable = async (id: number, data: any) => {
  try {
    const response = await api.put(`/uni/timetables/${id}`, data);
    notifySuccess("Emploi du temps mis à jour");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const publishTimetable = async (id: number) => {
  try {
    const response = await api.post(`/uni/timetables/${id}/publish`);
    notifySuccess("Emploi du temps publié");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const deleteTimetable = async (id: number) => {
  try {
    const response = await api.delete(`/uni/timetables/${id}`);
    notifySuccess("Emploi du temps supprimé");
    return response;
  } catch (error: any) {
    notifyError(error);
  }
};
