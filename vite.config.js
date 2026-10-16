import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// A relative base keeps the generated /docs build working in any GitHub repository name.
export default defineConfig({
  base: './',
  plugins: [react()],
  // Needed for sandbox previews and harmless for a static portfolio starter.
  server: { host: '0.0.0.0', allowedHosts: true },
  preview: { host: '0.0.0.0', allowedHosts: true },
  // The isolated Three.js module is intentionally ~690 kB before gzip.
  build: { chunkSizeWarningLimit: 700 },
})
