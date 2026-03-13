#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

free_port() {
  local port="$1"
  local pids

  pids="$(lsof -tiTCP:${port} -sTCP:LISTEN || true)"
  if [[ -z "$pids" ]]; then
    return
  fi

  echo "Freeing TCP port ${port}: ${pids}"
  echo "$pids" | xargs -r kill
  sleep 1

  pids="$(lsof -tiTCP:${port} -sTCP:LISTEN || true)"
  if [[ -n "$pids" ]]; then
    echo "Force-killing remaining listeners on ${port}: ${pids}"
    echo "$pids" | xargs -r kill -9
  fi
}

free_port 3000
free_port 4000

pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save
pm2 list
