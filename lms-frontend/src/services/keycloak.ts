import Keycloak from "keycloak-js";

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const keycloak = new Keycloak({
  // Keycloak Docker: KC_HTTP_RELATIVE_PATH=/auth → les endpoints sont sous /auth/realms/...
  url: isLocal ? "http://localhost:9080/auth" : window.location.origin + "/auth",
  realm: "lms",
  clientId: "lms-web"
});

export default keycloak;
