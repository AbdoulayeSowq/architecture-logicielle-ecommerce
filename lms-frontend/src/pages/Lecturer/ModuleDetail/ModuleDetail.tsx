import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
  getMaterialsByModuleId,
  getModuleById,
  getQuizzesByModuleId,
  getAssignmentsByModule,
  getForumThreadsByModuleId,
  createMaterial,
  deleteMaterial,
  createQuiz,
  deleteQuiz,
  deleteAssignment,
  createForumThread,
  upvoteThread,
} from "../../../services/api/course";
import {
  getStudentDetailsByUsername,
  getLecturerDetailsByUsername,
} from "../../../services/api/user";
import { useAuth as useAuthContext } from "../../../services/AuthContext";
import { SkeletonCard, Breadcrumbs, ConfirmModal, PageTransition, Button } from "../../../components/ui";
import api from "../../../services/api/api";
import {
  generateQuizAi,
  generateCourseTemplate,
} from "../../../services/api/ai";

import PracticeBuilder from "../../Practice/PracticeBuilder";
import { StudentCard } from "../../../components/Student/StudentCard";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";
import QRDisplay from "../../../components/Lecturer/QRDisplay";
import MeetingList from "../../Meeting/MeetingList";
import VideoPlayer from "../../../components/VideoPlayer";
import PdfViewer from "../../../components/PdfViewer";
import { getActiveModuleMeetings, createMeeting, joinMeeting } from "../../../services/api/meeting";
import webSocketService from "../../../services/WebSocketService";
import { notifyError } from "../../../components/notify";

const formatSessionDate = (dateString?: string, durationMinutes?: number) => {
  if (!dateString) return "Non programmée";
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const startStr = date.toLocaleDateString('fr-FR', options);
    if (durationMinutes) {
      const endDate = new Date(date.getTime() + durationMinutes * 60000);
      const endStr = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return `${startStr} (fin à ${endStr})`;
    }
    return startStr;
  } catch (e) {
    return dateString;
  }
};

