#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="${ROOT_DIR}/.local-pids"

# Combine all arguments into a single target string
TARGET_RAW="$*"
TARGET="${TARGET_RAW:-all}"

SERVICES=(
    "discovery-server"
    "user-service"
    "university-service"
    "course-service"
    "announcement-service"
    "ai-service"
    "api-gateway"
)

TO_STOP=()

if [[ "${TARGET}" == "all" ]]; then
    TO_STOP=("${SERVICES[@]}")
    echo "Stopping all LMS microservices..."
else
    # Exact match
    for s in "${SERVICES[@]}"; do
        if [[ "${s}" == "${TARGET}" ]]; then
            TO_STOP+=("${s}")
        fi
    done

    # Case-insensitive partial match
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
        echo "Error: Service '${TARGET}' not found."
        echo "Valid services are:"
        printf ' - %s\n' "${SERVICES[@]}"
        exit 1
    fi

    echo "Stopping: ${TO_STOP[*]}..."
fi

# No PID file
if [[ ! -f "${PID_FILE}" ]]; then
    echo "No PID file found. Nothing to stop."
    exit 0
fi

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

            # Graceful stop
            kill "${pid}" >/dev/null 2>&1 || true

            # Wait up to 5 seconds
            for i in {1..5}; do
                if ! kill -0 "${pid}" >/dev/null 2>&1; then
                    break
                fi
                sleep 1
            done

            # Force kill if still alive
            if kill -0 "${pid}" >/dev/null 2>&1; then
                echo "Force killing ${name} (pid ${pid})"
                kill -9 "${pid}" >/dev/null 2>&1 || true
            fi

        else
            echo "${name} already stopped."
        fi

    else
        # Keep services not being stopped
        echo "${pid} ${name}" >> "${TEMP_PID_FILE}"
    fi

done < "${PID_FILE}"

# Replace PID file
mv "${TEMP_PID_FILE}" "${PID_FILE}"

# Remove empty PID file
if [[ ! -s "${PID_FILE}" ]]; then
    rm -f "${PID_FILE}"
fi

kill_port() {
    local port=$1

    local pid
    pid=$(netstat -ano 2>/dev/null | grep ":${port}" | grep LISTENING | awk '{print $NF}' | head -n 1)

    if [[ -n "${pid}" ]]; then
        echo "Killing process on port ${port} (PID ${pid})"
        taskkill //PID "${pid}" //F >/dev/null 2>&1 || true
    fi
}

# Cleanup known service ports
kill_port 8888
kill_port 8761
kill_port 8080
kill_port 8081
kill_port 8082
kill_port 8083
kill_port 8084
kill_port 8085

echo "Done."