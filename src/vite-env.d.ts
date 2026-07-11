/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the APIforge API server, no trailing slash. See .env.example. */
  readonly VITE_API_SERVER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
