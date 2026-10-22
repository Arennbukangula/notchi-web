/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    readonly GITHUB_TOKEN?: string;
    readonly GITHUB_OWNER?: string;
    readonly GITHUB_REPO?: string;
    readonly SITE_URL?: string;
  }
}
