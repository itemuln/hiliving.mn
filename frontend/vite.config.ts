import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, '..', 'VITE_')

  return {
    envDir: '..',
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: environment.VITE_DEV_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      restoreMocks: true,
    },
  }
})
