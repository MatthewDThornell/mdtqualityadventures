import { test, expect } from '@playwright/test';
import { TauPage } from '../pages/TauPage';

// What It Tests: A TAU course row's Watch button loads the right YouTube
// embed on click, and Hide actually tears the iframe down rather than just
// hiding it.
// Why It Matters: src/test-automation-university.js deliberately unmounts the
// iframe on Hide "so playback actually stops instead of just hiding it" (per
// its own comment) — a regression here would leave audio playing in the
// background after a visitor thinks they've closed the video.
test.describe('Test Automation University', () => {
  test('Test_Case_11000_Tau_Page_LoadsWithNavMarkedCurrent', { tag: '@smoke' }, async ({ page }) => {
    const tau = new TauPage(page);
    await tau.goto();

    await expect.soft(tau.heading).toBeVisible();
    await expect.soft(tau.navLink('tau')).toHaveAttribute('aria-current', 'page');
  });

  test('Test_Case_11001_Tau_WatchButton_LoadsAndTearsDownVideoEmbed', { tag: '@smoke' }, async ({ page }) => {
    const tau = new TauPage(page);
    await tau.goto();
    const courseSlug = 'playwright-advanced';
    const videoId = 'sl2lZhRofhQ';

    await test.step('Given the course row starts collapsed', async () => {
      await expect.soft(tau.watchButton(courseSlug)).toHaveText('Watch');
      await expect.soft(tau.watchButton(courseSlug)).toHaveAttribute('aria-expanded', 'false');
      await expect.soft(tau.videoEmbed(videoId)).toHaveCount(0);
    });

    await test.step('When Watch is clicked, the YouTube embed loads', async () => {
      await tau.watchButton(courseSlug).click();
      await expect.soft(tau.watchButton(courseSlug)).toHaveText('Hide');
      await expect.soft(tau.watchButton(courseSlug)).toHaveAttribute('aria-expanded', 'true');
      await expect.soft(tau.videoEmbed(videoId)).toHaveAttribute('src', `https://www.youtube.com/embed/${videoId}`);
    });

    await test.step('When Hide is clicked, the iframe is actually removed (not just hidden)', async () => {
      await tau.watchButton(courseSlug).click();
      await expect.soft(tau.watchButton(courseSlug)).toHaveText('Watch');
      await expect.soft(tau.videoEmbed(videoId)).toHaveCount(0);
    });
  });

  test('Test_Case_11002_Tau_CourseRows_LinkedCoursesPointAtRealPages', { tag: '@regression' }, async ({ page }) => {
    const tau = new TauPage(page);
    await tau.goto();

    await test.step('Then a sample of linked course rows point at testautomationu.applitools.com', async () => {
      for (const slug of ['salesforce-qa-intro', 'playwright-advanced', 'cypress-getting-started']) {
        const link = tau.courseRow(slug).getByRole('link');
        await expect.soft(link).toHaveAttribute('href', new RegExp(`^https://testautomationu\\.applitools\\.com/${slug}/`));
        await expect.soft(link).toHaveAttribute('target', '_blank');
      }
    });
  });
});
