import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Four real pages, not one page with client-side routes: without this Vite
  // answers any unknown path with index.html in dev and preview, where Netlify
  // answers it with a 404 — and a test that asserts a 404 (Quaid, in
  // 4000-recommendations.spec.ts) has to see the same thing everywhere.
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        qaStandards: resolve(__dirname, 'qa-standards.html'),
        testAutomationUniversity: resolve(__dirname, 'test-automation-university.html'),
        jobs: resolve(__dirname, 'jobs.html'),
      },
    },
  },
});
