/// <reference types="vite/client" />

/** Versão do `package.json`, injetada no build (`define` em `vite.config.ts`). */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
