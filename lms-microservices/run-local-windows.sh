#!/usr/bin/env bash
set -euo pipefail

# Force Java 17 for Lombok compatibility (cross-platform: macOS, Linux, Windows/Git Bash)
detect_java17() {
  # 1) If JAVA_HOME already set and points to Java 17, use it
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    local ver
    ver=$("${JAVA_HOME}/bin/java" -version 2>&1 | awk -F '"' '/version/{print $2}' | cut -d. -f1)
    if [[ "${ver}" == "17" ]]; then
      echo "${JAVA_HOME}"
      return
    fi
  fi

  # 2) macOS helper
  if command -v /usr/libexec/java_home &>/dev/null; then
    /usr/libexec/java_home -v 17 2>/dev/null || true
    return
  fi

  # 3) java on PATH — check version
  if command -v java &>/dev/null; then
    local ver
    ver=$(java -version 2>&1 | awk -F '"' '/version/{print $2}' | cut -d. -f1)
    if [[ "${ver}" == "17" ]]; then
      # Resolve JAVA_HOME from the java binary
      local java_bin
      java_bin="$(command -v java)"
      # Follow symlinks (works in Git Bash / Linux)
      while [[ -L "${java_bin}" ]]; do java_bin="$(readlink -f "${java_bin}")"; done
      echo "$(dirname "$(dirname "${java_bin}")")"
      return
    fi
  fi

  # 4) Windows: scan common installation paths
  for base in \
      "/c/Program Files/Java" \
      "/c/Program Files/Eclipse Adoptium" \
      "/c/Program Files/Microsoft" \
      "/c/Program Files/Amazon Corretto"; do
    if [[ -d "${base}" ]]; then
      local dir
      dir=$(find "${base}" -maxdepth 1 -type d -name "*17*" 2>/dev/null | head -1)
      if [[ -n "${dir}" && -x "${dir}/bin/java" ]]; then
        echo "${dir}"
        return
      fi
    fi
  done
}

JAVA_HOME="$(detect_java17)"
export JAVA_HOME

if [[ -z "${JAVA_HOME}" ]]; then
  echo "Java 17 not found." >&2
  echo "  - Windows : téléchargez depuis https://adoptium.net/ (Temurin 17)" >&2
  echo "  - macOS   : brew install --cask temurin@17" >&2
  echo "  - Linux   : sudo apt install openjdk-17-jdk" >&2
  exit 1
fi

echo "Using Java 17 at: ${JAVA_HOME}"
export PATH="${JAVA_HOME}/bin:${PATH}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${ROOT_DIR}/.local-logs"
PID_FILE="${ROOT_DIR}/.local-pids"

mkdir -p "${LOG_DIR}"
: > "${PID_FILE}"

# Load .env if it exists
if [ -f "${ROOT_DIR}/.env" ]; then
  echo "Loading environment variables from .env..."
  export $(grep -v '^#' "${ROOT_DIR}/.env" | xargs)
fi

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

wait_for_port() {
  local host="$1"
  local port="$2"
  local name="$3"
  local timeout_s="${4:-120}"

  local start
  start="$(date +%s)"

  while true; do
    if (echo >"/dev/tcp/${host}/${port}") >/dev/null 2>&1; then
      echo "${name} is listening on ${host}:${port}"
      return 0
    fi

    local now
    now="$(date +%s)"
    if (( now - start >= timeout_s )); then
      echo "Timed out waiting for ${name} (${host}:${port})" >&2
      return 1
    fi

    sleep 2
  done
}

start_service() {
  local dir="$1"
  local name="$2"
  local port="$3"
  shift 3
  local extra_args=("$@")

  if is_service_running "${port}"; then
    echo "${name} is already running on port ${port} - skipping"
    return 0
  fi

  echo "Starting ${name}..."
  (
    cd "${ROOT_DIR}/${dir}"
    mvn -q spring-boot:run -DskipTests \
      -Dspring-boot.run.arguments="${extra_args[*]:-}" \
      > "${LOG_DIR}/${name}.log" 2>&1
  ) &

  local pid=$!
  echo "${pid} ${name}" >> "${PID_FILE}"

  wait_for_port "127.0.0.1" "${port}" "${name}" 180
}

is_service_running() {
  local port="$1"
  local pid
  pid="$(lsof -i :${port} -P -n -sTCP:LISTEN -t 2>/dev/null || true)"
  [[ -n "${pid}" ]]
}

kill_port() {
  local port="$1"
  local pid
  pid="$(lsof -i :${port} -P -n -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "${pid}" ]]; then
    echo "Killing stale process on port ${port} (pid ${pid})"
    kill "${pid}" 2>/dev/null || true
    sleep 1
  fi
}

# Only kill stale processes if FORCE_RESTART is set
if [[ "${FORCE_RESTART:-}" == "1" ]]; then
  echo "FORCE_RESTART=1 - killing all services..."
  for p in 8761 8081 8082 8083 8085 8086 8080; do
    kill_port "$p"
  done
else
  echo "Checking for already running services..."
fi

require_cmd java
require_cmd mvn

# Local infra mode:
# - Default: in-memory H2 (no external DB needed)
# - Set USE_H2=0 to use PostgreSQL on localhost
USE_H2="${USE_H2:-0}"

POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-lmsdb}"
POSTGRES_USER="${POSTGRES_USER:-lmsdb_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-lmsdb123}"


COMMON_ARGS=(
  "--eureka.client.service-url.defaultZone=http://127.0.0.1:8761/eureka/"
)

if [[ "${USE_H2}" == "1" ]]; then
  COMMON_ARGS+=(
    "--spring.datasource.driver-class-name=org.h2.Driver"
    "--spring.datasource.username=sa"
    "--spring.datasource.password="
    "--spring.jpa.hibernate.ddl-auto=update"
    "--spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
    "--spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
  )
else
  COMMON_ARGS+=(
    "--spring.datasource.url=jdbc:postgresql://${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
    "--spring.datasource.username=${POSTGRES_USER}"
    "--spring.datasource.password=${POSTGRES_PASSWORD}"
    "--spring.jpa.hibernate.ddl-auto=update"
  )
fi

echo "Logs: ${LOG_DIR}"
echo "PIDs: ${PID_FILE}"

# Order matters
start_service "config-server" "config-server" "8888"

start_service "discovery-server" "discovery-server" "8761" \
  "--server.port=8761"


start_service "user-service" "user-service" "8081" \
  "--server.port=8081"

start_service "university-service" "university-service" "8082" \
  "--server.port=8082"

start_service "course-service" "course-service" "8083" \
  "--server.port=8083"

start_service "announcement-service" "announcement-service" "8086" \
  "--server.port=8086"

start_service "api-gateway" "api-gateway" "8080"

start_service "ai-service" "ai-service" "8085" \
  "--server.port=8085"

echo "All services started."
echo "Try:"
echo "  - Eureka:               http://127.0.0.1:8761"
echo "  - Gateway:              http://127.0.0.1:8080"
echo "  - User Service:         http://127.0.0.1:8081"
echo "  - University Service:   http://127.0.0.1:8082"
echo "  - Course Service:       http://127.0.0.1:8083"
echo "  - Announcement Service: http://127.0.0.1:8086"
echo "  - AI Service:           http://127.0.0.1:8085"
