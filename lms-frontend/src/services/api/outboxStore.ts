import axios from "axios";
import keycloak from "../keycloak";

export interface OutboxItem {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: any;
  timestamp: number;
  description: string;
}

const OUTBOX_KEY = "lms_web_outbox";
let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;

// Dynamic DOM Toast Injector for Global Offline Alerts
export function showGlobalToast(message: string, type: 'success' | 'warning' | 'info' = 'info') {
  if (typeof document === 'undefined') return;

  const containerId = 'lms-toast-container';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.zIndex = '999999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.background = type === 'success' ? 'rgba(15, 81, 50, 0.95)' : type === 'warning' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(30, 41, 59, 0.95)';
  toast.style.color = '#fff';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '10px';
  toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
  toast.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  toast.style.fontSize = '13px';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '12px';
  toast.style.backdropFilter = 'blur(8px)';
  toast.style.border = type === 'success' ? '1px solid #198754' : type === 'warning' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)';
  toast.style.transition = 'all 0.3s ease';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(15px)';

  const icon = document.createElement('i');
  icon.className = type === 'success' ? 'fas fa-cloud-done' : type === 'warning' ? 'fas fa-wifi-slash' : 'fas fa-info-circle';
  icon.style.color = type === 'warning' ? '#fbbf24' : '#10b981';
  icon.style.fontSize = '16px';
  toast.appendChild(icon);

  const textContainer = document.createElement('div');
  textContainer.style.display = 'flex';
  textContainer.style.flexDirection = 'column';
  
  const textNode = document.createElement('span');
  textNode.style.fontWeight = '600';
  textNode.innerText = message;
  textContainer.appendChild(textNode);

  if (type === 'warning') {
    const subNode = document.createElement('span');
    subNode.style.fontSize = '10px';
    subNode.style.color = 'rgba(255,255,255,0.6)';
    subNode.innerText = 'Enregistré localement. Resync au retour du réseau.';
    textContainer.appendChild(subNode);
  }

  toast.appendChild(textContainer);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 20);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-15px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4500);
}

export const getOutbox = (): OutboxItem[] => {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const addToOutbox = (item: Omit<OutboxItem, 'id' | 'timestamp'>) => {
  try {
    const queue = getOutbox();
    const newItem: OutboxItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    queue.push(newItem);
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(queue));
    showGlobalToast(newItem.description, 'warning');
  } catch (e) {
    console.error("Error adding to outbox:", e);
  }
};

export const removeFromOutbox = (id: string) => {
  try {
    const queue = getOutbox();
    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Error removing from outbox:", e);
  }
};

export const syncOutbox = async () => {
  if (isSyncing) return;

  const queue = getOutbox();
  if (queue.length === 0) return;

  isSyncing = true;
  console.log(`[Outbox] Attempting to sync ${queue.length} offline actions...`);

  try {
    // 1. Prober Network connection
    const host = process.env.REACT_APP_API_BASE_URL || '';
    await axios.get(`${host}/api/user/contacts`, { timeout: 3000 });

    let successfulSyncs = 0;

    // 2. Synchronize sequentially
    for (const item of queue) {
      // Re-fetch token from Keycloak if logged in
      let token = localStorage.getItem("token");
      if (keycloak.token) {
        try {
          await keycloak.updateToken(10);
          token = keycloak.token;
        } catch (_) {}
      }

      const headers = {
        ...item.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      try {
        const response = await axios({
          url: item.url.startsWith('http') ? item.url : `${host}${item.url}`,
          method: item.method,
          data: item.data,
          headers,
          timeout: 8000,
        });

        if (response.status >= 200 && response.status < 300) {
          removeFromOutbox(item.id);
          successfulSyncs++;
        }
      } catch (err: any) {
        if (axios.isAxiosError(err) && (!err.response || err.code === 'ECONNABORTED' || err.message.includes('Network Error'))) {
          // Re-connection loss, stop execution
          break;
        }
        // Client or semantic error, discard request to avoid blocking queue
        console.warn(`[Outbox] Request ${item.id} rejected by server, discarding:`, err);
        removeFromOutbox(item.id);
      }
    }

    if (successfulSyncs > 0) {
      showGlobalToast(`Synchronisation réussie pour ${successfulSyncs} action(s) ! 🎉`, 'success');
    }
  } catch (e) {
    console.log("[Outbox] Server probe failed, remaining offline.");
  } finally {
    isSyncing = false;
  }
};

export const startOutboxSyncDaemon = () => {
  if (syncInterval) return;

  console.log("[Outbox] Starting offline synchronizer daemon...");
  syncInterval = setInterval(() => {
    if (navigator.onLine) {
      syncOutbox();
    }
  }, 20000);

  // Hook online event
  window.addEventListener('online', syncOutbox);
  
  // First run
  setTimeout(syncOutbox, 5000);
};
