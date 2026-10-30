#!/usr/bin/env bash
# Roda um script Node que usa o Playwright, sem dependência no package.json do projeto.
# A versão casa com o Chromium em cache (~/.cache/ms-playwright); ao trocar, troque os dois.
# Uso: pw.sh caminho/do/script.mjs [args...]
set -euo pipefail
PLAYWRIGHT_VERSION=1.63.0

PLAYWRIGHT_DIR="$(npx -y -p "playwright@$PLAYWRIGHT_VERSION" sh -c 'dirname "$(realpath "$(command -v playwright)")"')"
export PLAYWRIGHT_DIR
# Com o service worker ligado (offline), os pedidos dele também passam pelo context.route.
export PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1
exec node "$@"
