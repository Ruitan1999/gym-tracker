import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Stamped into the bundle and written alongside it, so a running app can ask
// the server what is deployed and notice it is behind.
const BUILD_ID = Date.now().toString(36);

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'emit-build-id',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ build: BUILD_ID }),
        });
        // Emitted rather than bundled: the worker decides how everything else is
        // fetched, so it has to sit at the root under a name that never changes
        // — a hashed filename would leave the old worker in charge.
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: readFileSync('src/sw.js', 'utf8').replace('__BUILD_ID__', BUILD_ID),
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor'))
            return 'charts';
          if (id.includes('firebase') || id.includes('@firebase/')) return 'firebase';
          if (id.includes('react-router')) return 'react';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler'))
            return 'react';
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
})
