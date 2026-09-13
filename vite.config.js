import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
