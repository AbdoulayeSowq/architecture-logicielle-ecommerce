import axios from "axios";
import { apiCache } from "./apiCache";
import keycloak from "../keycloak";
import { addToOutbox } from "./outboxStore";


const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    // 1. Inject Authorization JWT Token with proactive Keycloak refresh
    if (keycloak.token) {
      try {
        await keycloak.updateToken(70);
        localStorage.setItem("token", keycloak.token || "");
      } catch (err) {
        console.error("Proactive token refresh failed:", err);
      }
      config.headers["Authorization"] = `Bearer ${keycloak.token}`;
    } else {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }

    // 2. HTTP GET Cache Interception
    if (config.method === "get") {
      // Exclude real-time endpoints from cache:
      // - messages, live, notifications: streaming/chat
      // - attendance/report, qr-token: real-time presence polling (must never be cached)
      const isExempt = 
        config.url?.includes("/messages") || 
        config.url?.includes("/live") || 
        config.url?.includes("/notifications/user") ||
        config.url?.includes("/attendance") ||
        config.url?.includes("/qr-token") ||
        config.url?.includes("/qr-scan");

      if (!isExempt) {
        const cacheKey = (config.url || "") + "?" + JSON.stringify(config.params || {});
        const cachedData = apiCache.get(cacheKey);
        
        if (cachedData) {
          // Bypasses the network call entirely by executing a mock resolved adapter promise!
          config.adapter = () => {
            return Promise.resolve({
              data: cachedData,
              status: 200,
              statusText: "OK",
              headers: {},
              config,
              request: {},
            });
          };
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const HTTP_MESSAGES: Record<number, string> = {
  400: "Requête invalide — vérifiez les données envoyées.",
  401: "Session expirée — veuillez vous reconnecter.",
  403: "Accès refusé — vous n'avez pas les droits nécessaires.",
  404: "Ressource introuvable.",
  408: "La requête a pris trop de temps. Réessayez.",
  409: "Conflit — cette ressource existe déjà.",
  422: "Données invalides — vérifiez le formulaire.",
  429: "Trop de requêtes. Attendez quelques secondes.",
  500: "Erreur interne du serveur. Réessayez plus tard.",
  502: "Le serveur est inaccessible (Bad Gateway).",
  503: "Service temporairement indisponible. Réessayez dans quelques instants.",
  504: "Délai dépassé — le serveur ne répond pas.",
};

api.interceptors.response.use(
  (response) => {
    const config = response.config;
    
    if (config) {
      const url = config.url || "";
      // Never cache real-time endpoints: presence polling, QR tokens/scans, messages, live, notifications
      const isExempt = 
        url.includes("/messages") || 
        url.includes("/live") || 
        url.includes("/notifications/user") ||
        url.includes("/attendance") ||
        url.includes("/qr-token") ||
        url.includes("/qr-scan");

      if (config.method === "get" && !isExempt) {
        // Cache successful GET responses based on customized TTL categories
        const cacheKey = url + "?" + JSON.stringify(config.params || {});
        
        let ttl = 120000; // 2 minutes default (announcements, timetables, etc.)
        if (url.includes("/user")) ttl = 300000; // 5 minutes (user profiles, admin lists)
        if (url.includes("/uni")) ttl = 900000; // 15 minutes (quasi-static cycles, classes, departments)
        // NOTE: /course is intentionally NOT cached at 5min here to avoid
        // accidentally caching attendance sub-routes. Only non-attendance course routes are cached.
        if (url.includes("/course") && !url.includes("/attendance")) ttl = 300000; // 5 minutes (course materials, modules catalog)
        
        apiCache.set(cacheKey, response.data, ttl);
      } else if (["post", "put", "delete"].includes(config.method || "")) {
        // Active invalidation: Evict corresponding cached scopes upon successful mutations
        if (url.includes("/announcement")) {
          apiCache.invalidate(["/announcement"]);
        } else if (url.includes("/user")) {
          apiCache.invalidate(["/user"]);
        } else if (url.includes("/uni")) {
          apiCache.invalidate(["/uni"]);
        } else if (url.includes("/course") && !url.includes("/attendance")) {
          apiCache.invalidate(["/course"]);
        }
      }
    }
    
    return response;
  },
  async (error) => {
    const status: number | undefined = error?.response?.status;
    const originalRequest = error.config;
    
    // Capture mutating requests during offline network downtime
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
    const isWriteRequest = originalRequest && ["post", "put", "delete"].includes(originalRequest.method?.toLowerCase() || "");

    if (isNetworkError && isWriteRequest && originalRequest) {
      const url = originalRequest.url || "";
      let description = "Action enregistrée";
      if (url.includes('/api/message') || url.includes('/send')) {
        description = "Envoi de votre message";
      } else if (url.includes('/forum') || url.includes('/threads') || url.includes('/posts')) {
        description = "Publication sur le forum";
      } else if (url.includes('/quizzes/submit') || url.includes('/submission')) {
        description = "Validation de votre évaluation";
      } else if (url.includes('/attendance') || url.includes('/scan')) {
        description = "Enregistrement de votre présence";
      }

      // Convert body back to object
      let reqData = originalRequest.data;
      if (typeof reqData === 'string') {
        try {
          reqData = JSON.parse(reqData);
        } catch (_) {}
      }

      const headers = { ...originalRequest.headers };
      delete headers['Authorization'];

      addToOutbox({
        url,
        method: originalRequest.method || 'POST',
        data: reqData,
        headers,
        description,
      });

      // Resolve successfully with 202 Accepted simulation to prevent UI breaking
      return Promise.resolve({
        data: {
          status: 'ACCEPTED_OFFLINE',
          message: 'Requête enregistrée hors-ligne.',
          offline: true,
        },
        status: 202,
        statusText: 'Accepted (Offline)',
        headers: {},
        config: originalRequest,
        request: {},
      });
    }

    // Silent refresh on 401 with proactive retry
    if (status === 401) {
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          console.log("[API] Token expiré, tentative de rafraîchissement silencieux...");
          await keycloak.updateToken(-1);
          const newToken = keycloak.token || "";
          localStorage.setItem("token", newToken);
          
          if (originalRequest.headers) {
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          }
          console.log("[API] Token rafraîchi avec succès, rejeu de la requête.");
          return api(originalRequest);
        } catch (refreshError) {
          console.error("[API] Échec du rafraîchissement Keycloak lors du 401 :", refreshError);
          localStorage.clear();
          window.location.href = "/login";
        }
      } else {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    // Build a friendly message
    const serverMsg: string =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      (typeof error?.response?.data === "string" ? error.response.data : null);

    const friendlyMsg =
      serverMsg && serverMsg.length < 200
        ? serverMsg
        : status
        ? (HTTP_MESSAGES[status] ?? `Erreur ${status} — une erreur inattendue s'est produite.`)
        : "Impossible de contacter le serveur. Vérifiez votre connexion.";

    error.friendlyMessage = friendlyMsg;
    return Promise.reject(error);
  }
);


export default api;
