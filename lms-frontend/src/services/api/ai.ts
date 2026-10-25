import api from "./api";

export const askAi = async (
  prompt: string,
  moduleId?: number,
  context?: string,
) => {
  try {
    const response = await api.post("/ai/chatbot/ask", {
      prompt,
      moduleId,
      context,
    });
    return response.data;
  } catch (error) {
    console.error("Error asking AI:", error);
    throw error;
  }
};

export const generateQuizAi = async (moduleId: number, context?: string) => {
  try {
    const response = await api.post("/ai/chatbot/generate-quiz", {
      prompt: "generate quiz",
      moduleId,
      context,
    });
    // Parse if string
    if (typeof response.data === "string") {
      return JSON.parse(response.data);
    }
    return response.data;
  } catch (error) {
    console.error("Error generating quiz with AI:", error);
    throw error;
  }
};

/** Extrait proprement le JSON d'une réponse potentiellement enveloppée dans du markdown */
const repairJson = (str: string): string => {
  let json = str.trim();
  const stack: string[] = [];
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (char === '{' || char === '[') stack.push(char === '{' ? '}' : ']');
    else if (char === '}' || char === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === char) stack.pop();
    }
  }
  while (stack.length > 0) json += stack.pop();
  return json;
};

const extractJson = (raw: string): any => {
  if (!raw || !raw.trim()) throw new Error("Réponse vide du serveur IA.");
  let trimmed = raw.trim();
  
  // Detect known error messages
  const errorPrefixes = ["Clé API", "Erreur", "❌", "⚠️", "Ollama :", "Aucun fournisseur"];
  if (errorPrefixes.some((p) => trimmed.startsWith(p))) throw new Error(trimmed);

  // Try to find JSON block
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (e) { trimmed = match[0]; }
  } else {
    const firstBrace = trimmed.indexOf('{');
    if (firstBrace !== -1) trimmed = trimmed.substring(firstBrace);
  }

  // If we reach here, either direct parse failed or we found a partial brace
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    // Attempt repair for truncated JSON
    try {
      const repaired = repairJson(trimmed);
      return JSON.parse(repaired);
    } catch (finalError) {
      console.error("Failed to parse/repair JSON:", trimmed);
      throw new Error("Format JSON invalide ou tronqué (trop de questions ?). Réessayez avec moins de questions.");
    }
  }
};

export const generateRemediation = async (payload: {
  studentId: string;
  moduleId: number;
  quizResultId?: number;
  quizTitle?: string;
  wrongQuestions: Array<{
    questionText: string;
    competence?: string;
    justification?: string;
    correctAnswer?: string;
  }>;
}) => {
  try {
    const response = await api.post("/ai/remediation/generate", payload);
    const data = response.data;
    if (typeof data === "object" && data !== null) return data;
    return JSON.parse(String(data));
  } catch (error: any) {
    const serverMsg = error?.response?.data;
    if (serverMsg && typeof serverMsg === "string") throw new Error(serverMsg);
    console.error("Error generating remediation:", error);
    throw error;
  }
};

export const generateCourseTemplate = async (
  moduleId: number,
  context?: string,
) => {
  try {
    const response = await api.post("/ai/chatbot/generate-template", {
      prompt: "generate course template",
      moduleId,
      context,
    });
    const data = response.data;
    // Réponse déjà parsée en objet par Axios
    if (typeof data === "object" && data !== null) {
      // Détecter un objet d'erreur Ollama/IA retourné à tort comme 200
      if ("error" in data) {
        throw new Error(
          `Modèle IA non disponible : ${
            (data as any).error?.message ||
            "Erreur inconnue. Lancez 'ollama pull llama3.2' ou vérifiez GROQ_API_KEY"
          }`,
        );
      }
      // Vérifier que c'est bien un syllabus
      if (!("seances" in data) && !("moduleInfo" in data)) {
        throw new Error(
          "Réponse IA invalide : structure de syllabus attendue.",
        );
      }
      return data;
    }
    return extractJson(String(data));
  } catch (error: any) {
    // Erreur HTTP (ex: 503 retourné par le backend)
    const serverMsg = error?.response?.data;
    if (serverMsg && typeof serverMsg === "string") {
      throw new Error(serverMsg);
    }
    console.error("Error generating course template with AI:", error);
    throw error;
  }
};

export const analyzeProctoring = async (payload: {
  studentUsername: string;
  quizTitle: string;
  tabSwitchCount: number;
  mouseExitCount: number;
  durationSeconds: number;
  totalQuestions: number;
}) => {
  try {
    const response = await api.post("/ai/proctoring/analyze", payload);
    const data = response.data;
    if (typeof data === "object" && data !== null) return data;
    return JSON.parse(String(data));
  } catch (error) {
    console.error("Error analyzing proctoring:", error);
    throw error;
  }
};
