#!/usr/bin/env bash
# Gera o build e serve com `vite preview` em segundo plano (porta APP_PORT de env.sh).
# Preview em vez de um segundo `vite dev`: não reotimiza node_modules/.vite, então não derruba o dev
# server do Lucas. Mudou o código? Rode de novo (refaz o build). Uso: app.sh [--sem-build]
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SKILL_DIR/../../.." && pwd)"
source "$SKILL_DIR/env.sh"
mkdir -p "$STATE_DIR"

if [[ -f "$STATE_DIR/app.pid" ]]; then
  kill "$(cat "$STATE_DIR/app.pid")" 2>/dev/null || true
  rm -f "$STATE_DIR/app.pid"
fi

cd "$REPO_DIR"
if [[ "${1:-}" != "--sem-build" ]]; then
  npm run build >"$STATE_DIR/build.log" 2>&1 || { tail -30 "$STATE_DIR/build.log" >&2; exit 1; }
fi
# O binário direto, sem npx: o pid salvo é o do próprio vite, e o down.sh consegue matá-lo.
nohup ./node_modules/.bin/vite preview --port "$APP_PORT" --strictPort >"$STATE_DIR/app.log" 2>&1 &
echo $! >"$STATE_DIR/app.pid"

for _ in $(seq 1 40); do
  curl -s -o /dev/null "http://localhost:$APP_PORT/" && { echo "App em http://localhost:$APP_PORT"; exit 0; }
  sleep 0.25
done
echo "O preview não respondeu; ver $STATE_DIR/app.log" >&2
exit 1
