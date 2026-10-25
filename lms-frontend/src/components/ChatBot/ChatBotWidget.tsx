import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { useAuth } from "../../services/AuthContext";
import { askAi } from "../../services/api/ai";
import {
  getModulesByStudent,
  getModulesByLecturer,
  getModulesByCourseIdForStudent,
  getModules,
} from "../../services/api/course";
import { getStudentDetailsByUsername } from "../../services/api/user";
import CodeBlock from "./CodeBlock";
import "./ChatBotWidget.css";

interface Message {
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isStreaming?: boolean;
}

interface Module {
  id: number;
  name: string;
  code?: string;
}

interface ChatBotWidgetProps {
  moduleId?: number;
  courseContext?: string;
}

const ChatBotWidget: React.FC<ChatBotWidgetProps> = ({
  moduleId: propsModuleId,
  courseContext,
}) => {
  const { user, role } = useAuth();
  const { id: urlModuleId } = useParams<{ id: string }>();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [activeModuleId, setActiveModuleId] = useState<number | undefined>(
    undefined,
  );
  const [availableModules, setAvailableModules] = useState<Module[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const [isModulesLoading, setIsModulesLoading] = useState(false);

  // Fermer sur changement de page (navigation React Router)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Fermer sur tout clic en dehors du chatbot (navbar, sidebar, etc.)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        chatContainerRef.current &&
        !chatContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Fetch modules on open
  useEffect(() => {
    if (isOpen && user?.username && role) {
      setIsModulesLoading(true);
      console.log("ChatBot: Fetching modules (Sync with Home)...", {
        username: user.username,
        role,
      });

      const handleMods = (mods: any) => {
        console.log("ChatBot: Modules received:", mods);
        if (Array.isArray(mods)) setAvailableModules(mods);
        setIsModulesLoading(false);
      };

      // Normalize role: accept both 'STUDENT' and 'ROLE_STUDENT' formats
      const normalizedRole = role.replace(/^ROLE_/, "");

      if (normalizedRole === "STUDENT") {
        // Fetch student details first (like in Home.tsx)
        getStudentDetailsByUsername(user.username)
          .then(async (details) => {
            if (details) {
              const mods = await getModulesByCourseIdForStudent(
                details.courseId || details.id,
                details.intake,
              );
              handleMods(mods);
            } else {
              // Fallback to basic student modules
              getModulesByStudent(user.username)
                .then(handleMods)
                .catch(() => setIsModulesLoading(false));
            }
          })
          .catch(() => setIsModulesLoading(false));
      } else if (normalizedRole === "LECTURER") {
        getModulesByLecturer(user.username)
          .then(handleMods)
          .catch(() => setIsModulesLoading(false));
      } else if (normalizedRole === "ADMIN") {
        getModules()
          .then(handleMods)
          .catch(() => setIsModulesLoading(false));
      } else {
        console.warn("ChatBot: unknown role", role);
        setIsModulesLoading(false);
      }
    }
  }, [isOpen, user?.username, role]);

  // Synchronize active module ID from props or URL
  useEffect(() => {
    const detectedId =
      propsModuleId || (urlModuleId ? parseInt(urlModuleId) : undefined);
    if (detectedId) {
      setActiveModuleId(detectedId);
    }
  }, [propsModuleId, urlModuleId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg =
        user?.role === "LECTURER"
          ? "Bonjour Professeur ! Je suis ravi de vous aider dans la gestion de votre cours. Je peux vous aider à expliquer des notions complexes ou à générer des quiz pertinents pour vos étudiants."
          : "Bonjour ! Je suis votre assistant pédagogique IA. Posez-moi n'importe quelle question sur vos cours, je suis là pour vous accompagner !";

      setMessages([
        {
          text: welcomeMsg,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
    scrollToBottom();
  }, [isOpen, messages, user?.role]);

  const renderMessage = (text: string): React.ReactNode => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
      components={{
        code({ inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const language = match ? match[1] : "";
          const codeStr = String(children).replace(/\n$/, "");
          if (!inline && (language || codeStr.includes("\n"))) {
            return (
              <CodeBlock language={language || "code"} code={codeStr}>
                {children}
              </CodeBlock>
            );
          }
          return (
            <code className={`inline-code ${className || ""}`} {...props}>
              {children}
            </code>
          );
        },
        pre({ children }: any) {
          return <>{children}</>;
        },
        a({ children, ...props }: any) {
          return (
            <a target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );

  const streamMessage = (index: number, fullText: string) => {
    const tokens = fullText.match(/\S+|\s+/g) || [];
    let cursor = 0;
    let assembled = "";
    const targetTicks = Math.min(60, Math.max(20, tokens.length / 6));
    const burstSize = Math.max(3, Math.ceil(tokens.length / targetTicks));
    const intervalMs = 12;

    const tick = () => {
      for (let i = 0; i < burstSize && cursor < tokens.length; i++) {
        assembled += tokens[cursor++];
      }
      const stillStreaming = cursor < tokens.length;
      const slice = assembled;
      setMessages((prev) =>
        prev.map((m, i) =>
          i === index ? { ...m, text: slice, isStreaming: stillStreaming } : m,
        ),
      );
      if (stillStreaming) {
        window.setTimeout(tick, intervalMs);
      }
    };
    tick();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = {
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const targetModuleId = isFocusMode ? activeModuleId : undefined;
      const response = await askAi(inputText, targetModuleId, courseContext);

      const messageIndex = messages.length + 1;
      setMessages((prev) => [
        ...prev,
        { text: "", sender: "ai", timestamp: new Date(), isStreaming: true },
      ]);
      streamMessage(messageIndex, response);
    } catch (error) {
      const errorMsg: Message = {
        text: "Désolé, je rencontre une difficulté technique. Veuillez vérifier votre connexion ou réessayer plus tard.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container" ref={chatContainerRef}>
      {isOpen && (
        <>
          <div className="chatbot-backdrop" onClick={() => setIsOpen(false)} />
          <div className="chatbot-window" onClick={(e) => e.stopPropagation()}>
            <div className="chatbot-header">
              <div className="header-info">
                <div className="ai-avatar">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="header-text">
                  <div className="d-flex align-items-center gap-2">
                    <h3>Assistant IA</h3>
                  </div>
                  <div className="module-selector-wrapper">
                    <select
                      className="form-select form-select-sm module-dropdown"
                      value={activeModuleId || ""}
                      onChange={(e) => {
                        setActiveModuleId(
                          e.target.value ? parseInt(e.target.value) : undefined,
                        );
                        setIsFocusMode(!!e.target.value);
                      }}
                      disabled={isModulesLoading}
                    >
                      <option value="">
                        {isModulesLoading ? "Chargement..." : "Mode Général"}
                      </option>
                      {availableModules.length === 0 && !isModulesLoading && (
                        <option disabled>Aucun module trouvé</option>
                      )}
                      {availableModules.map((mod) => (
                        <option key={mod.id} value={mod.id}>
                          Focus : {mod.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="header-actions">
                <button className="close-btn" onClick={() => setIsOpen(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className="chatbot-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.sender}`}>
                  <div className="message-bubble">
                    <div className="message-text">
                      {renderMessage(msg.text)}
                      {msg.isStreaming && (
                        <span className="streaming-cursor">▊</span>
                      )}
                    </div>
                    {!msg.isStreaming && (
                      <div className="message-time">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message-wrapper ai">
                  <div className="message-bubble">
                    <div className="typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input-area">
              <form onSubmit={handleSendMessage} className="chatbot-form">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isFocusMode && activeModuleId
                      ? "Question sur ce module..."
                      : "Posez votre question..."
                  }
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="send-btn"
                  disabled={!inputText.trim() || isLoading}
                >
                  <i
                    className={`fas ${isLoading ? "fa-spinner fa-spin" : "fa-paper-plane"}`}
                  ></i>
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      <div className="chatbot-toggle-wrapper">
        <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
          <i
            className={`fas ${isOpen ? "fa-times" : "fa-robot"}`}
          ></i>
          {activeModuleId && !isOpen && (
            <div className="context-indicator animate__animated animate__pulse animate__infinite">
              <i className="fas fa-graduation-cap"></i>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatBotWidget;
