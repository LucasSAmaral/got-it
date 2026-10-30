# Nomes e portas do ambiente de teste local, usados pelos outros scripts (e espelhados em lib.mjs).
NET=got-it-test
DB=got-it-test-db
REST=got-it-test-rest
DB_PORT=54329
REST_PORT=54330
APP_PORT=4179
# Só para o teste local: assina os JWTs da sessão falsa. Não tem relação com o Supabase.
JWT_SECRET=got-it-teste-local-segredo-com-32-chars-ou-mais
STATE_DIR="${TMPDIR:-/tmp}/got-it-test"
