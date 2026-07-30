/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_SERVER: string;
  readonly VITE_DEBUG?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
