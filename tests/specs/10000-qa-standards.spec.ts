import { test, expect } from '@playwright/test';
import { QaStandardsPage } from '../pages/QaStandardsPage';

// What It Tests: The QA Standards page loads with its nav marked current, its
// GitHub card links out correctly, and a code block's Copy button actually
// copies that block's code to the clipboard.
// Why It Matters: This page is itself a demonstration of the site owner's QA
// standards to a technical audience — a broken "Copy" button here is a
// credibility problem, not just a bug.
test.describe('QA Standards', () => {
  test('Test_Case_10000_QaStandards_Page_LoadsWithNavMarkedCurrent', { tag: '@smoke' }, async ({ page }) => {
    const standards = new QaStandardsPage(page);
    await standards.goto();

    await test.step('Then the heading and GitHub card are visible', async () => {
      await expect.soft(standards.heading).toBeVisible();
      await expect.soft(standards.githubCard).toBeVisible();
    });

    await test.step('Then the QA Standards nav link is marked as the current page', async () => {
      await expect.soft(standards.navLink('qa-standards')).toHaveAttribute('aria-current', 'page');
    });
  });

  test('Test_Case_10001_QaStandards_CopyButton_CopiesBlockCodeToClipboard', { tag: '@regression' }, async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions API is Chromium-only.');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const standards = new QaStandardsPage(page);
    await standards.goto();

    await test.step('When the "Prefer" locator-strategy example is copied', async () => {
      await standards.copyButton('locator-strategy-prefer').click();
      await expect.soft(standards.copyButton('locator-strategy-prefer')).toHaveText('Copied');
    });

    await test.step('Then the clipboard contains that block\'s actual code', async () => {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect.soft(clipboardText).toContain("page.getByTestId('checkout-submit')");
    });

    await test.step('Then the button label reverts back to "Copy" after the confirmation window', async () => {
      await expect(standards.copyButton('locator-strategy-prefer')).toHaveText('Copy', { timeout: 3000 });
    });
  });
});
