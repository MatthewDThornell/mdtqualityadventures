import { defineConfig, devices } from '@playwright/test';

// Locally: the dev server, for fast hot-reloading authoring. In CI
// (.github/workflows/ci.yml sets CI=true): a real production build served via
// `vite preview`, for a run that matches what actually gets deployed.
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    // matches OptumPlaywright's TestBase viewport — also functionally required
    // here: the site's nav collapses into the mobile hamburger menu below
    // 1320px (src/style.css), so anything narrower needs openMobileNav() first.
    // Actual effective viewport comes from the chromium project below, which
    // has to respread this after devices['Desktop Chrome'] — kept here too
    // as the default for any future project that doesn't spread a device.
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // devices['Desktop Chrome'] carries its own 1280x720 viewport, which
    // would silently override the 1440x900 set in the top-level `use` block
    // above (project-level `use` wins on overlapping keys) — respread it
    // after the device preset so it actually takes effect.
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],

  webServer: {
    command: process.env.CI
      ? 'npm run build && npm run preview -- --port 5173 --strictPort'
      : 'npm run dev -- --port 5173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
