// Ajudantes para testar o app no navegador contra o banco local (up.sh) ou só com mocks.
// Importe pelo caminho absoluto num script seu (no scratchpad) e rode com pw.sh.
import { createHmac } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_DIR = join(SKILL_DIR, '../../..')

// Espelha env.sh e seed.sql.
export const REST_URL = 'http://127.0.0.1:54330'
export const APP_URL = process.env.APP_URL ?? 'http://localhost:4179'
const JWT_SECRET = 'got-it-teste-local-segredo-com-32-chars-ou-mais'
export const USERS = {
  admin: { id: '1df84c70-a8b3-43b9-a528-cf50cac4946a', email: 'admin@teste.local' },
  leitor: { id: '00000000-0000-4000-8000-000000000001', email: 'leitor@teste.local' },
}

// O app é gerado com o VITE_SUPABASE_URL do .env (produção). As rotas abaixo interceptam esse
// host inteiro: nada do teste chega ao Supabase de verdade.
export const SUPABASE_URL = readFileSync(join(REPO_DIR, '.env'), 'utf8').match(/^VITE_SUPABASE_URL=(\S+)/m)[1]
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0]

export function loadPlaywright() {
  if (!process.env.PLAYWRIGHT_DIR) throw new Error('Rode o script com pw.sh')
  return createRequire(import.meta.url)(process.env.PLAYWRIGHT_DIR)
}

const b64url = (value) => Buffer.from(value).toString('base64url')

export function signJwt(payload) {
  const body = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(payload))}`
  return `${body}.${createHmac('sha256', JWT_SECRET).update(body).digest('base64url')}`
}

const jwtRole = (token) => {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url')).role
  } catch {
    return undefined
  }
}

export function fakeSession(user) {
  const now = Math.floor(Date.now() / 1000)
  const token = signJwt({ sub: user.id, role: 'authenticated', aud: 'authenticated', email: user.email, exp: now + 3600 })
  return {
    access_token: token,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: 'refresh-falso',
    user: {
      id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      app_metadata: { provider: 'email' },
      user_metadata: {},
      created_at: '2026-01-01T00:00:00Z',
    },
  }
}

const json = (route, status, body) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

/**
 * Contexto do navegador com sessão falsa (ou sem sessão) e o Supabase redirecionado:
 * /rest/v1/* vai para o PostgREST local (rest: 'local') ou para o handler `rest(route, path)`;
 * /auth/v1 responde com a sessão falsa; /storage/v1 devolve 404; o resto do host é abortado.
 * Service worker bloqueado por padrão; `serviceWorker: true` liga (precisa para abrir sem rede).
 * Os pedidos do SW também passam pelas rotas porque pw.sh liga
 * PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS.
 */
export async function newContext(browser, { user, rest = 'local', serviceWorker = false, ...options } = {}) {
  const session = user ? fakeSession(user) : null
  const context = await browser.newContext({ serviceWorkers: serviceWorker ? 'allow' : 'block', ...options })
  if (session) {
    await context.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [`sb-${PROJECT_REF}-auth-token`, JSON.stringify(session)],
    )
  }
  await context.route(`${SUPABASE_URL}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (path.startsWith('/rest/v1/')) {
      if (typeof rest === 'function') return rest(route, path.slice('/rest/v1'.length) + url.search)
      const headers = { ...request.headers() }
      delete headers.apikey
      // Sem sessão, o supabase-js manda a chave anônima de produção, que o PostgREST local recusaria
      // (outra assinatura): sem Authorization ele usa o role anon, que é o mesmo efeito.
      if (jwtRole((headers.authorization ?? '').replace(/^Bearer /, '')) !== 'authenticated') delete headers.authorization
      const response = await route.fetch({ url: REST_URL + path.slice('/rest/v1'.length) + url.search, headers })
      return route.fulfill({ response })
    }
    if (path.startsWith('/auth/v1/')) {
      if (!session) return json(route, 401, { message: 'sem sessão' })
      if (path === '/auth/v1/user') return json(route, 200, session.user)
      if (path === '/auth/v1/token') return json(route, 200, session)
      if (path === '/auth/v1/logout') return route.fulfill({ status: 204 })
      return json(route, 404, { message: `auth não simulado: ${path}` })
    }
    if (path.startsWith('/storage/v1/')) return json(route, 404, { message: 'storage não simulado' })
    return route.abort()
  })
  return context
}

/**
 * Simula abrir o app sem sinal: carrega online (o SW instala e a lista grava a cópia offline),
 * espera o SW controlar a página, corta a rede e recarrega. O contexto precisa de serviceWorker: true.
 */
export async function goOffline(page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
  })
  await page.context().setOffline(true)
  await page.reload()
}

/** Abre o navegador, roda `fn(browser)` e fecha mesmo se der erro. */
export async function withBrowser(fn, launchOptions = {}) {
  const { chromium } = loadPlaywright()
  const browser = await chromium.launch(launchOptions)
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}
