function normalizeBaseUrl(value: string | undefined) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

export const environment = Object.freeze({
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
});
