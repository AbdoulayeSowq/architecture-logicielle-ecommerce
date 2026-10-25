import { notifyError, notifySuccess } from "../../components/notify";
import api from "./api";
import apiPublic from "./api-public";

// ── Cycles ─────────────────────────────────────────────────

export const getCycles = async () => {
  try {
    const response = await api.get("/uni/cycle");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const createCycle = async (data: any) => {
  try {
    const response = await api.post("/uni/cycle", data);
    notifySuccess("Cycle créé avec succès");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const getCycleById = async (id: string) => {
  try {
    const response = await api.get(`/uni/cycle/${id}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const updateCycle = async (id: string, data: any) => {
  try {
    const response = await api.put(`/uni/cycle/${id}/update`, data);
    notifySuccess("Cycle mis à jour avec succès");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const deleteCycle = async (id: string) => {
  try {
    const response = await api.delete(`/uni/cycle/${id}/delete`);
    notifySuccess("Cycle supprimé avec succès");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

/** Départements d'un cycle */
export const getDepartmentsByCycleId = async (id: string) => {
  try {
    const response = await api.get(`/uni/cycle/${id}/departments`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

/** Assigner un département à un cycle */
export const assignDepartmentToCycle = async (cycleId: string, departmentId: string) => {
  const response = await api.post(`/uni/cycle/${cycleId}/department/${departmentId}`);
  return response.data;
};

/** Désassigner un département d'un cycle */
export const unassignDepartmentFromCycle = async (departmentId: string) => {
  try {
    const response = await api.delete(`/uni/department/${departmentId}/unassign`);
    notifySuccess("Département désassigné avec succès");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

// ── Départements ───────────────────────────────────────────

export const getDepartments = async () => {
  try {
    const response = await api.get("/uni/department");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const getDepartmentsWithoutAssigned = async () => {
  try {
    const response = await api.get("/uni/department/unassigned");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const getDepartmentById = async (id: string) => {
  try {
    const response = await api.get(`/uni/department/${id}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const createDepartment = async (data: any) => {
  try {
    const response = await api.post("/uni/department", data);
    notifySuccess("Département créé avec succès");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const updateDepartment = async (id: string, data: any) => {
  try {
    const response = await api.put(`/uni/department/${id}/update`, data);
    notifySuccess("Département mis à jour avec succès");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const deleteDepartment = async (id: string) => {
  try {
    const response = await api.delete(`/uni/department/${id}/delete`);
    notifySuccess("Département supprimé avec succès");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

/** Classes d'un département */
export const getClassesByDepartmentId = async (id: string) => {
  try {
    const response = await api.get(`/uni/department/${id}/classes`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

/** Assigner une classe à un département */
export const assignClassToDepartment = async (departmentId: string, classId: string) => {
  const response = await api.post(`/uni/department/${departmentId}/class/${classId}`);
  return response.data;
};

// ── Classes ────────────────────────────────────────────────

export const getClasses = async () => {
  try {
    const response = await api.get("/uni/class");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const createClass = async (data: any) => {
  try {
    const response = await api.post("/uni/class", data);
    notifySuccess("Classe créée avec succès");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const getClassById = async (id: string) => {
  try {
    const response = await api.get(`/uni/class/${id}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const updateClass = async (id: string, data: any) => {
  try {
    const response = await api.put(`/uni/class/${id}/update`, data);
    notifySuccess("Classe mise à jour avec succès");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const deleteClass = async (id: string) => {
  try {
    const response = await api.delete(`/uni/class/${id}/delete`);
    notifySuccess("Classe supprimée avec succès");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const getClassesWithoutAssigned = async () => {
  try {
    const response = await api.get("/uni/class/unassigned");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const unassignClassFromDepartment = async (classId: string) => {
  try {
    const response = await api.delete(`/uni/class/${classId}/unassign`);
    notifySuccess("Classe désassignée avec succès");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

// ── Public ─────────────────────────────────────────────────

export const getPublicDepartment = async () => {
  try {
    const response = await apiPublic.get("/public/uni/departments");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

// ── Stubs Establishment (backend EPT n'expose pas encore ces endpoints) ─────

export const getEstablishments = async () => {
  return [];
};

export const getEstablishmentById = async (_id: string) => {
  return { id: '', fid: '', name: '', description: '', cycles: [] };
};

export const createEstablishment = async (data: any) => {
  notifyError("Établissement non supporté par le backend actuel");
  return { status: 400, data: { id: '' } };
};

export const updateEstablishment = async (_id: string, _data: any) => {
  notifyError("Établissement non supporté par le backend actuel");
  return { status: 400, data: { id: '' } };
};

export const deleteEstablishment = async (_id: string) => {
  notifyError("Établissement non supporté par le backend actuel");
  return { status: 400, data: { id: '' } };
};

export const assignCycleToEstablishment = async (_estId: string, _cycleId: string) => {
  notifyError("Établissement non supporté par le backend actuel");
  return { status: 400, data: { id: '' } };
};

export const unassignCycleFromEstablishment = async (_cycleId: string) => {
  notifyError("Établissement non supporté par le backend actuel");
  return { status: 400, data: { id: '' } };
};

export const getCyclesWithoutAssigned = async () => {
  // Dans l'architecture EPT actuelle, il n'y a pas de gestion "cycles non assignés"
  // On retourne tous les cycles
  return getCycles();
};

export const getCyclesByEstablishmentId = async (_estId: string) => {
  // Return empty array for stub
  return [];
};
