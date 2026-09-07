import { defineConfig, devices } from '@playwright/test';

// Testing against the dev server, not a production build — this is our own
// app (unlike OptumPlaywright's live-third-party-site suite), so a fast,
// hot-reloading local server is the right default for day-to-day authoring.
// Swap to `npm run build && npm run preview` (see tests/AUTHORING_GUIDE.md)
// once CI is wired up, for a production-parity run.
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
    command: 'npm run dev -- --port 5173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
