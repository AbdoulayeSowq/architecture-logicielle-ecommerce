#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="${ROOT_DIR}/.local-pids"

# Combine all arguments into a single target string (e.g. "AI Service" -> "ai service")
TARGET_RAW="$*"
TARGET="${TARGET_RAW:-all}"
SERVICES=("discovery-server" "user-service" "university-service" "course-service" "announcement-service" "ai-service" "api-gateway")

TO_STOP=()

if [[ "${TARGET}" == "all" ]]; then
    TO_STOP=("${SERVICES[@]}")
    echo "Stopping all LMS microservices..."
else
    # Try exact match first
    for s in "${SERVICES[@]}"; do
        if [[ "${s}" == "${TARGET}" ]]; then
            TO_STOP+=("${s}")
        fi
    done

    # If no exact match, try case-insensitive partial match
    if [[ ${#TO_STOP[@]} -eq 0 ]]; then
        TARGET_LOWER=$(echo "${TARGET}" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
        for s in "${SERVICES[@]}"; do
            S_CLEAN=$(echo "${s}" | tr -d '-')
            if [[ "${s}" == *"${TARGET_LOWER}"* ]] || [[ "${S_CLEAN}" == *"${TARGET_LOWER}"* ]]; then
                TO_STOP+=("${s}")
            fi
        done
    fi

    if [[ ${#TO_STOP[@]} -eq 0 ]]; then
        echo "Error: Service '${TARGET}' not found. Valid services are: ${SERVICES[*]} or 'all'"
        exit 1
    fi
    
    echo "Stopping: ${TO_STOP[*]}..."
fi

# Try to stop using PID file first
if [[ -f "${PID_FILE}" ]]; then
    TEMP_PID_FILE=$(mktemp)
    while read -r pid name; do
        STOP_THIS=0
        for s in "${TO_STOP[@]}"; do
            if [[ "${name}" == "${s}" ]]; then
                STOP_THIS=1
                break
            fi
        done

        if [[ "${STOP_THIS}" == "1" ]]; then
            if [[ -n "${pid}" ]] && kill -0 "${pid}" >/dev/null 2>&1; then
                echo "Stopping ${name} (pid ${pid})"
                kill "${pid}" >/dev/null 2>&1 || true
            fi
        else
            echo "${pid} ${name}" >> "${TEMP_PID_FILE}"
        fi
    done < "${PID_FILE}"
    mv "${TEMP_PID_FILE}" "${PID_FILE}"
    
    # Remove pid file if empty
    if [[ ! -s "${PID_FILE}" ]]; then
        rm -f "${PID_FILE}"
    fi
fi

# Also kill by process name to catch any orphaned processes
for service in "${TO_STOP[@]}"; do
  pkill -f "${service}" || true
  pkill -f "java.*${service}" || true
done

# Wait for services to exit gracefully (up to 10 seconds)
echo "Waiting for services to stop gracefully..."
for i in {1..10}; do
  STILL_RUNNING=0
  for service in "${TO_STOP[@]}"; do
    if pgrep -f "${service}" >/dev/null 2>&1; then
      STILL_RUNNING=1
      break
    fi
  done
  
  if [[ "${STILL_RUNNING}" == "0" ]]; then
    break
  fi
  sleep 1
  echo -n "."
done
echo ""

# Force kill if still running
for service in "${TO_STOP[@]}"; do
  if pgrep -f "${service}" >/dev/null 2>&1; then
    echo "Forcing kill -9 for ${service}..."
    pkill -9 -f "${service}" || true
    pkill -9 -f "java.*${service}" || true
  fi
done

echo "Done."
