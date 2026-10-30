#!/usr/bin/env bash
# Derruba tudo o que up.sh e app.sh subiram.
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SKILL_DIR/env.sh"

if [[ -f "$STATE_DIR/app.pid" ]]; then
  kill "$(cat "$STATE_DIR/app.pid")" 2>/dev/null
  rm -f "$STATE_DIR/app.pid"
fi
docker rm -f "$REST" "$DB" >/dev/null 2>&1
docker network rm "$NET" >/dev/null 2>&1
echo "Ambiente de teste derrubado"
