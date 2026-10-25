import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/components.css';
import App from './App';
import keycloak from './services/keycloak';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/api/queryClient';
import { startOutboxSyncDaemon } from './services/api/outboxStore';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

keycloak.init({ 
  onLoad: "login-required",
  pkceMethod: 'S256', // Indispensable pour les clients publics sur Keycloak 24+
  checkLoginIframe: false // Disable iframe check to prevent third-party cookie blocking issues
}).then((authenticated: boolean) => {
  if (authenticated) {
    const token = keycloak.token || "";
    localStorage.setItem("token", token);
    startOutboxSyncDaemon();

    // Extract role from Keycloak realm roles

    let role = "";
    const allRoles: string[] = [];
    if (keycloak.tokenParsed?.realm_access?.roles) {
      allRoles.push(...keycloak.tokenParsed.realm_access.roles);
    }
    if (keycloak.tokenParsed?.resource_access) {
      Object.values(keycloak.tokenParsed.resource_access).forEach((clientAccess: any) => {
        if (clientAccess && Array.isArray(clientAccess.roles)) {
          allRoles.push(...clientAccess.roles);
        }
      });
    }
    const normalizedRoles = allRoles.map((r: string) => r.toUpperCase());
    console.log("[Keycloak Roles Normalized]", normalizedRoles);
    localStorage.setItem("allRoles", JSON.stringify(normalizedRoles));

    if (normalizedRoles.includes("STUDENT") || normalizedRoles.includes("ROLE_STUDENT")) {
      role = "STUDENT";
    } else if (normalizedRoles.includes("ADMIN") || normalizedRoles.includes("ROLE_ADMIN")) {
      role = "ADMIN";
    } else if (normalizedRoles.includes("SCOLARITE") || normalizedRoles.includes("ROLE_SCOLARITE")) {
      role = "SCOLARITE";
    } else if (normalizedRoles.includes("CHEF_DEPT") || normalizedRoles.includes("ROLE_CHEF_DEPT")) {
      role = "CHEF_DEPT";
    } else if (normalizedRoles.includes("RESP_PEDAGO") || normalizedRoles.includes("ROLE_RESP_PEDAGO")) {
      role = "RESP_PEDAGO";
    } else if (normalizedRoles.includes("LECTURER") || normalizedRoles.includes("ROLE_LECTURER") || normalizedRoles.includes("TEACHER") || normalizedRoles.includes("ROLE_TEACHER")) {
      role = "LECTURER";
    }
    localStorage.setItem("role", role);

    // Build user object expected by frontend components
    const userProfile = {
      username: keycloak.tokenParsed?.preferred_username || "",
      email: keycloak.tokenParsed?.email || "",
      firstName: keycloak.tokenParsed?.given_name || "",
      lastName: keycloak.tokenParsed?.family_name || "",
      role: role ? `ROLE_${role}` : "" // Compatibility with components expecting ROLE_ prefix
    };
    localStorage.setItem("user", JSON.stringify(userProfile));

    root.render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
  } else {
    window.location.reload();
  }
}).catch((error: any) => {
  console.error("Keycloak initialization failed:", error);
  // Auto-recovery: if Keycloak fails (e.g. invalid code loop), clear tokens and force a clean state
  sessionStorage.clear();
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  
  if (window.location.search.includes("code=") || window.location.search.includes("state=")) {
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.reload();
  }

  // Fallback rendering in development if Keycloak is totally unreachable
  root.render(
    <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>Système d'authentification temporairement indisponible</h2>
      <p>Impossible de contacter le serveur d'authentification Keycloak. Veuillez vérifier votre connexion ou réessayer plus tard.</p>
      <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", marginTop: "20px", cursor: "pointer" }}>Réessayer</button>
    </div>
  );
});

// Suppression du Service Worker pour éviter les problèmes de cache persistant (PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then(() => {
        console.log('[PWA] Service Worker obsolète désinscrit avec succès.');
      });
    }
  });
}

