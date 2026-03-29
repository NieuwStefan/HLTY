/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPIFY_DOMAIN: string;
  readonly VITE_STOREFRONT_TOKEN: string;
  readonly VITE_API_VERSION: string;
  readonly VITE_OPENAI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