const generateSyllabusHtml = (t: any): string => {
  const info = t.moduleInfo || {};
  const seances: any[] = t.seances || [];
  const prereqHtml = (t.prerequisites || [])
    .map((p: string) => `<li>${p}</li>`)
    .join("");
  const skillsHtml = (t.skills || [])
    .map((s: string) => `<li>${s}</li>`)
    .join("");
  const biblioHtml = (t.bibliography || [])
    .map((b: string) => `<li>${b}</li>`)
    .join("");
  const toolsHtml = (t.tools || [])
    .map(
      (tool: string) =>
        `<span style="background:#f3f4f6;border:1px solid #d1d5db;padding:3px 12px;border-radius:20px;font-size:13px;margin:3px;display:inline-block">${tool}</span>`,
    )
    .join("");
  const seanceRows = seances
    .map((s: any) => {
      const typeLabel =
        s.typeSeance === "COURS_MAGISTRAL" ? "CM" : s.typeSeance;
      const typeColor =
        s.typeSeance === "COURS_MAGISTRAL"
          ? "#2563eb"
          : s.typeSeance === "TD"
            ? "var(--success)"
            : "var(--warning)";
      return `<tr>
        <td style="text-align:center;padding:10px 14px;border-bottom:1px solid #e5e7eb">
          <span style="background:${typeColor}22;color:${typeColor};border:1px solid ${typeColor};padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700">${typeLabel}${s.ordre}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:600;font-size:14px">${s.title}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#555">${s.objectifs || ""}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;color:#777;font-size:13px">${s.duree ? s.duree / 60 + "h" : "2h"}</td>
      </tr>`;
    })
    .join("");
  const cc = t.evaluation?.continu ?? 40;
  const ex = t.evaluation?.examen ?? 60;
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Syllabus — ${info.title || "Module"}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff}
.header{background:#1a2332;color:#fff;padding:40px 48px}
.header h1{font-size:26px;font-weight:800;margin-bottom:6px}
.header .sub{font-size:13px;opacity:.7;margin-bottom:12px}
.badge{background:rgba(255,255,255,.15);padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid rgba(255,255,255,.3);display:inline-block;margin:3px}
.body{max-width:900px;margin:0 auto;padding:40px 48px}
.section{margin-bottom:32px}
.stitle{font-size:13px;font-weight:700;color:#1a2332;border-left:4px solid var(--accent);padding-left:12px;margin-bottom:14px;text-transform:uppercase;letter-spacing:.5px}
p{color:#374151;line-height:1.7;font-size:14px}
ul{padding-left:20px}li{margin-bottom:6px;font-size:14px;color:#374151;line-height:1.5}
.hgrid{display:flex;gap:16px;flex-wrap:wrap}
.hbox{text-align:center;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;flex:1;min-width:100px}
.hnum{font-size:26px;font-weight:800;color:#1a2332}.hlbl{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
table{width:100%;border-collapse:collapse}
th{background:#1a2332;color:#fff;padding:10px 14px;text-align:left;font-size:13px;font-weight:600}
.ebar{display:flex;border-radius:8px;overflow:hidden;height:36px;margin-top:10px}
.ecc{background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.eex{background:var(--accent);color:#1a2332;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.footer{margin-top:40px;padding-top:20px;border-top:2px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:12px}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<div class="header">
  <div class="sub">${info.code || ""}${info.code && info.semester ? " • " : ""}${info.semester || ""}</div>
  <h1>${info.title || "Module"}</h1>
  <div style="margin-top:12px">
    <span class="badge">📚 Niveau ${info.level || ""}</span>
    <span class="badge">⏱ ${info.totalHours || 0}h Total</span>
    <span class="badge">🎓 ${info.credits || 3} Crédits</span>
  </div>
</div>
<div class="body">
  <div class="section">
    <div class="hgrid">
      <div class="hbox"><div class="hnum">${info.cmHours || 0}h</div><div class="hlbl">Cours Magistraux</div></div>
      <div class="hbox"><div class="hnum">${info.tdHours || 0}h</div><div class="hlbl">Travaux Dirigés</div></div>
      <div class="hbox"><div class="hnum">${info.tpHours || 0}h</div><div class="hlbl">Travaux Pratiques</div></div>
      <div class="hbox" style="border-color:var(--accent);background:#f7fff0"><div class="hnum" style="color:#4a7c00">${info.totalHours || 0}h</div><div class="hlbl">Total</div></div>
    </div>
  </div>
  ${t.description ? `<div class="section"><div class="stitle">Description</div><p>${t.description}</p></div>` : ""}
  ${t.generalObjectives ? `<div class="section"><div class="stitle">Objectif Général</div><p>${t.generalObjectives}</p></div>` : ""}
  ${
    t.prerequisites?.length || t.skills?.length
      ? `<div class="section" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
    ${t.prerequisites?.length ? `<div><div class="stitle">Prérequis</div><ul>${prereqHtml}</ul></div>` : ""}
    ${t.skills?.length ? `<div><div class="stitle">Compétences Acquises</div><ul>${skillsHtml}</ul></div>` : ""}
  </div>`
      : ""
  }
  <div class="section">
    <div class="stitle">Plan de Cours (${seances.length} séances)</div>
    <table><thead><tr><th style="width:80px">Type</th><th>Intitulé</th><th>Objectifs</th><th style="width:60px">Durée</th></tr></thead>
    <tbody>${seanceRows}</tbody></table>
  </div>
  ${
    t.evaluation
      ? `<div class="section"><div class="stitle">Évaluation</div>
    <div class="ebar">
      <div class="ecc" style="width:${cc}%">CC ${cc}%</div>
      <div class="eex" style="width:${ex}%">Examen ${ex}%</div>
    </div>
    ${t.evaluation.description ? `<p style="margin-top:10px">${t.evaluation.description}</p>` : ""}
  </div>`
      : ""
  }
  ${t.bibliography?.length ? `<div class="section"><div class="stitle">Bibliographie</div><ul>${biblioHtml}</ul></div>` : ""}
  ${t.tools?.length ? `<div class="section"><div class="stitle">Outils & Technologies</div><div style="margin-top:8px">${toolsHtml}</div></div>` : ""}
  <div class="footer">Syllabus généré par LMS EPT Intelligence Artificielle</div>
</div></body></html>`;
};

const downloadSyllabus = (template: any) => {
  const html = generateSyllabusHtml(template);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Syllabus_${(template.moduleInfo?.title || "Module").replace(/\s+/g, "_")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const SyllabusSectionBlock: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
  noMargin?: boolean;
}> = ({ title, icon, children, noMargin }) => (
  <div style={{ marginBottom: noMargin ? 0 : "1.5rem" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "0.75rem",
        borderLeft: "3px solid var(--accent)",
        paddingLeft: "0.75rem",
      }}
    >
      <i
        className={`fas ${icon}`}
        style={{ color: "var(--accent)", fontSize: "0.8rem" }}
      ></i>
      <span
        style={{
          color: "#e5eaf3",
          fontSize: "0.8rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </span>
    </div>
    {children}
  </div>
);

const LecturerModuleDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<
    "materials" | "quiz" | "assignments" | "forum" | "lessons" | "chatbot" | "practice"
  >("lessons");
  const [module, setModule] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);
  const [pdfModal, setPdfModal] = useState<{ url: string; title: string } | null>(null);



  // Lesson state
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState<boolean>(false);
  const [activeMeetings, setActiveMeetings] = useState<any[]>([]);
  const [activeDropdownLessonId, setActiveDropdownLessonId] = useState<string | null>(null);

  useEffect(() => {
    const handleWindowClick = () => {
      setActiveDropdownLessonId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, []);

  // Souscription temps réel: meeting démarré / terminé
  useEffect(() => {
    if (!id) return;
    const startId = `meeting-started-${id}`;
    const endId   = `meeting-ended-${id}`;
    webSocketService.subscribeTopic(startId, `/topic/module/${id}/meeting-started`, (meeting: any) => {
      setActiveMeetings(prev => prev.some(m => m.id === meeting.id) ? prev : [meeting, ...prev]);
    });
    webSocketService.subscribeTopic(endId, `/topic/module/${id}/meeting-ended`, (meeting: any) => {
      setActiveMeetings(prev => prev.filter(m => m.id !== meeting.id));
    });
    return () => {
      webSocketService.unsubscribeTopic(startId);
      webSocketService.unsubscribeTopic(endId);
    };
  }, [id]);

  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    objectives: "",
    typeSeance: "COURS_MAGISTRAL",
    format: "IN-PERSON",
    status: "DRAFT",
    duration: 120, // 2h default in minutes
    module: { id: id },
  });

  // Material form
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "PDF",
    fileUrl: "",
    moduleId: id,
  });

  // Quiz form
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizMode, setQuizMode] = useState<'choose' | 'manual' | 'ai'>('choose');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    moduleId: id,
  });

  // Forum form
  const [showForumModal, setShowForumModal] = useState(false);
  const [newThread, setNewThread] = useState({
    title: "",
    content: "",
    authorId: "",
    authorName: "",
    moduleId: id,
  });

  // Template generation
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [importingTemplate, setImportingTemplate] = useState(false);
  const [templateContext, setTemplateContext] = useState("");
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateSuccess, setTemplateSuccess] = useState<string | null>(null);

  const fetchActiveMeetings = async () => {
    if (id) {
      const meetings = await getActiveModuleMeetings(Number(id));
      setActiveMeetings(meetings || []);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (id) {
        const moduleData = await getModuleById(id);
        setModule(moduleData);

        if (activeTab === "lessons") {
          const res = await api.get(`/course/module/${id}/sessions`);
          setLessons(Array.isArray(res.data) ? res.data : []);
          await fetchActiveMeetings();
        } else if (activeTab === "materials") {
          const materialsData = await getMaterialsByModuleId(id);
          setMaterials(Array.isArray(materialsData) ? materialsData : []);
        } else if (activeTab === "quiz") {
          const quizzesData = await getQuizzesByModuleId(id);
          setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
        } else if (activeTab === "assignments") {
          const assignmentsData = await getAssignmentsByModule(id);
          setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        } else if (activeTab === "forum") {
          const threadsData = await getForumThreadsByModuleId(id);
          setThreads(Array.isArray(threadsData) ? threadsData : []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dedicated fetch for lessons (always refreshes regardless of active tab)
  const fetchLessons = async () => {
    try {
      const res = await api.get(`/course/module/${id}/sessions`);
      setLessons(Array.isArray(res.data) ? res.data : []);
      await fetchActiveMeetings();
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab as any);
    }
  }, [location.state]);

  useEffect(() => {
    const resolveIdentity = async () => {
      if (user) {
        const role = localStorage.getItem("role");
        let details: any;
        try {
          if (role === "ROLE_STUDENT")
            details = await getStudentDetailsByUsername(user.username);
          else if (role === "ROLE_LECTURER")
            details = await getLecturerDetailsByUsername(user.username);
        } catch (e) {
          console.error(e);
        }

        setNewThread((prev) => ({
          ...prev,
          authorId: user.username,
          authorName: details?.fullName || user.username,
        }));
      }
    };
    resolveIdentity();
    fetchData();
  }, [id, activeTab, user]);

  // Lesson handlers
  const handleSaveLesson = async (e: any) => {
    if (e) e.preventDefault();
    try {
      const payload = {
        title: activeLesson.title,
        description: activeLesson.description,
        objectifs: activeLesson.objectives,
        typeSeance: activeLesson.typeSeance,
        duree: activeLesson.duration,
        status: activeLesson.status || "DRAFT",
        sessionDate: activeLesson.sessionDate ? (activeLesson.sessionDate.length === 16 ? `${activeLesson.sessionDate}:00` : activeLesson.sessionDate) : null,
        format: activeLesson.format || "in-person",
        autoCreateMeeting: activeLesson.autoCreateMeeting || false,
        meetingRoomName: activeLesson.meetingRoomName || null,
      };
      
      if (editingLessonId) {
        await api.put(`/course/session/${editingLessonId}`, payload, {
          headers: { "X-User-Username": user?.username || "" }
        });
      } else {
        await api.post(`/course/module/${id}/session`, payload, {
          headers: { "X-User-Username": user?.username || "" }
        });
      }
      
      setActiveLesson(null);
      setEditingLessonId(null);
      setIsEditingDetails(false);
      await fetchLessons();
    } catch (error: any) {
      console.error("Error saving lesson:", error);
      const msg = error?.response?.data || error?.message || "Erreur lors de la sauvegarde";
      notifyError(`Impossible d'enregistrer la séance: ${msg}`);
    }
  };

  const enterLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setActiveLesson({
        id: lesson.id,
        title: lesson.title || "",
        description: lesson.description || "",
        objectives: lesson.objectifs || "",
        typeSeance: lesson.typeSeance || "COURS_MAGISTRAL",
        duration: lesson.duree || 120,
        status: lesson.status || "DRAFT",
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        sessionDate: lesson.sessionDate ? lesson.sessionDate.substring(0, 16) : "",
        format: lesson.format || "in-person",
        autoCreateMeeting: lesson.autoCreateMeeting || false,
        meetingRoomName: lesson.meetingRoomName || "",
        hasAttendance: lesson.hasAttendance || false,
    });
    setIsEditingDetails(false);
  };

  const handleStartLive = async () => {
    try {
      const result = await createMeeting(Number(id), {
        title: activeLesson.title || "Cours en direct",
        description: activeLesson.description || ""
      });
      if (result) {
        /* Mise à jour optimiste — le prof voit la réunion immédiatement */
        setActiveMeetings(prev => prev.some(m => m.id === result.id) ? prev : [result, ...prev]);

        // Update the session's meetingRoomName on the backend Course service
        const payload = {
          title: activeLesson.title,
          description: activeLesson.description,
          objectifs: activeLesson.objectives,
          typeSeance: activeLesson.typeSeance,
          duree: activeLesson.duration,
          status: activeLesson.status || "DRAFT",
          sessionDate: activeLesson.sessionDate ? (activeLesson.sessionDate.length === 16 ? `${activeLesson.sessionDate}:00` : activeLesson.sessionDate) : null,
          format: activeLesson.format || "in-person",
          autoCreateMeeting: activeLesson.autoCreateMeeting || false,
          meetingRoomName: result.roomName,
        };
        
        await api.put(`/course/session/${activeLesson.id}`, payload, {
          headers: { "X-User-Username": user?.username || "" }
        });

        // Update local state activeLesson
        setActiveLesson((prev: any) => ({
          ...prev,
          meetingRoomName: result.roomName
        }));
        
        // Fetch updated lessons
        await fetchLessons();

        // Now join the meeting directly
        const role = 'HOST';
        const joinRes = await joinMeeting(result.id, { roomName: result.roomName, role });
        if (joinRes) {
          const email = user?.email || '';
          const isHost = 'true';
          const params = new URLSearchParams({
            token: joinRes.token,
            url: joinRes.livekitUrl,
            room: result.roomName,
            meetingId: result.id.toString(),
            isHost: isHost,
            moduleId: id || '',
          });
          navigate(`/meeting?${params.toString()}`);
        }
      }
    } catch (e: any) {
      console.error("Error starting live meeting:", e);
      notifyError("Erreur lors du démarrage du Live: " + e.message);
    }
  };

  const handleJoinLive = async (meeting: any) => {
    try {
      const role = 'HOST';
      const joinRes = await joinMeeting(meeting.id, { roomName: meeting.roomName, role });
      if (joinRes) {
        const email = user?.email || '';
        const isHost = 'true';
        const params = new URLSearchParams({
          token: joinRes.token,
          url: joinRes.livekitUrl,
          room: meeting.roomName,
          meetingId: meeting.id.toString(),
          isHost: isHost,
          moduleId: id || '',
        });
        navigate(`/meeting?${params.toString()}`);
      }
    } catch (e: any) {
      console.error("Error joining live meeting:", e);
      notifyError("Erreur lors de la connexion au Live: " + e.message);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    setConfirmAction({
      show: true,
      message: 'Voulez-vous vraiment supprimer cette séance ? Cette action est irréversible.',
      onConfirm: async () => {
        setConfirmAction(prev => ({ ...prev, show: false }));
        try {
          await api.delete(`/course/session/${lessonId}`, {
            headers: { "X-User-Username": user?.username || "" }
          });
          setActiveLesson(null);
          setEditingLessonId(null);
          fetchLessons();
        } catch (error: any) {
          console.error("Error deleting lesson:", error);
          const msg = error?.response?.data || error?.message || "Erreur lors de la suppression";
          notifyError(`Impossible de supprimer la séance: ${msg}`);
        }
      }
    });
  };

  const updateLessonStatus = async (lessonId: string, status: string) => {
    try {
      await api.put(`/course/${lessonId}`, { status });
      fetchData();
    } catch (error) {
      console.error("Error updating lesson status:", error);
    }
  };

  // Material handlers
  const handleAddMaterial = async (e: any) => {
    e.preventDefault();
    setUploading(true);
    try {
      let fileUrl = newMaterial.fileUrl;

      // If it's a file type and a file is selected, upload it first
      if (
        newMaterial.type !== "VIDEO" &&
        newMaterial.type !== "LINK" &&
        selectedFile
      ) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await api.post("/course/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        fileUrl = uploadRes.data.url;
      }

      await createMaterial({ ...newMaterial, fileUrl });
      setNewMaterial({
        ...newMaterial,
        title: "",
        description: "",
        fileUrl: "",
      });
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      console.error("Error creating material:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    setConfirmAction({
      show: true,
      message: 'Voulez-vous vraiment supprimer ce support ? Cette action est irreversible.',
      onConfirm: async () => {
        setConfirmAction(prev => ({ ...prev, show: false }));
        try {
          await deleteMaterial(materialId);
          fetchData();
        } catch (error) {
          console.error("Error deleting material:", error);
        }
      }
    });
  };

  // Quiz & Forum handlers
  const handleAddQuiz = async (e: any) => {
    e.preventDefault();
    try {
      await createQuiz(newQuiz);
      setShowQuizModal(false);
      setNewQuiz({ ...newQuiz, title: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating quiz:", error);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    setConfirmAction({
      show: true,
      message: 'Voulez-vous vraiment supprimer ce quiz ? Les resultats des etudiants seront perdus.',
      onConfirm: async () => {
        setConfirmAction(prev => ({ ...prev, show: false }));
        try {
          await deleteQuiz(quizId);
          fetchData();
        } catch (error) {
          console.error("Error deleting quiz:", error);
        }
      }
    });
  };

  const handleDeleteAssignment = async (assignmentId: string | number) => {
    setConfirmAction({
      show: true,
      message: 'Voulez-vous vraiment supprimer ce devoir ? Les soumissions des étudiants seront perdues.',
      onConfirm: async () => {
        setConfirmAction(prev => ({ ...prev, show: false }));
        try {
          await deleteAssignment(assignmentId);
          fetchData();
        } catch (error: any) {
          console.error("Error deleting assignment:", error);
          const msg = error?.response?.data || error?.message || "Erreur lors de la suppression";
          notifyError(`Impossible de supprimer le devoir: ${msg}`);
        }
      }
    });
  };

  const handleGenerateTemplate = async () => {
    setGeneratingTemplate(true);
    setTemplateError(null);
    try {
      const template = await generateCourseTemplate(
        Number(id),
        templateContext || undefined,
      );
      // Patcher moduleInfo avec les vraies données du module
      // (ne pas faire confiance à l'IA pour conserver les valeurs numériques)
      const patchedTemplate = {
        ...template,
        moduleInfo: {
          title: module?.name || template.moduleInfo?.title || "Module",
          code: module?.codeEC || template.moduleInfo?.code || "",
          level: module?.level || template.moduleInfo?.level || "",
          semester: module?.semester || template.moduleInfo?.semester || "",
          cmHours: module?.cmHours ?? template.moduleInfo?.cmHours ?? 0,
          tdHours: module?.tdHours ?? template.moduleInfo?.tdHours ?? 0,
          tpHours: module?.tpHours ?? template.moduleInfo?.tpHours ?? 0,
          totalHours: module?.totalCH ?? template.moduleInfo?.totalHours ?? 0,
          credits: module?.creditsEC ?? template.moduleInfo?.credits ?? 3,
        },
      };
      setGeneratedTemplate(patchedTemplate);
      setShowTemplateModal(true);
    } catch (err: any) {
      console.error("Template generation failed:", err);
      const msg: string = err?.message || "Erreur inconnue";
      if (msg.includes("non configurée") || msg.includes("GROQ_API_KEY")) {
        setTemplateError(
          "⚠️ Le service IA (Groq) n'est pas configuré sur ce serveur.",
        );
      } else {
        setTemplateError(`❌ ${msg.substring(0, 150)}`);
      }
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const handleImportTemplate = async () => {
    if (!generatedTemplate?.seances) return;
    setImportingTemplate(true);
    setTemplateError(null);
    let success = 0;
    let firstError = "";
    for (const seance of generatedTemplate.seances) {
      try {
        await api.post("/course", {
          title: seance.title,
          typeSeance: seance.typeSeance,
          ordre: seance.ordre,
          duree: seance.duree,
          objectifs: seance.objectifs,
          contenu: seance.contenu,
          status: "DRAFT",
          format: "IN-PERSON",
          module: { id: Number(id) },
        });
        success++;
      } catch (err: any) {
        const errMsg = err?.response?.data || err?.message || "Erreur inconnue";
        console.error("Failed to import seance:", seance.title, errMsg);
        if (!firstError) firstError = String(errMsg).substring(0, 120);
      }
    }
    setImportingTemplate(false);
    if (success > 0) {
      setShowTemplateModal(false);
      setGeneratedTemplate(null);
      setTemplateContext("");
      setTemplateError(null);
      setTemplateSuccess(`✅ ${success} séance(s) importée(s) avec succès !`);
      // Fetch les séances directement (sans dépendre du state activeTab)
      try {
        const res = await api.get(`/course/course/module/${id}`);
        setLessons(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Failed to fetch lessons after import", e);
      }
      setActiveTab("lessons" as any);
    } else {
      setTemplateError(
        `❌ Import échoué${firstError ? ` : ${firstError}` : ". Vérifiez la console."}`,
      );
    }
  };

  const handleCreateThread = async (e: any) => {
    e.preventDefault();
    try {
      await createForumThread(newThread);
      setShowForumModal(false);
      setNewThread({ ...newThread, title: "", content: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating thread:", error);
    }
  };

  const handleUpvoteThread = async (e: React.MouseEvent, threadId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      try {
        await upvoteThread(threadId.toString(), user.username);
        fetchData();
      } catch (error) {
        console.error("Error upvoting thread:", error);
      }
    }
  };

  const [confirmAction, setConfirmAction] = useState<{ show: boolean; message: string; onConfirm: () => void }>({ show: false, message: '', onConfirm: () => {} });

  if (loading && !module) return <div className="container py-4"><SkeletonCard count={4} /></div>;

  const tabs = [
    { id: "lessons", label: "Séances", icon: "fa-chalkboard-teacher" },
    { id: "materials", label: "Supports", icon: "fa-book" },
    { id: "quiz", label: "Quiz", icon: "fa-question-circle" },
    { id: "assignments", label: "Devoirs", icon: "fa-file-signature" },
    { id: "practice", label: "Practice", icon: "fa-code" },
    { id: "forum", label: "Forum", icon: "fa-comments" },
    { id: "chatbot", label: "Assistant IA", icon: "fa-robot" },
  ];

  return (
    <PageTransition>
    <div className="content">
      <div className="container py-4">
        <Breadcrumbs items={[
          { label: 'Mes Modules', path: '/lecturer' },
          { label: module?.title?.replace(/^\[.*?\]\s*/, '') || module?.name || 'Module' },
        ]} />
        <ConfirmModal
          show={confirmAction.show}
          title="Confirmation de suppression"
          message={confirmAction.message}
          confirmLabel="Supprimer"
          danger
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(prev => ({ ...prev, show: false }))}
        />

        {/* ── Module Hero Card ── */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)',
          padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            {/* Left: back + title + badges */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <button onClick={() => navigate('/lecturer')} style={{
                width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)',
                background: 'var(--bg-elevated)', color: 'var(--text-primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px',
              }}>
                <i className="fas fa-arrow-left" style={{ fontSize: '0.85rem' }} />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '3px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                    {module?.mId || module?.mid || 'MODULE'}
                  </span>
                  <span style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', padding: '3px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
                    {module?.semester}
                  </span>
                  {module?.level && (
                    <span style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', padding: '3px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
                      {module.level}
                    </span>
                  )}
                </div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                  {module?.title?.replace(/^\[.*?\]\s*/, '') || module?.name}
                </h1>
              </div>
            </div>

            {/* Right: stats chips */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { icon: 'fa-graduation-cap', label: 'ECTS', value: module?.creditsEC ?? 0 },
                { icon: 'fa-clock', label: 'Total', value: `${module?.totalHours || 0}h` },
                { icon: 'fa-chalkboard-teacher', label: 'Séances', value: lessons.length },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '0.6rem 1rem', textAlign: 'center', minWidth: '72px',
                }}>
                  <i className={`fas ${stat.icon}`} style={{ color: 'var(--accent)', fontSize: '0.85rem', display: 'block', marginBottom: '2px' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Heures effectuées
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="number"
                  value={module?.hoursDone || 0}
                  onChange={async (e) => {
                    const val = parseInt(e.target.value);
                    if (isNaN(val)) return;
                    try {
                      await api.put(`/course/module/${id}/hours`, { hoursDone: val });
                      setModule({ ...module, hoursDone: val });
                    } catch (err) { console.error(err); }
                  }}
                  style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px',
                    color: 'var(--text-primary)', fontWeight: 700, width: '52px', textAlign: 'center', padding: '3px 6px', fontSize: '0.9rem',
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  / {module?.totalHours || 0}h
                </span>
                <span style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700, marginLeft: '4px' }}>
                  ({Math.round(Math.min(100, ((module?.hoursDone || 0) / (module?.totalHours || 1)) * 100))}%)
                </span>
              </div>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, ((module?.hoursDone || 0) / (module?.totalHours || 1)) * 100)}%`,
                height: '100%', borderRadius: '4px',
                background: 'var(--accent)',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Live Meetings */}
        {id && !isNaN(Number(id)) && user && (
            <div className="mb-3">
                <MeetingList moduleId={Number(id)} userRole="LECTURER" username={user.username} />
            </div>
        )}

        <StudentCard className="border-0 shadow-sm p-0">
          {/* Tab bar — pill style */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '16px 16px 0 0' }}>
            <div style={{ display: 'flex', overflowX: 'auto', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '4px', gap: '2px' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    border: 'none', cursor: 'pointer',
                    background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                    padding: '0.55rem 1.1rem',
                    borderRadius: '10px',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: '0.83rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.18s ease',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <i className={`fas ${tab.icon}`} style={{ fontSize: '0.78rem' }} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body p-4">
        {/* LESSONS / SÉANCES TAB */}
        {activeTab === "lessons" && !activeLesson && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="font-weight-bold m-0 d-flex align-items-center">
                <i
                  className="fas fa-chalkboard-teacher"
                  style={{ marginRight: "0.5rem", color: "var(--accent)" }}
                ></i>
                Séances ({lessons.length})
              </h5>
              <Button
                onClick={() => {
                  setEditingLessonId(null);
                  setActiveLesson({ title: "", description: "", objectives: "", typeSeance: "COURS_MAGISTRAL", format: "in-person", status: "DRAFT", duration: 120, sessionDate: "", autoCreateMeeting: false, meetingRoomName: "", module: { id } });
                }}
                leftIcon={<i className="fas fa-plus-circle"></i>}
              >
                Nouvelle Séance
              </Button>
            </div>
            {lessons.length === 0 ? (
              <div className="empty-state-box py-5 text-center">
                <i className="fas fa-chalkboard-teacher" style={{ fontSize: "2rem", marginBottom: "1rem" }}></i>
                <p>Aucune séance programmée pour ce module.</p>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'visible' }}>
                {[...lessons].reverse().map((lesson: any, idx: number) => {
                  const typeLabels: any = { COURS_MAGISTRAL: 'CM', TD: 'TD', TP: 'TP', TPE: 'TPE' };
                  const statusColors: any = { DONE: 'var(--success)', DRAFT: '#6b7280', IN_PROGRESS: '#2563eb' };
                  const statusLabels: any = { DONE: 'Terminée', DRAFT: 'Brouillon', IN_PROGRESS: 'En cours' };
                  const isLast = idx === lessons.length - 1;
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => enterLesson(lesson)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '0.9rem 1.25rem',
                        background: 'var(--bg-card)',
                        borderBottom: isLast ? 'none' : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                    >
                      <span style={{
                        minWidth: '36px', textAlign: 'center',
                        fontSize: '0.7rem', fontWeight: 700,
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px', padding: '3px 6px',
                      }}>
                        {typeLabels[lesson.typeSeance] || 'S'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           {lesson.title || `Séance ${lessons.length - idx}`}
                        </div>
                        {lesson.objectifs && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lesson.objectifs}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {lesson.duree || 120} min
                      </span>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                        color: statusColors[lesson.status] || '#6b7280',
                      }}>
                        {statusLabels[lesson.status] || lesson.status || 'Brouillon'}
                      </span>
                      
                      {/* Three dots dropdown */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownLessonId(activeDropdownLessonId === lesson.id ? null : lesson.id);
                          }}
                          className="btn btn-link p-1 text-muted"
                          style={{ border: 'none', background: 'none', color: 'var(--text-secondary)' }}
                        >
                          <i className="fas fa-ellipsis-v" />
                        </button>
                        {activeDropdownLessonId === lesson.id && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              zIndex: 1000,
                              minWidth: '140px',
                              padding: '0.5rem 0',
                              margin: '0.125rem 0 0',
                              fontSize: '0.85rem',
                              color: 'var(--text-primary)',
                              textAlign: 'left',
                              listStyle: 'none',
                              backgroundColor: 'var(--bg-elevated)',
                              backgroundClip: 'padding-box',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setActiveDropdownLessonId(null);
                                enterLesson(lesson);
                                setIsEditingDetails(true);
                              }}
                              className="dropdown-item d-flex align-items-center py-2 px-3 text-left w-100"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                gap: '0.5rem'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-soft-bg)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <i className="fas fa-edit text-primary" style={{ width: '16px' }} />
                              Modifier
                            </button>
                            <button
                              onClick={() => {
                                setActiveDropdownLessonId(null);
                                handleDeleteLesson(lesson.id.toString());
                              }}
                              disabled={lesson.hasAttendance}
                              className="dropdown-item d-flex align-items-center py-2 px-3 text-left w-100"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: lesson.hasAttendance ? 'var(--text-secondary)' : '#ef4444',
                                cursor: lesson.hasAttendance ? 'not-allowed' : 'pointer',
                                opacity: lesson.hasAttendance ? 0.4 : 1,
                                gap: '0.5rem'
                              }}
                              onMouseEnter={(e) => {
                                if (!lesson.hasAttendance) {
                                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                                }
                              }}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              title={lesson.hasAttendance ? "Impossible de supprimer une séance ayant déjà des émargements" : ""}
                            >
                              <i className="fas fa-trash-alt" style={{ width: '16px' }} />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>

                      <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem', color: 'var(--border)', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


        {/* ACTIVE LESSON VIEW (Drill-down) */}
        {activeTab === "lessons" && activeLesson && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center mb-4">
               <button 
                className="btn btn-link text-muted p-0 mr-3" 
                onClick={() => setActiveLesson(null)}
                style={{ fontSize: '1.2rem', background: 'var(--bg-card)', width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
               >
                 <i className="fas fa-arrow-left"></i>
               </button>
               <div>
                  <h4 className="font-weight-bold m-0" style={{ letterSpacing: '-0.5px' }}>
                    {activeLesson.title || 'Nouvelle Séance'}
                  </h4>
                  <p className="text-muted small m-0">
                    <i className="fas fa-university mr-1"></i> {module?.name} • <i className="fas fa-user-tie mr-1 ml-2"></i> {user?.fullName || user?.username}
                  </p>
               </div>
            </div>

            {(!editingLessonId || isEditingDetails) ? (
              <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px', background: 'var(--bg-elevated)' }}>
                <div className="card-body p-4">
                  <div className="row">
                    {/* ... form for new lesson ... */}
                    <div className="col-12 form-group mb-4">
                      <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Titre de la séance</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem 1rem', borderRadius: '10px' }}
                        value={activeLesson.title}
                        onChange={(e) => setActiveLesson({ ...activeLesson, title: e.target.value })}
                        placeholder="Ex: Architecture des microservices"
                      />
                    </div>
                    {/* ... other fields ... */}
                    <div className="col-md-6 form-group mb-4">
                        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Type</label>
                        <select
                          className="form-control"
                          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', height: 'auto', padding: '0.75rem 1rem', borderRadius: '10px' }}
                          value={activeLesson.typeSeance}
                          onChange={(e) => setActiveLesson({ ...activeLesson, typeSeance: e.target.value })}
                        >
                          <option value="COURS_MAGISTRAL">Cours Magistral (CM)</option>
                          <option value="TD">Travaux Dirigés (TD)</option>
                          <option value="TP">Travaux Pratiques (TP)</option>
                          <option value="TPE">Travaux Pratiques Encadrés (TPE)</option>
                        </select>
                    </div>
                    <div className="col-md-6 form-group mb-4">
                        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Durée (min)</label>
                        <input
                          type="number"
                          className="form-control"
                          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem 1rem', borderRadius: '10px' }}
                          value={activeLesson.duration}
                          onChange={(e) => setActiveLesson({ ...activeLesson, duration: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="col-md-6 form-group mb-4">
                        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Date & Heure de début</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem 1rem', borderRadius: '10px' }}
                          value={activeLesson.sessionDate || ""}
                          onChange={(e) => setActiveLesson({ ...activeLesson, sessionDate: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6 form-group mb-4">
                        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Format</label>
                        <select
                          className="form-control"
                          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', height: 'auto', padding: '0.75rem 1rem', borderRadius: '10px' }}
                          value={activeLesson.format || "in-person"}
                          onChange={(e) => setActiveLesson({ ...activeLesson, format: e.target.value })}
                        >
                          <option value="in-person">Présentiel</option>
                          <option value="online">En ligne</option>
                        </select>
                    </div>
                    {activeLesson.format === "online" && (
                      <div className="col-12 form-group mb-4">
                        <div className="custom-control custom-checkbox d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            id="autoCreateMeeting"
                            checked={activeLesson.autoCreateMeeting || false}
                            onChange={(e) => setActiveLesson({ ...activeLesson, autoCreateMeeting: e.target.checked })}
                          />
                          <label className="custom-control-label ml-2" htmlFor="autoCreateMeeting" style={{ cursor: "pointer", color: "var(--text-primary)" }}>
                            Créer automatiquement un salon Live à l'heure du cours
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2 mt-4">
                    <Button onClick={handleSaveLesson} leftIcon={<i className={editingLessonId ? "fas fa-save" : "fas fa-plus-circle"}></i>}>
                      {editingLessonId ? "Enregistrer les modifications" : "Créer la séance"}
                    </Button>
                    {editingLessonId && (
                      <button className="btn btn-outline-secondary px-4" style={{ borderRadius: "10px" }} onClick={() => setIsEditingDetails(false)}>
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="row mb-4">
                <div className="col-md-8">
                  <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px', background: 'var(--bg-elevated)' }}>
                    <div className="card-body p-4">
                      <h6 className="font-weight-bold text-uppercase text-muted mb-4" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>
                        <i className="fas fa-info-circle mr-2"></i> Informations Séance
                      </h6>
                      {activeLesson.hasAttendance && (
                        <div className="alert alert-warning py-3 px-3 mb-4 d-flex align-items-start" style={{ borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: 'var(--warning)', gap: '0.75rem' }}>
                          <i className="fas fa-exclamation-triangle mt-1" style={{ fontSize: '1.2rem' }}></i>
                          <div>
                            <strong className="d-block mb-1">Séance active</strong>
                            <span style={{ fontSize: '0.82rem' }}>Cette séance ne peut plus être supprimée car des étudiants y ont déjà émargé.</span>
                          </div>
                        </div>
                      )}
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <small className="text-muted d-block mb-1">Type de cours</small>
                          <span className="badge badge-primary px-3 py-2" style={{ borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)', fontWeight: 600 }}>
                             {activeLesson.typeSeance?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="col-md-6 mb-3">
                          <small className="text-muted d-block mb-1">Format</small>
                          <span className={`badge px-3 py-2`} style={{ 
                            borderRadius: '8px', 
                            background: activeLesson.format === 'online' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                            color: activeLesson.format === 'online' ? 'var(--accent)' : '#f59e0b',
                            fontWeight: 600
                          }}>
                             {activeLesson.format === 'online' ? 'En ligne' : 'Présentiel'}
                          </span>
                        </div>
                        <div className="col-12 mb-3">
                          <small className="text-muted d-block mb-1">Date & Heure prévues</small>
                          <div className="font-weight-bold" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            <i className="far fa-calendar-alt mr-2 text-muted"></i>
                            {formatSessionDate(activeLesson.sessionDate, activeLesson.duration)}
                          </div>
                        </div>

                        {activeLesson.format === "online" && (
                          <div className="col-12 mb-3 mt-2">
                            <div className="p-3 border rounded" style={{ borderColor: 'var(--border)', background: 'var(--bg-base)', borderRadius: '12px' }}>
                              <h6 className="font-weight-bold mb-2" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <i className="fas fa-video mr-2 text-primary"></i> Visioconférence (Live Meet)
                              </h6>
                              {(() => {
                                const matchingMeeting = activeMeetings.find(
                                  (m: any) => m.roomName === activeLesson.meetingRoomName
                                );
                                if (matchingMeeting) {
                                  return (
                                    <div>
                                      <span className="badge mb-3 px-2 py-1" style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.3)' }}>
                                        <span className="spinner-grow spinner-grow-sm mr-1" role="status" aria-hidden="true" style={{ width: '8px', height: '8px' }}></span>
                                        Cours en direct actif
                                      </span>
                                      <button 
                                        className="btn btn-primary btn-block py-2 font-weight-bold d-flex align-items-center justify-content-center"
                                        style={{ borderRadius: '8px', gap: '0.5rem', background: 'var(--accent)', borderColor: 'var(--accent)' }}
                                        onClick={() => handleJoinLive(matchingMeeting)}
                                      >
                                        <i className="fas fa-sign-in-alt"></i> Rejoindre le Live
                                      </button>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div>
                                      <p className="text-muted small mb-3">
                                        {activeLesson.meetingRoomName 
                                          ? "Le salon Live de ce cours n'est pas encore démarré ou a été terminé."
                                          : "Aucun salon Live n'a été créé pour cette séance."}
                                      </p>
                                      <button 
                                        className="btn btn-primary btn-block py-2 font-weight-bold d-flex align-items-center justify-content-center"
                                        style={{ borderRadius: '8px', gap: '0.5rem' }}
                                        onClick={handleStartLive}
                                      >
                                        <i className="fas fa-play-circle"></i> Démarrer le Live
                                      </button>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        )}

                        {activeLesson.objectives && (
                          <div className="col-12 mt-2">
                            <small className="text-muted d-block mb-2">Objectifs pédagogiques</small>
                            <p className="m-0" style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>{activeLesson.objectives}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                   <QRDisplay moduleId={id!} sessionId={activeLesson.id} />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "materials" && (
          <div className="row">
            {/* Add form */}
            <div className="col-lg-4 mb-4">
              <div className="card shadow-sm border-0" style={{ background: 'var(--bg-elevated)', borderRadius: '16px' }}>
                <div className="card-body p-4" style={{ borderBottom: "1px solid var(--border)" }}>
                  <h6 className="font-weight-bold m-0 text-uppercase" style={{ color: "var(--text-secondary)", letterSpacing: '1px' }}>Nouveau Support</h6>
                </div>
                <form onSubmit={handleAddMaterial}>
                  <div className="card-body p-4">
                    <div className="form-group mb-4">
                      <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Titre</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        value={newMaterial.title}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-group mb-4">
                      <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Description</label>
                      <textarea
                        rows={3}
                        className="form-control"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        value={newMaterial.description}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-group mb-4">
                      <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Type</label>
                      <select
                        className="form-control"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        value={newMaterial.type}
                        onChange={(e) =>
                          setNewMaterial({ ...newMaterial, type: e.target.value })
                        }
                      >
                        <option value="PDF">Document PDF</option>
                        <option value="VIDEO">Lien Vidéo</option>
                        <option value="LINK">Site Web Externe</option>
                      </select>
                    </div>
                    {newMaterial.type === "VIDEO" ||
                    newMaterial.type === "LINK" ? (
                      <div className="form-group mb-4">
                        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">
                          {newMaterial.type === "VIDEO"
                            ? "Lien URL de la vidéo"
                            : "Lien du site web"}
                        </label>
                        <input
                          type="url"
                          required
                          className="form-control"
                          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          value={newMaterial.fileUrl}
                          onChange={(e) =>
                            setNewMaterial({
                              ...newMaterial,
                              fileUrl: e.target.value,
                            })
                          }
                          placeholder={
                            newMaterial.type === "VIDEO"
                              ? "https://youtube.com/..."
                              : "https://..."
                          }
                        />
                      </div>
                    ) : (
                      <div className="form-group mb-4">
                        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Fichier</label>
                        <input
                          type="file"
                          required={!newMaterial.fileUrl}
                          style={{ padding: "0.4rem", color: 'var(--text-primary)' }}
                          onChange={(e) =>
                            setSelectedFile(
                              e.target.files ? e.target.files[0] : null,
                            )
                          }
                        />
                        <small
                          style={{
                            color: "var(--text-secondary)",
                            marginTop: "0.2rem",
                            display: "block",
                          }}
                        >
                          PDF, DOCX, ZIP, etc.
                        </small>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={uploading}
                      className="btn font-weight-bold w-100 shadow-sm"
                      style={{
                        borderRadius: '10px',
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        padding: '0.75rem',
                        opacity: uploading ? 0.7 : 1,
                      }}
                    >
                      {uploading ? (
                        <span><i className="fas fa-spinner fa-spin mr-2"></i> Envoi...</span>
                      ) : (
                        <span><i className="fas fa-plus-circle mr-2"></i> Ajouter au Module</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* List */}
            <div className="col-lg-8">
              {materials.length === 0 ? (
                <div className="empty-state-box py-5 text-center" style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                  <i className="fas fa-folder-open fa-3x mb-3 text-muted"></i>
                  <p style={{ color: 'var(--text-secondary)' }}>Aucun support de cours disponible.</p>
                </div>
              ) : (
                <div className="row">
                  {materials.map((mat) => (
                    <div key={mat.id} className="col-md-6 mb-3">
                      <div
                        className="material-card d-flex align-items-center p-3 rounded"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", gap: '1rem', transition: 'all 0.2s ease', position: 'relative' }}
                      >
                        <div style={{ 
                            background: mat.type === 'PDF' ? 'rgba(239, 68, 68, 0.1)' : (mat.type === 'VIDEO' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(6, 182, 212, 0.1)'), 
                            color: mat.type === 'PDF' ? '#ef4444' : (mat.type === 'VIDEO' ? 'var(--accent)' : '#06b6d4'),
                            width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <i className={`fas ${mat.type === 'PDF' ? 'fa-file-pdf' : (mat.type === 'VIDEO' ? 'fa-video' : 'fa-link')} fa-lg`}></i>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h6 className="mb-0 font-weight-bold text-truncate" style={{ color: 'var(--text-primary)' }}>{mat.title}</h6>
                          <small style={{ color: 'var(--text-secondary)' }}>{mat.description || "Support de cours"}</small>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                          {mat.type === 'VIDEO' ? (
                            <button
                              onClick={(e) => { e.preventDefault(); setVideoModal({ url: mat.fileUrl, title: mat.title }); }}
                              className="btn btn-sm"
                              style={{ color: 'var(--accent)', background: 'rgba(37,99,235,0.1)', borderRadius: '8px' }}
                              title="Lire la vidéo"
                            >
                              <i className="fas fa-play"></i>
                            </button>
                          ) : mat.type === 'PDF' ? (
                            <button
                              onClick={(e) => { e.preventDefault(); setPdfModal({ url: mat.fileUrl, title: mat.title }); }}
                              className="btn btn-sm"
                              style={{ color: 'var(--accent)', background: 'rgba(37,99,235,0.1)', borderRadius: '8px' }}
                              title="Voir le PDF"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          ) : (
                            <a
                              href={mat.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm"
                              style={{ color: 'var(--accent)', background: 'rgba(37,99,235,0.1)', borderRadius: '8px' }}
                              title="Ouvrir le lien"
                            >
                              <i className="fas fa-external-link-alt"></i>
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteMaterial(mat.id)}
                            className="btn btn-sm"
                            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUIZ TAB */}
        {activeTab === "quiz" && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="font-weight-bold m-0 text-uppercase" style={{ color: "var(--text-secondary)", letterSpacing: '1px' }}>Évaluations</h5>
              <button
                className="btn btn-primary font-weight-bold rounded"
                onClick={() => setShowQuizModal(true)}
              >
                <i className="fas fa-plus"></i> Nouveau Quiz
              </button>
            </div>
            {quizzes.length === 0 ? (
              <div className="empty-state-box py-5 text-center" style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                <i className="fas fa-question-circle fa-3x mb-3 text-muted"></i>
                <p style={{ color: 'var(--text-secondary)' }}>Aucun quiz n'a été créé.</p>
              </div>
            ) : (
              <div className="row">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="col-md-6 mb-3">
                    <div 
                      className="assignment-card rounded"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", overflow: 'hidden', transition: 'all 0.2s ease', position: 'relative' }}
                    >
                      <div style={{ height: '5px', background: 'var(--accent)' }} />
                      <div className="p-4">
                        <h6 className="font-weight-bold mb-2" style={{ color: 'var(--text-primary)' }}>{quiz.title}</h6>
                        <p
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.85rem",
                            marginBottom: "1.5rem",
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {quiz.description || 'Aucune description fournie.'}
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(37, 99, 235, 0.1)',
                              color: "var(--accent)",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              padding: '6px 12px',
                              borderRadius: '8px'
                            }}
                          >
                            <i className="fas fa-list-ol mr-1"></i>
                            {quiz.questionCount ?? quiz.questions?.length ?? 0} Questions
                          </span>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Link
                              to={`/lecturer/${id}/quiz`}
                              state={{ editQuizId: quiz.id }}
                              className="btn btn-sm"
                              style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '8px',
                                  background: 'rgba(37, 99, 235, 0.1)',
                                  color: 'var(--accent)',
                                  fontWeight: 700
                              }}
                              title="Modifier / Ajouter des questions"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="btn btn-sm"
                              style={{
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444'
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === "assignments" && (
          <div>
            <div className="row">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="m-0 font-weight-bold" style={{ color: 'var(--text-primary)' }}>Devoirs & Évaluations</h4>
                  <button className="btn btn-primary shadow-sm rounded-pill font-weight-bold" onClick={() => {
                      navigate(`/lecturer/${id}/assignment/new/edit`);
                  }}>
                    <i className="fas fa-plus mr-2"></i> Nouveau Devoir
                  </button>
                </div>
                {assignments.length === 0 ? (
                  <div className="empty-state-box py-5 text-center" style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                    <i
                      className="fas fa-file-signature fa-3x mb-3 text-muted"
                    ></i>
                    <p style={{ color: 'var(--text-secondary)' }}>Aucun devoir n'a été créé pour ce module.</p>
                  </div>
                ) : (
                  <div className="row">
                    {assignments.map((assignment: any) => (
                      <div key={assignment.id} className="col-12 mb-3">
                        <div
                          className="d-flex align-items-center justify-content-between rounded"
                          style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                            padding: "1.25rem 1.5rem",
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <h6
                              style={{
                                margin: 0,
                                color: "var(--text-primary)",
                                fontWeight: 700,
                              }}
                            >
                              {assignment.title}
                            </h6>
                            <p
                              style={{
                                margin: "0.25rem 0 0",
                                color: "var(--text-secondary)",
                                fontSize: "0.85rem",
                              }}
                            >
                              {assignment.description || "Aucune description"}
                            </p>
                            <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem" }}>
                              <span style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 700 }}>
                                <i className="fas fa-star mr-1"></i>
                                {assignment.maxScore} pts
                              </span>
                              <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                <i className="fas fa-calendar-alt mr-1"></i>
                                Expire le {new Date(assignment.dueDate).toLocaleDateString()}
                              </span>
                              {assignment.isAiGenerated && (
                                <span style={{ color: "#a855f7", fontSize: "0.85rem" }}>
                                  <i className="fas fa-magic mr-1"></i> Généré par l'IA
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button className="btn btn-outline-primary btn-sm rounded-circle mr-2" onClick={() => navigate(`/lecturer/${id}/assignment/${assignment.id}/edit`)} title="Modifier" aria-label="Modifier le devoir">
                                <i className="fas fa-edit"></i>
                              </button>
                            <button
                              title="Supprimer le devoir"
                              aria-label="Supprimer le devoir"
                              className="btn btn-sm"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                fontWeight: 700
                              }}
                              onClick={() => handleDeleteAssignment(assignment.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === "forum" && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="font-weight-bold m-0 text-uppercase d-flex align-items-center" style={{ color: "var(--text-secondary)", letterSpacing: '1px' }}>Discussions</h5>
              <button
                className="btn btn-primary font-weight-bold rounded"
                onClick={() => setShowForumModal(true)}
              >
                <i className="fas fa-plus"></i> Nouvelle Discussion
              </button>
            </div>
            {threads.length === 0 ? (
              <div className="empty-state-box py-5 text-center" style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                <i className="fas fa-comments fa-3x mb-3 text-muted"></i>
                <p style={{ color: 'var(--text-secondary)' }}>Aucune discussion dans le forum.</p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {threads.map((thread) => (
                  <div key={thread.id} className="rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div
                      className="p-4"
                      style={{ display: "flex", gap: "1rem" }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "12px",
                          background: "rgba(37,99,235,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--accent)",
                          fontWeight: "bold",
                        }}
                      >
                        <i className="fas fa-user" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="font-weight-bold mb-0" style={{ margin: 0, color: 'var(--text-primary)' }}>
                            {thread.title}
                            {thread.solution && (
                              <span
                                className="badge"
                                style={{
                                  marginLeft: "0.5rem",
                                  fontSize: "0.7rem",
                                  background: "rgba(20, 184, 166, 0.1)",
                                  color: "#14b8a6",
                                  padding: "4px 8px",
                                  borderRadius: '8px'
                                }}
                              >
                                <i className="fas fa-check"></i> Résolu
                              </span>
                            )}
                          </h6>
                          <span
                            style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
                          >
                            {new Date(thread.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.9rem",
                            margin: "0.5rem 0",
                          }}
                        >
                          {thread.content.substring(0, 150)}...
                        </p>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                            display: "flex",
                            gap: "1.5rem",
                            fontWeight: 600
                          }}
                        >
                          <span>
                            <i className="fas fa-eye mr-2"></i>{thread.viewCount}
                          </span>
                          <span>
                            <i className="fas fa-thumbs-up mr-2" style={{ color: 'var(--accent)' }}></i>
                            {thread.upvoteCount}
                          </span>
                          <span>
                            <i className="fas fa-comment mr-2"></i>
                            {thread.postCount ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRACTICE TAB */}
        {activeTab === "practice" && id && (
          <PracticeBuilder moduleId={id} embedded />
        )}

        {/* CHATBOT TAB */}
        {activeTab === "chatbot" && (
          <div className="card shadow-sm border-0 mb-3" style={{ padding: "3rem", borderRadius: '24px' }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '24px', 
                background: 'rgba(37, 99, 235, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: 'var(--accent)',
                fontSize: '2.5rem'
              }}>
                <i className="fas fa-robot"></i>
              </div>
              <h2 className="font-weight-bold m-0">Assistant Pédagogique IA</h2>
              <p style={{ color: "var(--text-secondary)", maxWidth: '600px', margin: '0.5rem auto' }}>
                Boostez votre productivité avec l'intelligence artificielle. Générez des quiz, 
                optimisez vos plans de cours et facilitez les échanges.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
              }}
            >
              <div
                className="card shadow-sm border-0 mb-3" style={{ background: "var(--bg-base)", padding: "2rem", borderStyle: 'dashed' }}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'rgba(37, 99, 235, 0.1)', 
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <i className="fas fa-magic"></i>
                </div>
                <h3 className="font-weight-bold mb-2">Génération de Quiz</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: '1.5rem' }}>
                  Analyse automatique de vos supports pour créer une évaluation pertinente de 5 questions.
                </p>
                <button
                  style={{ width: "100%" }}
                  disabled={generatingQuiz}
                  onClick={() => {
                    setConfirmAction({
                      show: true,
                      message: "Générer un quiz basé sur les supports de ce module ?",
                      onConfirm: async () => {
                        setConfirmAction(prev => ({ ...prev, show: false }));
                        setGeneratingQuiz(true);
                        try {
                          const quizData = await generateQuizAi(Number(id));
                          navigate(`/lecturer/${id}/quiz`, {
                            state: { aiGeneratedQuiz: quizData },
                          });
                        } catch (err) {
                          console.error("Quiz generation failed:", err);
                          notifyError("Erreur lors de la génération du quiz. Réessayez.");
                        } finally {
                          setGeneratingQuiz(false);
                        }
                      },
                    });
                  }}
                >
                  {generatingQuiz
                    ? <><i className="fas fa-spinner fa-spin mr-2"></i> Génération...</>
                    : <><i className="fas fa-magic mr-2"></i> Générer un Quiz IA</>}
                </button>
              </div>

              <div
                className="card shadow-sm border-0 mb-3" style={{ background: "var(--bg-base)", padding: "2rem", borderStyle: 'dashed' }}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'rgba(56, 189, 248, 0.1)', 
                  color: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <i className="fas fa-comment-alt"></i>
                </div>
                <h3 className="font-weight-bold mb-2">Chat Pédagogique</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: '1.5rem' }}>
                  Préparez vos cours ou vérifiez la cohérence de vos supports en discutant avec l'assistant.
                </p>
                <button
                  style={{
                    
                    width: "100%",
                    color: "#0ea5e9",
                    borderColor: "#0ea5e9",
                  }}
                  onClick={() => {
                    const widget = document.querySelector(".chatbot-toggle") as HTMLButtonElement;
                    if (widget) widget.click();
                  }}
                >
                  <i className="fas fa-comments mr-2"></i> Ouvrir le Chat
                </button>
              </div>

              <div
                className="card shadow-sm border-0 mb-3" style={{ background: "var(--bg-base)", padding: "2rem", borderStyle: 'dashed' }}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'rgba(168, 85, 247, 0.1)', 
                  color: '#a855f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <i className="fas fa-layer-group"></i>
                </div>
                <h3 className="font-weight-bold mb-2">Plan de Cours</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: '1rem' }}>
                  Générez un plan structuré (CM, TD, TP) adapté à la charge horaire.
                </p>
                <textarea
                  placeholder="Instructions (ex: focus sur la pratique...)"
                  rows={2}
                  style={{
                    
                    fontSize: "0.85rem",
                    marginBottom: '1rem',
                    background: 'var(--bg-card)'
                  }}
                  value={templateContext}
                  onChange={(e) => setTemplateContext(e.target.value)}
                />
                <button
                  style={{
                    
                    width: "100%",
                    background: "#a855f7",
                  }}
                  disabled={generatingTemplate}
                  onClick={handleGenerateTemplate}
                >
                  {generatingTemplate ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i> Génération...</>
                  ) : (
                    <><i className="fas fa-magic mr-2"></i> Générer le Plan</>
                  )}
                </button>
                {templateError && (
                  <p
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.6rem 0.8rem",
                      background: "#ff3e3e11",
                      border: "1px solid #ff3e3e44",
                      borderRadius: 4,
                      color: "#ff7070",
                      fontSize: "0.82rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {templateError}
                  </p>
                )}
                {templateSuccess && (
                  <p
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.6rem 0.8rem",
                      background: "var(--accent)11",
                      border: "1px solid var(--accent)44",
                      borderRadius: 4,
                      color: "var(--accent)",
                      fontSize: "0.82rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {templateSuccess}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
          </div>
        </StudentCard>

        {/* Video Modal */}
        {videoModal && (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}
                onClick={() => setVideoModal(null)}
            >
                <div
                    style={{
                        background: 'var(--bg-card, #fff)',
                        color: 'var(--text-primary, #1f2937)',
                        borderRadius: '12px',
                        maxWidth: '900px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        border: '1px solid var(--border, #e2e8f0)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border, #e2e8f0)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <h5 style={{ margin: 0, fontWeight: 700 }}>{videoModal.title}</h5>
                        <button
                            onClick={() => setVideoModal(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                color: 'var(--text-secondary, #64748b)',
                            }}
                        >
                            ×
                        </button>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <VideoPlayer url={videoModal.url} autoplay />
                    </div>
                </div>
            </div>
        )}

        {/* PDF Modal */}
        {pdfModal && (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}
                onClick={() => setPdfModal(null)}
            >
                <div
                    style={{
                        background: 'var(--bg-card, #fff)',
                        color: 'var(--text-primary, #1f2937)',
                        borderRadius: '12px',
                        maxWidth: '1000px',
                        width: '100%',
                        maxHeight: '95vh',
                        overflow: 'hidden',
                        border: '1px solid var(--border, #e2e8f0)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border, #e2e8f0)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <h5 style={{ margin: 0, fontWeight: 700 }}>{pdfModal.title}</h5>
                        <button
                            onClick={() => setPdfModal(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                color: 'var(--text-secondary, #64748b)',
                            }}
                        >
                            ×
                        </button>
                    </div>
                    <div style={{ padding: '20px', maxHeight: '85vh', overflow: 'auto' }}>
                        <PdfViewer url={pdfModal.url} height="75vh" />
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* MODALS REMOVED - Using drill-down view */}

      {showQuizModal && (
        <div className="d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", position: "fixed", top: 0, bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
          <div style={{ maxWidth: '520px', width: '90%', background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}>

            {/* Header */}
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 className="font-weight-bold m-0">
                {quizMode === 'choose' && 'Nouveau Quiz'}
                {quizMode === 'manual' && <><button onClick={() => setQuizMode('choose')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginRight: '8px', padding: 0 }}><i className="fas fa-arrow-left" /></button>Création manuelle</>}
                {quizMode === 'ai' && <><button onClick={() => setQuizMode('choose')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginRight: '8px', padding: 0 }}><i className="fas fa-arrow-left" /></button>Génération IA</>}
              </h5>
              <button onClick={() => { setShowQuizModal(false); setQuizMode('choose'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: 1 }}>
                <i className="fas fa-times" />
              </button>
            </div>

            {/* Step 1 — Choose mode */}
            {quizMode === 'choose' && (
              <div className="p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={() => setQuizMode('manual')} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px',
                  cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
                }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fas fa-pencil-alt" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Créer manuellement</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Définissez le titre, la description et ajoutez vos questions une par une.</div>
                  </div>
                  <i className="fas fa-chevron-right ml-auto" style={{ color: 'var(--border)', flexShrink: 0 }} />
                </button>

                <button onClick={() => setQuizMode('ai')} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px',
                  cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
                }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fas fa-magic" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Générer avec l'IA <span style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.12)', color: '#6366f1', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, marginLeft: '6px' }}>AUTO</span></div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>L'IA analyse vos supports et génère automatiquement 5 questions pertinentes.</div>
                  </div>
                  <i className="fas fa-chevron-right ml-auto" style={{ color: 'var(--border)', flexShrink: 0 }} />
                </button>
              </div>
            )}

            {/* Step 2a — Manual */}
            {quizMode === 'manual' && (
              <form onSubmit={handleAddQuiz}>
                <div className="p-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Titre du Quiz</label>
                    <input type="text" required placeholder="Ex: Évaluation de mi-parcours" className="form-control"
                      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem 1rem', borderRadius: '10px' }}
                      value={newQuiz.title} onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Description</label>
                    <textarea rows={3} placeholder="Instructions pour les étudiants..." className="form-control"
                      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem 1rem', borderRadius: '10px' }}
                      value={newQuiz.description} onChange={e => setNewQuiz({ ...newQuiz, description: e.target.value })} />
                  </div>
                </div>
                <div className="p-4" style={{ borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem' }}>
                  <Button variant="secondary" onClick={() => { setShowQuizModal(false); setQuizMode('choose'); }} style={{ flex: 1 }}>Annuler</Button>
                  <Button type="submit" style={{ flex: 2 }}>Créer &amp; Ajouter les questions</Button>
                </div>
              </form>
            )}

            {/* Step 2b — AI */}
            {quizMode === 'ai' && (
              <div className="p-4">
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <i className="fas fa-info-circle mr-2" style={{ color: 'var(--accent)' }} />
                    L'IA va analyser les supports uploadés sur ce module et générer un quiz de <strong>5 questions</strong> avec 4 choix de réponses chacune. Vous pourrez modifier les questions après génération.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button variant="secondary" onClick={() => { setShowQuizModal(false); setQuizMode('choose'); }} style={{ flex: 1 }} disabled={generatingQuiz}>Annuler</Button>
                  <Button style={{ flex: 2 }} loading={generatingQuiz} leftIcon={!generatingQuiz ? <i className="fas fa-magic" /> : undefined}
                    onClick={async () => {
                      setGeneratingQuiz(true);
                      try {
                        const quizData = await generateQuizAi(Number(id));
                        setShowQuizModal(false);
                        setQuizMode('choose');
                        navigate(`/lecturer/${id}/quiz`, { state: { aiGeneratedQuiz: quizData } });
                      } catch {
                        notifyError("Erreur lors de la génération. Vérifiez que des supports sont uploadés.");
                      } finally {
                        setGeneratingQuiz(false);
                      }
                    }}>
                    {generatingQuiz ? 'Génération en cours...' : 'Lancer la génération'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showForumModal && (
        <div className="d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", position: "fixed", top: 0, bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
          <div style={{ maxWidth: '600px', width: '90%', background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid var(--border)', position: 'relative', zIndex: 10000 }}>
            <div className="p-4 border-bottom" style={{ borderColor: 'var(--border) !important', background: 'rgba(37, 99, 235, 0.05)' }}>
              <h4 className="font-weight-bold m-0 d-flex align-items-center">
                <i className="fas fa-comments mr-3 text-primary"></i>
                Nouvelle Discussion
              </h4>
            </div>
            <form onSubmit={handleCreateThread}>
              <div className="p-4">
                <div className="form-group mb-4">
                  <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Sujet de la discussion</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Question sur le TP de demain"
                    className="form-control"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem 1rem', borderRadius: '10px' }}
                    value={newThread.title}
                    onChange={(e) =>
                      setNewThread({ ...newThread, title: e.target.value })
                    }
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Message initial</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Posez votre question ou lancez le débat..."
                    className="form-control"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem 1rem', borderRadius: '10px' }}
                    value={newThread.content}
                    onChange={(e) =>
                      setNewThread({ ...newThread, content: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="p-4 border-top d-flex gap-3" style={{ borderColor: 'var(--border) !important' }}>
                <Button variant="secondary" onClick={() => setShowForumModal(false)} style={{ flex: 1 }}>
                  Annuler
                </Button>
                <Button type="submit" style={{ flex: 2 }}>
                  Publier sur le Forum
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTemplateModal && generatedTemplate && (
        <div className="d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", position: "fixed", top: 0, bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "16px",
              maxWidth: 800,
              width: "90%",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: 0,
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border)",
              opacity: 1
            }}
          >
            {/* Header du syllabus */}
            <div
              style={{
                background: "#1a2332",
                padding: "1.5rem 2rem",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <p
                    style={{
                      color: "#556987",
                      fontSize: "0.75rem",
                      margin: "0 0 4px",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {generatedTemplate.moduleInfo?.code || ""}
                    {generatedTemplate.moduleInfo?.code &&
                    generatedTemplate.moduleInfo?.semester
                      ? " • "
                      : ""}
                    {generatedTemplate.moduleInfo?.semester || ""}
                  </p>
                  <h2
                    style={{
                      color: "#e5eaf3",
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      margin: 0,
                    }}
                  >
                    {generatedTemplate.moduleInfo?.title ||
                      module?.name ||
                      "Syllabus"}
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      marginTop: "0.75rem",
                    }}
                  >
                    {[
                      `📚 Niveau ${generatedTemplate.moduleInfo?.level || ""}`,
                      `⏱ ${generatedTemplate.moduleInfo?.totalHours || 0}h Total`,
                      `🎓 ${generatedTemplate.moduleInfo?.credits || 3} Crédits`,
                      `📋 ${generatedTemplate.seances?.length || 0} Séances`,
                    ].map((badge) => (
                      <span
                        key={badge}
                        style={{
                          background: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.25)",
                          padding: "2px 10px",
                          borderRadius: 20,
                          fontSize: "0.75rem",
                          color: "#e5eaf3",
                          fontWeight: 600,
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  style={{
                    
                    padding: "0.3rem 0.6rem",
                    flexShrink: 0,
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div style={{ overflowY: "auto", flex: 1, padding: "1.5rem 2rem" }}>
              {/* Charge horaire */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                {[
                  {
                    label: "Cours Magistraux",
                    val: `${generatedTemplate.moduleInfo?.cmHours || 0}h`,
                    color: "#2cb5e8",
                  },
                  {
                    label: "Travaux Dirigés",
                    val: `${generatedTemplate.moduleInfo?.tdHours || 0}h`,
                    color: "var(--accent)",
                  },
                  {
                    label: "Travaux Pratiques",
                    val: `${generatedTemplate.moduleInfo?.tpHours || 0}h`,
                    color: "#f59e0b",
                  },
                  {
                    label: "Total",
                    val: `${generatedTemplate.moduleInfo?.totalHours || 0}h`,
                    color: "#a855f7",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: "#111927",
                      border: `1px solid ${item.color}33`,
                      borderRadius: 8,
                      padding: "0.75rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.4rem",
                        fontWeight: 800,
                        color: item.color,
                      }}
                    >
                      {item.val}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#556987",
                        marginTop: 2,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {generatedTemplate.description && (
                <SyllabusSectionBlock title="Description" icon="fa-align-left">
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.9rem",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {generatedTemplate.description}
                  </p>
                </SyllabusSectionBlock>
              )}

              {/* Objectif général */}
              {generatedTemplate.generalObjectives && (
                <SyllabusSectionBlock
                  title="Objectif Général"
                  icon="fa-bullseye"
                >
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.9rem",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {generatedTemplate.generalObjectives}
                  </p>
                </SyllabusSectionBlock>
              )}

              {/* Prérequis + Compétences */}
              {generatedTemplate.prerequisites?.length ||
              generatedTemplate.skills?.length ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {generatedTemplate.prerequisites?.length > 0 && (
                    <SyllabusSectionBlock
                      title="Prérequis"
                      icon="fa-graduation-cap"
                      noMargin
                    >
                      <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                        {generatedTemplate.prerequisites.map(
                          (p: string, i: number) => (
                            <li
                              key={i}
                              style={{
                                color: "#9ca3af",
                                fontSize: "0.85rem",
                                marginBottom: "0.4rem",
                              }}
                            >
                              {p}
                            </li>
                          ),
                        )}
                      </ul>
                    </SyllabusSectionBlock>
                  )}
                  {generatedTemplate.skills?.length > 0 && (
                    <SyllabusSectionBlock
                      title="Compétences Acquises"
                      icon="fa-check-circle"
                      noMargin
                    >
                      <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                        {generatedTemplate.skills.map(
                          (s: string, i: number) => (
                            <li
                              key={i}
                              style={{
                                color: "#9ca3af",
                                fontSize: "0.85rem",
                                marginBottom: "0.4rem",
                              }}
                            >
                              {s}
                            </li>
                          ),
                        )}
                      </ul>
                    </SyllabusSectionBlock>
                  )}
                </div>
              ) : null}

              {/* Plan de séances */}
              <SyllabusSectionBlock
                title={`Plan de Cours — ${generatedTemplate.seances?.length || 0} séances`}
                icon="fa-list-ol"
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {(generatedTemplate.seances || []).map(
                    (seance: any, idx: number) => {
                      const typeColors: any = {
                        COURS_MAGISTRAL: "#2cb5e8",
                        TD: "var(--accent)",
                        TP: "#f59e0b",
                      };
                      const typeLabels: any = {
                        COURS_MAGISTRAL: "CM",
                        TD: "TD",
                        TP: "TP",
                      };
                      const color = typeColors[seance.typeSeance] || "#556987";
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.75rem",
                            background: "#0d1117",
                            borderRadius: 6,
                            padding: "0.7rem 1rem",
                            border: `1px solid ${color}22`,
                          }}
                        >
                          <span
                            style={{
                              background: `${color}22`,
                              color,
                              border: `1px solid ${color}`,
                              padding: "1px 8px",
                              borderRadius: 4,
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              marginTop: 2,
                            }}
                          >
                            {typeLabels[seance.typeSeance] || seance.typeSeance}
                            {seance.ordre}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                color: "#e5eaf3",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                              }}
                            >
                              {seance.title}
                            </div>
                            {seance.objectifs && (
                              <div
                                style={{
                                  color: "#556987",
                                  fontSize: "0.78rem",
                                  marginTop: 2,
                                }}
                              >
                                {seance.objectifs}
                              </div>
                            )}
                          </div>
                          <span
                            style={{
                              color: "#556987",
                              fontSize: "0.75rem",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {seance.duree ? seance.duree / 60 + "h" : "2h"}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              </SyllabusSectionBlock>

              {/* Évaluation */}
              {generatedTemplate.evaluation && (
                <SyllabusSectionBlock title="Évaluation" icon="fa-chart-pie">
                  <div
                    style={{
                      display: "flex",
                      borderRadius: 6,
                      overflow: "hidden",
                      height: 32,
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        width: `${generatedTemplate.evaluation.continu || 40}%`,
                        background: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      CC {generatedTemplate.evaluation.continu || 40}%
                    </div>
                    <div
                      style={{
                        width: `${generatedTemplate.evaluation.examen || 60}%`,
                        background: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#1a2332",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      Examen {generatedTemplate.evaluation.examen || 60}%
                    </div>
                  </div>
                  {generatedTemplate.evaluation.description && (
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "0.85rem",
                        margin: 0,
                      }}
                    >
                      {generatedTemplate.evaluation.description}
                    </p>
                  )}
                </SyllabusSectionBlock>
              )}

              {/* Bibliographie */}
              {generatedTemplate.bibliography?.length > 0 && (
                <SyllabusSectionBlock title="Bibliographie" icon="fa-book-open">
                  <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                    {generatedTemplate.bibliography.map(
                      (b: string, i: number) => (
                        <li
                          key={i}
                          style={{
                            color: "#9ca3af",
                            fontSize: "0.85rem",
                            marginBottom: "0.4rem",
                          }}
                        >
                          {b}
                        </li>
                      ),
                    )}
                  </ul>
                </SyllabusSectionBlock>
              )}

              {/* Outils */}
              {generatedTemplate.tools?.length > 0 && (
                <SyllabusSectionBlock
                  title="Outils & Technologies"
                  icon="fa-tools"
                >
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                  >
                    {generatedTemplate.tools.map((tool: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          background: "#111927",
                          border: "1px solid #2a3f5f",
                          padding: "3px 12px",
                          borderRadius: 20,
                          fontSize: "0.8rem",
                          color: "#9ca3af",
                        }}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </SyllabusSectionBlock>
              )}
            </div>

            {/* Footer avec boutons */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                padding: "1rem 2rem",
                borderTop: "1px solid #2a3f5f",
                background: "#111927",
                flexShrink: 0,
              }}
            >
              <button
                style={{
                  
                  flex: 1,
                  justifyContent: "center",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onClick={() => setShowTemplateModal(false)}
              >
                Fermer
              </button>
              <button
                style={{
                  
                  flex: 1,
                  justifyContent: "center",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#2cb5e8",
                  borderColor: "#2cb5e8",
                }}
                onClick={() => downloadSyllabus(generatedTemplate)}
              >
                <i className="fas fa-download"></i> Télécharger Syllabus
              </button>
              <button
                style={{
                  
                  flex: 2,
                  justifyContent: "center",
                  background: importingTemplate ? "#556987" : "#a855f7",
                  color: "#fff",
                  opacity: importingTemplate ? 0.7 : 1,
                }}
                disabled={importingTemplate}
                onClick={handleImportTemplate}
              >
                {importingTemplate ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Import...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-import"></i> Importer{" "}
                    {generatedTemplate.seances?.length || 0} séances
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
};

export default LecturerModuleDetail;
