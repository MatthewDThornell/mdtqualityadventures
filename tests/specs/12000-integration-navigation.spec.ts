import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { QaStandardsPage } from '../pages/QaStandardsPage';
import { TauPage } from '../pages/TauPage';

// What It Tests: Clicking through the header nav actually lands on the right
// page, not just that each page's own links look correct in isolation.
// Why It Matters: The nav is hand-duplicated across three separate HTML files
// with no shared template (see README.md#automation-ids) — a copy/paste slip
// in one file's href is exactly the kind of thing that only shows up when you
// actually click the link, not when you read the markup.
test.describe('Integration — Cross-page navigation', () => {
  test('Test_Case_12000_Navigation_HomeToQaStandardsAndBack_RoutesCorrectly', { tag: '@smoke' }, async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await test.step('When the QA Standards nav link is clicked from the homepage', async () => {
      await home.navLink('qa-standards').click();
      await expect(page).toHaveURL(/\/qa-standards\.html$/);
      const standards = new QaStandardsPage(page);
      await expect.soft(standards.heading).toBeVisible();
    });

    await test.step('When the brand link is clicked from QA Standards, it returns home', async () => {
      await home.navBrand.click();
      await expect(page).toHaveURL(/\/$/);
      await expect.soft(home.heroHeading).toBeVisible();
    });
  });

  test('Test_Case_12001_Navigation_HomeToTau_RoutesCorrectly', { tag: '@smoke' }, async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await test.step('When the TAU nav link is clicked from the homepage', async () => {
      await home.navLink('tau').click();
      await expect(page).toHaveURL(/\/test-automation-university\.html$/);
      const tau = new TauPage(page);
      await expect.soft(tau.heading).toBeVisible();
    });
  });

  test('Test_Case_12002_Navigation_QaStandardsToTau_RoutesCorrectly', { tag: '@regression' }, async ({ page }) => {
    const standards = new QaStandardsPage(page);
    await standards.goto();

    await test.step('When the TAU nav link is clicked from QA Standards', async () => {
      await standards.navLink('tau').click();
      await expect(page).toHaveURL(/\/test-automation-university\.html$/);
      const tau = new TauPage(page);
      await expect.soft(tau.heading).toBeVisible();
      await expect.soft(tau.navLink('tau')).toHaveAttribute('aria-current', 'page');
    });
  });

  test('Test_Case_12003_Navigation_InPageAnchor_ScrollsToExperienceSection', { tag: '@regression' }, async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await test.step('When the Professional Experience nav link is clicked', async () => {
      await home.navLink('experience').click();
      await expect(page).toHaveURL(/#experience$/);
      await expect.soft(page.locator('#experience')).toBeInViewport();
    });
  });
});
