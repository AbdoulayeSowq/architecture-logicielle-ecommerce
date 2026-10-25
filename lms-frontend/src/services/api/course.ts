import {notifyError, notifySuccess} from "../../components/notify";
import api from "./api";
import apiPublic from "./api-public";

export const getCourses = async () => {
    try {
        const response = await api.get("/course");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
        return [];
    }
}

export const createCourse = async (courseData: any) => {
    try {
        const response = await api.post("/course", courseData);
        notifySuccess("Course created successfully");
        return response;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
};

export const getCourseById = async (id: string) => {
    try {
        const response = await api.get(`/course/${id}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
};

export const getCourseNameById = async (id: string) => {
    try {
        // Backend: GET /api/course/name/{courseId}
        const response = await api.get(`/course/name/${id}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const updateCourse = async (id: string, courseData: any) => {
    try {
        const response = await api.put(`/course/${id}`, courseData);
        notifySuccess("Course updated successfully");
        return response;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
};

export const deleteCourse = async (id: string) => {
    try {
        const response = await api.delete(`/course/${id}`);
        notifySuccess("Course deleted successfully");
        return response;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
};

export const assignModuleToCourse = async (courseId: string, moduleId: string) => {
    // This functionality seems to be missing or named differently in the backend
    console.warn("assignModuleToCourse not fully implemented in backend");
    return null;
}

export const getModulesByCourseId = async (moduleId: string) => {
    try {
        // Returns the list of courses (sessions) assigned to a module (EC)
        const response = await api.get(`/course/course/module/${moduleId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getModulesByCourseIdForStudent = async (courseId: string, level?: string) => {
    try {
        const url = level 
            ? `/studentcourse/module/${courseId}/course?level=${level}`
            : `/studentcourse/module/${courseId}/course`;
        const response = await api.get(url);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getTeachingUnitsByClassId = async (classId: string | number) => {
    try {
        const response = await api.get(`/course/teaching-unit/class/${classId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
        return [];
    }
}

export const getModulesByTeachingUnit = async (teachingUnitId: string | number) => {
    try {
        const response = await api.get(`/course/module/teaching-unit/${teachingUnitId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
        return [];
    }
}

export const getModulesByLecturer = async (username: string) => {
    try {
        const response = await api.get(`/course/module/lecturer/${username}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getModulesWithoutAssigned = async () => {
    try {
        const response = await api.get(`/course/module/unassigned`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const unassignModuleFromCourse = async (moduleId: string) => {
    try {
        const response = await api.delete(`/course/unassign/${moduleId}`);
        notifySuccess("Course unassigned successfully");
        return response;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const assignCourseToDepartment = async (departmentId: string, courseId: string) => {
    const response = await api.post(`/uni/department/${departmentId}/course/${courseId}`);
    return response.data;
}

export const getCoursesByDepartmentId = async (id: string) => {
    try {
        const response = await api.get(`/course/department/${id}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getModulesByDepartmentId = async (id: string) => {
    try {
        const response = await api.get(`/course/module/department/${id}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getCoursesWithoutAssigned = async () => {
    try {
        const response = await api.get(`/course/unassigned`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const unassignCourseFromDepartment = async (_departmentId: string, courseId: string) => {
    try {
        // Backend: DELETE /api/course/unassign/{courseId}/department
        const response = await api.delete(`/course/unassign/${courseId}/department`);
        notifySuccess("Cours désassigné du département");
        return response;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getPublicCourses = async (departmentId: string) => {
    try {
        const response = await apiPublic.get(`public/courses/department/${departmentId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getModulesByStudent = async (username: string) => {
    try {
        const response = await api.get(`/studentcourse/student/${username}/modules`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
        return [];
    }
}

// ==========================================
// ASSIGNMENTS
// ==========================================
export const getAssignmentsByModule = async (moduleId: string | number) => {
    try {
        const response = await api.get(`/course/assignments/module/${moduleId}`);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la récupération des devoirs :", error);
        throw error;
    }
};

export const createAssignment = async (assignmentData: any) => {
    try {
        const response = await api.post("/course/assignments", assignmentData);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la création du devoir :", error);
        throw error;
    }
};

export const getAssignmentById = async (id: string | number) => {
    try {
        const response = await api.get(`/course/assignments/${id}`);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la récupération du devoir :", error);
        throw error;
    }
};

export const updateAssignment = async (id: string | number, data: any) => {
    try {
        const response = await api.put(`/course/assignments/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la mise à jour du devoir :", error);
        throw error;
    }
};

export const deleteAssignment = async (id: string | number) => {
    try {
        const response = await api.delete(`/course/assignments/${id}`);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la suppression du devoir :", error);
        throw error;
    }
};

export const submitAssignment = async (assignmentId: string | number, payload: any) => {
    try {
        const response = await api.post(`/course/assignments/${assignmentId}/submit`, payload);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la soumission du devoir :", error);
        throw error;
    }
};

export const getStudentsByModule = async (moduleId: string | number) => {
    try {
        const response = await api.get(`/studentcourse/module/${moduleId}/students`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
        return [];
    }
}

export const getModules = async () => {
    try {
        const response = await api.get("/course/module");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
        return [];
    }
}

export const createModule = async (moduleData: any) => {
    try {
        const response = await api.post("/course/module", moduleData);
        notifySuccess("Module created successfully");
        return response;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const updateModule = async (id: string, data: any) => {
    try {
        const response = await api.put(`/course/module/${id}`, data);
        notifySuccess("Module updated successfully");
        return response;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
};

export const getModuleById = async (id: string) => {
    try {
        const response = await api.get(`/course/module/${id}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
};

export const deleteModule = async (id: string) => {
    try {
        const response = await api.delete(`/course/module/${id}`);
        notifySuccess("Module deleted successfully");
        return response;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getMaterialsByModuleId = async (moduleId: string) => {
    try {
        const response = await api.get(`/course/material/module/${moduleId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const uploadFile = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post("/course/files/upload", formData, {
            headers: { "Content-Type": undefined as any },
        });
        return response.data; // { url, fileName }
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
        throw error;
    }
}

export const createMaterial = async (materialData: any) => {
    try {
        const response = await api.post("/course/material", materialData);
        notifySuccess("Material created successfully");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const deleteMaterial = async (id: string) => {
    try {
        const response = await api.delete(`/course/material/${id}`);
        notifySuccess("Material deleted successfully");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getGradesByStudentId = async (studentId: string) => {
    try {
        const response = await api.get(`/course/grade/student/${studentId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const saveGrade = async (gradeData: any) => {
    try {
        const response = await api.post("/course/grade", gradeData);
        notifySuccess("Grade saved successfully");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

// --- Quiz API Methods ---

export const getQuizzesByModuleId = async (moduleId: string) => {
    try {
        const response = await api.get(`/course/quiz/module/${moduleId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getQuizById = async (id: string) => {
    try {
        const response = await api.get(`/course/quiz/${id}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const createQuiz = async (quizData: any) => {
    try {
        const response = await api.post("/course/quiz", quizData);
        notifySuccess("Quiz created successfully");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const updateQuiz = async (id: string, quizData: any) => {
    try {
        const response = await api.put(`/course/quiz/${id}`, quizData);
        notifySuccess("Quiz updated successfully");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const deleteQuiz = async (id: string) => {
    try {
        const response = await api.delete(`/course/quiz/${id}`);
        notifySuccess("Quiz deleted successfully");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const submitQuiz = async (submissionData: any) => {
    try {
        const response = await api.post("/course/quiz/submit", submissionData);
        notifySuccess("Quiz submitted successfully");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getQuizResultsByStudentId = async (studentId: string) => {
    try {
        const response = await api.get(`/course/quiz/result/student/${studentId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getQuizResultsByQuizId = async (quizId: string) => {
    try {
        const response = await api.get(`/course/quiz/result/quiz/${quizId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getQuizResultsByModuleId = async (moduleId: string | number) => {
    try {
        const response = await api.get(`/course/quiz/result/module/${moduleId}`);
        return Array.isArray(response.data) ? response.data : [];
    } catch {
        return [];
    }
}

// --- Forum API Methods ---

export const getForumThreadsByModuleId = async (moduleId: string) => {
    try {
        const response = await api.get(`/course/forum/module/${moduleId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const getForumThreadById = async (id: string, username?: string) => {
    try {
        const response = await api.get(`/course/forum/thread/${id}`, {
            params: { username }
        });
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const createForumThread = async (dto: any) => {
    try {
        const response = await api.post("/course/forum/thread", dto);
        notifySuccess("Thread créé avec succès");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const createForumPost = async (dto: any) => {
    try {
        const response = await api.post("/course/forum/post", dto);
        notifySuccess("Réponse ajoutée");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const upvoteThread = async (threadId: string, userId: string) => {
    try {
        const response = await api.post(`/course/forum/thread/${threadId}/upvote/${userId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const removeUpvoteThread = async (threadId: string, userId: string) => {
    try {
        const response = await api.delete(`/course/forum/thread/${threadId}/upvote/${userId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const upvotePost = async (postId: string, userId: string) => {
    try {
        const response = await api.post(`/course/forum/post/${postId}/upvote/${userId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const removeUpvotePost = async (postId: string, userId: string) => {
    try {
        const response = await api.delete(`/course/forum/post/${postId}/upvote/${userId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

export const markPostAsSolution = async (threadId: string, postId: string) => {
    try {
        const response = await api.put(`/course/forum/thread/${threadId}/solution/${postId}`);
        notifySuccess("Solution marquée");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
}

// ── Certificats ────────────────────────────────────────────

export const getStudentCertificats = async (studentId: string) => {
    try {
        const response = await api.get(`/course/certificats/student/${studentId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
};

export const verifyCertificat = async (code: string) => {
    try {
        const response = await api.get(`/course/certificats/verify/${code}`);
        return response.data;
    } catch (error: any) {
        // 404 is expected for invalid codes — don't toast
        return null;
    }
};

export const generateCertificat = async (data: {
    studentId: number;
    courseId?: number;
    moduleId?: number;
}) => {
    try {
        const response = await api.post(`/course/certificats/generate`, data);
        notifySuccess("Certificat généré !");
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur inconnue");
    }
};

// ── Apprentissage Adaptatif ──────────────────────────────

export const getRecommendedModules = async (studentId: string) => {
    try {
        const response = await api.get(`/course/adaptive/recommendations/${studentId}`);
        return response.data;
    } catch (error: any) {
        return [];
    }
}

export const getLacunes = async (studentId: string) => {
    try {
        const response = await api.get(`/course/adaptive/lacunes/${studentId}`);
        return response.data;
    } catch (error: any) {
        return [];
    }
}

// ── Early Warning System ──────────────────────────────
export const getAtRiskStudents = async (username: string, moduleId?: number) => {
    try {
        const url = moduleId 
            ? `/course/analytics/at-risk/${username}?moduleId=${moduleId}` 
            : `/course/analytics/at-risk/${username}`;
        const response = await api.get(url);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur lors de la récupération des alertes");
        return [];
    }
}

// ── Attendance (Émargement) ──────────────────────────────
export const getStudentAttendanceHistory = async (studentId: string) => {
    try {
        const response = await api.get(`/course/attendance/history/${studentId}`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur lors de la récupération de l'historique");
        return [];
    }
}

export const getAllAttendance = async () => {
    try {
        const response = await api.get(`/course/attendance/admin/all`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur lors de l'récupération des émargements globaux");
        return [];
    }
}

export const getAttendanceSessions = async () => {
    try {
        const response = await api.get(`/course/attendance/admin/sessions`);
        return response.data;
    } catch (error: any) {
        notifyError(error.response?.data || error.message || "Erreur lors de l'récupération des sessions");
        return [];
    }
}
