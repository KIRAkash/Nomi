import { defineConfig } from 'vite';

// The landing is served at `/` from the same host as the Expo web export, so its own files live under /site/ to stay
// clear of the app's /_expo and /assets.
export default defineConfig({
  base: '/site/',
  server: { port: 5174 },
  build: { outDir: 'dist', assetsInlineLimit: 0 },
});
