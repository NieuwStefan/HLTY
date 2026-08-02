/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPIFY_DOMAIN: string;
  readonly VITE_STOREFRONT_TOKEN: string;
  readonly VITE_OPENAI_API_KEY: string;
  // Fase 10 — tracking. Ontbreken deze, dan no-op (geen tracking in dev).
  readonly VITE_GA4_ID?: string;
  readonly VITE_META_PIXEL_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
