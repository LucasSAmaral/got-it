// Print de uma tela do app contra o banco local. Também serve de modelo para scripts de teste.
// Uso: pw.sh screenshot.mjs <caminho> [--usuario leitor|admin|nenhum] [--saida arquivo.png]
//        [--largura 390] [--esperar "texto que precisa aparecer"] [--offline]
import { parseArgs } from 'node:util'
import { APP_URL, USERS, goOffline, newContext, withBrowser } from './lib.mjs'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    usuario: { type: 'string', default: 'leitor' },
    saida: { type: 'string', default: 'tela.png' },
    largura: { type: 'string', default: '390' },
    esperar: { type: 'string' },
    offline: { type: 'boolean', default: false },
  },
})
const path = positionals[0] ?? '/'
const width = Number(values.largura)

await withBrowser(async (browser) => {
  const user = values.usuario === 'nenhum' ? undefined : USERS[values.usuario]
  const context = await newContext(browser, {
    user,
    serviceWorker: values.offline,
    viewport: { width, height: width < 900 ? 844 : 900 },
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))

  await page.goto(APP_URL + path)
  if (values.offline) await goOffline(page)
  if (values.esperar) await page.getByText(values.esperar).first().waitFor({ timeout: 10_000 })
  else await page.waitForLoadState('networkidle')

  await page.screenshot({ path: values.saida, fullPage: true })
  console.log(`Print salvo em ${values.saida}`)
  if (errors.length) console.log(`Erros no console:\n${errors.join('\n')}`)
})
