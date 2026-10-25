import {notifyError, notifySuccess} from "../../components/notify";
import api from "./api";


// getAdmins is not yet implemented in the backend
export const getAdmins = async () => {
    return [];
}

export const getUserDetails = async () => {
  try {
    const response = await api.get("/user/userInfo");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const getStudentDetailsByUsername = async (username: string) => {
    try {
        const response = await api.get(`/user/student/${username}/username`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response.data);
    }
}

export const getLecturerDetailsByUsername = async (username: string) => {
  try {
    const response = await api.get(`/user/lecturer/${username}/username`);
    const details = response.data;
    if (details && details.supervisedClassName) {
      const dept = (details.department || "").trim().toUpperCase();
      let deptCode = dept;
      if (dept.includes("(") && dept.includes(")")) {
        deptCode = dept.substring(dept.indexOf("(") + 1, dept.indexOf(")")).trim();
      }
      
      const normalized = details.supervisedClassName.split(',')
        .map((c: string) => {
          const supClass = c.trim();
          if (supClass && !supClass.includes("-") && !supClass.includes(" ") && deptCode) {
            return `${supClass} ${deptCode}`.toUpperCase();
          }
          return supClass;
        })
        .join(',');
      details.supervisedClassName = normalized;
    }
    return details;
  } catch (error: any) {
    notifyError(error.response.data);
  }
}

export const getLecturers = async () => {
  try {
    const response = await api.get("/user/admin/lecturers");
    return response.data;
  } catch (error: any) {
    notifyError(error);
    return [];
  }
};
export const getStudents = async () => {
  try {
    const response = await api.get("/user/admin/students");
    return response.data;
  } catch (error: any) {
    notifyError(error);
    return [];
  }
};



export const deleteLecturer = async (username: string) => {
    try {
        const response = await api.delete(`/user/admin/lecturers/username/${username}`);
        notifySuccess("Enseignant supprimé avec succès");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Échec de la suppression");
    }
}

export const getUser = async (username: string) => {
  try {
    const response = await api.get(`/user/admin/users/username/${username}`);
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const createStudent = async (userData: any) => {
  try {
    const response = await api.post("/user/admin/students", userData);
    notifySuccess("Student created successfully");
    return response.data;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const createLecturer = async (userData: any) => {
  try {
    const response = await api.post("/user/admin/lecturers", userData);
    notifySuccess("Lecturer created successfully");
    return response.data;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const updateUser = async (username: string, attributes: any) => {
    // Note: No generic updateUser endpoint exists. Use updateStudent or updateLecturer.
    console.warn("updateUser: endpoint not implemented in backend. No-op.");
    return null;
};

export const deleteUser = async (username: string) => {
    // Note: No generic deleteUser endpoint exists. Use deleteStudent or deleteLecturer.
    console.warn("deleteUser: endpoint not implemented in backend. No-op.");
    return null;
};

export const deleteStudent = async (username: string) => {
  try {
    const response = await api.delete(`/user/admin/students/username/${username}`);
    notifySuccess("Étudiant supprimé avec succès");
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Échec de la suppression");
  }
};
export const getContacts = async () => {
  try {
    const response = await api.get("/user/contacts");
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || "Échec du chargement des contacts");
    return [];
  }
};
