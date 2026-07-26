/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEV_API_PROXY_TARGET?: string;
  readonly VITE_MAP_TILE_URL?: string;
  readonly VITE_NOMINATIM_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
