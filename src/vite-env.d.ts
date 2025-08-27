/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  readonly VITE_INITIAL_CREDITS: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}