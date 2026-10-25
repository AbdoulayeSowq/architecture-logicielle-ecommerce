import api from "./api";
import { notifyError } from "../../components/notify";

export interface TestCaseInput {
  id?: number;
  input: string;
  expectedOutput: string;
  hidden: boolean;
  orderIndex: number;
  weightPercent: number;
}

export interface CodingExerciseInput {
  title: string;
  description: string;
  difficulty: string;
  competence: string;
  starterCode: string;
  referenceSolution?: string;
  allowedLanguages: string[];
  hintsJson?: string;
  published: boolean;
  moduleId?: number | null;
  testCases: TestCaseInput[];
  wrapperCode?: string;
  languageWrappers?: Record<string, string>;
  languageStarterCodes?: Record<string, string>;
  editorial?: string;
}

// Base path — now served by the dedicated practice-service
const BASE = "/practice";

export const listPracticeExercises = async (params?: {
  moduleId?: string | number;
  difficulty?: string;
  competence?: string;
  lecturerView?: boolean;
}) => {
  try {
    const response = await api.get(`${BASE}/exercises`, { params });
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data?.message || error.message || "Erreur");
    return [];
  }
};

export const getPracticeExercise = async (id: string | number, lecturerView = false) => {
  const response = await api.get(`${BASE}/exercises/${id}`, {
    params: { lecturerView },
  });
  return response.data;
};

export const createPracticeExercise = async (data: CodingExerciseInput) => {
  const response = await api.post(`${BASE}/exercises`, data);
  return response.data;
};

export const updatePracticeExercise = async (id: string | number, data: CodingExerciseInput) => {
  const response = await api.put(`${BASE}/exercises/${id}`, data);
  return response.data;
};

export const deletePracticeExercise = async (id: string | number) => {
  await api.delete(`${BASE}/exercises/${id}`);
};

export const submitPracticeCode = async (
  exerciseId: string | number,
  payload: { sourceCode: string; language: string }
) => {
  const response = await api.post(`${BASE}/exercises/${exerciseId}/submit`, payload);
  return response.data;
};

export const runPracticeCode = async (
  exerciseId: string | number,
  payload: { sourceCode: string; language: string }
) => {
  const response = await api.post(`${BASE}/exercises/${exerciseId}/run`, payload);
  return response.data;
};

export const runPracticePlayground = async (
  payload: { sourceCode: string; language: string }
) => {
  const response = await api.post(`${BASE}/playground/run`, payload);
  return response.data;
};

export const getPracticeSubmissions = async (exerciseId: string | number) => {
  const response = await api.get(`${BASE}/exercises/${exerciseId}/submissions`);
  return response.data;
};

export const getPracticeSubmission = async (submissionId: string | number) => {
  const response = await api.get(`${BASE}/submissions/${submissionId}`);
  return response.data;
};

export const getPracticeLeaderboard = async (exerciseId: string | number, limit = 20) => {
  const response = await api.get(`${BASE}/exercises/${exerciseId}/leaderboard`, {
    params: { limit },
  });
  return response.data;
};

export const getPracticeStats = async (exerciseId: string | number) => {
  const response = await api.get(`${BASE}/exercises/${exerciseId}/stats`);
  return response.data;
};

export const getPracticeHint = async (exerciseId: string | number, level: number) => {
  const response = await api.get(`${BASE}/exercises/${exerciseId}/hints/${level}`);
  return response.data;
};

export const generatePracticeDraft = async (topic: string, difficulty: string) => {
  const response = await api.post(`${BASE}/exercises/generate`, { topic, difficulty });
  return response.data;
};

// ── Community Solutions ──────────────────────────────────────────────────────

export const getCommunitySolutions = async (
  exerciseId: string | number,
  params?: { language?: string; sortBy?: string; search?: string; page?: number; size?: number }
) => {
  const response = await api.get(`${BASE}/exercises/${exerciseId}/solutions`, { params });
  return response.data;
};

export const getCommunitySolutionDetail = async (solutionId: string | number) => {
  const response = await api.get(`${BASE}/solutions/${solutionId}`);
  return response.data;
};

export const publishCommunitySolution = async (
  exerciseId: string | number,
  data: {
    title: string;
    descriptionMarkdown: string;
    videoUrl?: string;
    codes: Array<{
      language: string;
      codeContent: string;
      timeComplexity: string;
      spaceComplexity: string;
    }>;
  }
) => {
  const response = await api.post(`${BASE}/exercises/${exerciseId}/solutions`, data);
  return response.data;
};

export const voteCommunitySolution = async (
  solutionId: string | number,
  voteType: "UP" | "DOWN"
) => {
  await api.post(`${BASE}/solutions/${solutionId}/vote`, { voteType });
};

export const addSolutionComment = async (
  solutionId: string | number,
  content: string,
  parentCommentId?: number
) => {
  const response = await api.post(`${BASE}/solutions/${solutionId}/comments`, {
    content,
    parentCommentId,
  });
  return response.data;
};

export const getSolutionComments = async (solutionId: string | number) => {
  const response = await api.get(`${BASE}/solutions/${solutionId}/comments`);
  return response.data;
};
