#!/usr/bin/env bash

# ==============================================================================
# Ajker Bazar Dor — Unified Development Server Runner
# ==============================================================================
# Starts all services concurrently:
#   - @ajkerbazardor/shared : TypeScript watch mode
#   - @ajkerbazardor/api    : NestJS Fastify API (http://localhost:3000)
#   - @ajkerbazardor/web    : Nuxt 3 Public Web (http://localhost:3001)
#   - @ajkerbazardor/admin  : Vite Admin Panel  (http://localhost:3002)
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ANSI Colors
BOLD="\033[1m"
GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
RESET="\033[0m"

# Parse CLI options
KILL_PORTS=false
for arg in "$@"; do
  case "$arg" in
    -k|--kill)
      KILL_PORTS=true
      shift
      ;;
    -h|--help)
      echo -e "${BOLD}Usage:${RESET} ./dev.sh [OPTIONS]"
      echo ""
      echo -e "Options:"
      echo -e "  -k, --kill    Automatically kill any processes occupying ports 3000, 3001, or 3002"
      echo -e "  -h, --help    Show this help message"
      exit 0
      ;;
  esac
done

echo -e "\n${BOLD}${CYAN}🛒 আজকের বাজার দর (Ajker Bazar Dor) — Dev Server${RESET}\n"

# 1. Ensure Node.js & pnpm via NVM if needed
if ! command -v node &>/dev/null || ! command -v pnpm &>/dev/null; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    source "$NVM_DIR/nvm.sh"
    if [ -f "$SCRIPT_DIR/.nvmrc" ]; then
      nvm use 2>/dev/null || nvm use 22 2>/dev/null || true
    fi
  fi
fi

if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Error: Node.js is not found in PATH.${RESET}"
  echo "Please install Node.js v22+ or activate your NVM environment."
  exit 1
fi

if ! command -v pnpm &>/dev/null; then
  echo -e "${RED}✗ Error: pnpm is not found in PATH.${RESET}"
  echo "Please install pnpm (e.g. npm install -g pnpm or corepack enable)."
  exit 1
fi

NODE_VER="$(node -v)"
PNPM_VER="$(pnpm -v)"
echo -e "${GREEN}✓${RESET} Node.js: ${BOLD}${NODE_VER}${RESET} | pnpm: ${BOLD}v${PNPM_VER}${RESET}"

# 2. Check / Setup environment files
setup_env() {
  local target="$1"
  local sample="$2"
  if [ ! -f "$target" ]; then
    if [ -f "$sample" ]; then
      echo -e "${YELLOW}! Missing ${target}, creating from ${sample}...${RESET}"
      cp "$sample" "$target"
    fi
  fi
}

setup_env "$SCRIPT_DIR/apps/api/.env" "$SCRIPT_DIR/apps/api/.env.example"
setup_env "$SCRIPT_DIR/apps/web/.env" "$SCRIPT_DIR/apps/web/.env.example"
setup_env "$SCRIPT_DIR/apps/admin/.env" "$SCRIPT_DIR/apps/admin/.env.example"

# Ensure apps/web/.env and apps/admin/.env point to local API if unset
if [ -f "$SCRIPT_DIR/apps/web/.env" ] && ! grep -q "NUXT_PUBLIC_API_BASE" "$SCRIPT_DIR/apps/web/.env"; then
  echo "NUXT_PUBLIC_API_BASE=http://localhost:3000/api/v1" >> "$SCRIPT_DIR/apps/web/.env"
fi

if [ -f "$SCRIPT_DIR/apps/admin/.env" ] && ! grep -q "VITE_API_BASE" "$SCRIPT_DIR/apps/admin/.env"; then
  echo "VITE_API_BASE=http://localhost:3000/api/v1" >> "$SCRIPT_DIR/apps/admin/.env"
fi

# 3. Check for occupied ports (3000, 3001, 3002)
PORTS=(3000 3001 3002)
OCCUPIED=()

for port in "${PORTS[@]}"; do
  PID=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$PID" ]; then
    OCCUPIED+=("$port:$PID")
  fi
done

if [ ${#OCCUPIED[@]} -gt 0 ]; then
  if [ "$KILL_PORTS" = true ]; then
    echo -e "${YELLOW}! Freeing occupied ports...${RESET}"
    for item in "${OCCUPIED[@]}"; do
      PORT="${item%%:*}"
      PID="${item##*:}"
      echo -e "  Killing PID ${PID} on port ${PORT}"
      kill -9 "$PID" 2>/dev/null || true
    done
    sleep 1
  else
    echo -e "${YELLOW}! Warning: The following ports are already in use:${RESET}"
    for item in "${OCCUPIED[@]}"; do
      PORT="${item%%:*}"
      PID="${item##*:}"
      CMD=$(ps -p "$PID" -o comm= 2>/dev/null || echo "unknown")
      echo -e "  - Port ${BOLD}${PORT}${RESET} is used by PID ${BOLD}${PID}${RESET} (${CMD})"
    done
    echo -e "  Run ${BOLD}./dev.sh --kill${RESET} to automatically terminate conflicting processes.\n"
  fi
fi

# 4. Build shared package before booting dev servers
echo -e "${CYAN}→ Building shared package types (@ajkerbazardor/shared)...${RESET}"
pnpm --filter @ajkerbazardor/shared build > /dev/null

echo -e "${GREEN}✓${RESET} Shared package ready."

# 5. Service endpoints banner
echo ""
echo -e "------------------------------------------------------------"
echo -e "  ${BOLD}Active Endpoints:${RESET}"
echo -e "  📡 ${BOLD}API Server:${RESET}    ${CYAN}http://localhost:3000${RESET}"
echo -e "  📄 ${BOLD}API Docs:${RESET}      ${CYAN}http://localhost:3000/api/docs${RESET}"
echo -e "  🛒 ${BOLD}Public Web:${RESET}    ${CYAN}http://localhost:3001${RESET}"
echo -e "  ⚙️ ${BOLD}Admin Panel:${RESET}   ${CYAN}http://localhost:3002/admin/${RESET}"
echo -e "------------------------------------------------------------"
echo -e "${YELLOW}Press Ctrl+C to stop all servers gracefully.${RESET}\n"

# 6. Trap signals for graceful shutdown
cleanup() {
  echo -e "\n${YELLOW}Shutting down servers...${RESET}"
  # Kill all child jobs of this shell
  trap - SIGINT SIGTERM EXIT
  kill 0 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 7. Start all dev servers via pnpm parallel
pnpm --parallel run dev
