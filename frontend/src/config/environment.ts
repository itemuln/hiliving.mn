function normalizeBaseUrl(value: string | undefined) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

function configuredValue(value: string | undefined, defaultValue: string) {
  return value?.trim() || defaultValue;
}

export const environment = Object.freeze({
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  mapTileUrl: configuredValue(
    import.meta.env.VITE_MAP_TILE_URL,
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  ),
  nominatimBaseUrl: normalizeBaseUrl(
    configuredValue(import.meta.env.VITE_NOMINATIM_BASE_URL, 'https://nominatim.openstreetmap.org')
  ),
});
