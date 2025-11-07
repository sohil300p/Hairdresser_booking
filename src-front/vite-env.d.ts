/// <reference types="vite/client" />

declare module '*.svg' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_MAPIR_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

