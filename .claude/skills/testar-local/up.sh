#!/usr/bin/env bash
# Sobe Postgres + PostgREST locais com o schema de supabase/migrations e os dados de seed.sql.
# Recria do zero a cada execução (derruba o que houver antes). Uso: up.sh [--sem-seed]
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SKILL_DIR/../../.." && pwd)"
source "$SKILL_DIR/env.sh"

"$SKILL_DIR/down.sh" >/dev/null 2>&1 || true

docker network create "$NET" >/dev/null
docker run -d --name "$DB" --network "$NET" -p "127.0.0.1:$DB_PORT:5432" \
  -e POSTGRES_PASSWORD=postgres \
  -v "$REPO_DIR/supabase/migrations:/migrations:ro" \
  -v "$SKILL_DIR:/skill:ro" \
  postgres:16 >/dev/null

# Sempre por TCP (-h 127.0.0.1): durante o initdb a imagem sobe um servidor temporário só no socket
# local, que aceita conexão e depois reinicia. Pelo TCP só responde o servidor definitivo.
pg() { docker exec "$DB" psql -h 127.0.0.1 -U postgres -q -v ON_ERROR_STOP=1 "$@"; }
for _ in $(seq 1 60); do
  pg -tAc 'select 1' >/dev/null 2>&1 && break
  sleep 0.5
done

psql_file() { pg -f "$1" >/dev/null; }

psql_file /skill/stubs.sql
for f in "$REPO_DIR"/supabase/migrations/*.sql; do
  name="$(basename "$f")"
  if ! out=$(pg -f "/migrations/$name" 2>&1); then
    echo "Falhou na migração $name:" >&2
    echo "$out" >&2
    exit 1
  fi
done
echo "Migrações aplicadas: $(ls "$REPO_DIR"/supabase/migrations/*.sql | wc -l)"

if [[ "${1:-}" != "--sem-seed" ]]; then
  psql_file /skill/seed.sql
  echo "Seed aplicado (admin e leitor; ver seed.sql)"
fi

docker run -d --name "$REST" --network "$NET" -p "127.0.0.1:$REST_PORT:3000" \
  -e PGRST_DB_URI="postgres://authenticator:authenticator@$DB:5432/postgres" \
  -e PGRST_DB_SCHEMAS=public \
  -e PGRST_DB_ANON_ROLE=anon \
  -e PGRST_JWT_SECRET="$JWT_SECRET" \
  postgrest/postgrest >/dev/null

for _ in $(seq 1 40); do
  curl -s -o /dev/null "http://127.0.0.1:$REST_PORT/" && break
  sleep 0.25
done
echo "PostgREST em http://127.0.0.1:$REST_PORT  |  Postgres em 127.0.0.1:$DB_PORT (postgres/postgres)"
