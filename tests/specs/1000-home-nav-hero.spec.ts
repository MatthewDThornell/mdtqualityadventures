import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: The homepage's shared header/nav renders correctly and every
// link resolves to a real destination.
// Why It Matters: The header is duplicated by hand across all four pages
// (see README.md#automation-ids) — a typo in one copy's href silently breaks
// navigation without ever showing up as a build error.
test.describe('Home — Nav', () => {
  test(
    'Test_Case_1000_Home_Nav_AllLinks_ArePresentAndPointToRealDestinations',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the brand link and every nav link are visible', async () => {
        await expect.soft(home.navBrand).toBeVisible();
        for (const section of [
          'experience',
          'accomplishments',
          'qa-standards',
          'tau',
          'jobs',
          'recommendations',
          'about-me',
          'mentors',
          'mentees',
          'adventures',
          'contact',
        ] as const) {
          await expect.soft(home.navLink(section)).toBeVisible();
        }
      });

      await test.step('Then the QA Standards, TAU, and Jobs links point at real pages', async () => {
        await expect
          .soft(home.navLink('qa-standards'))
          .toHaveAttribute('href', '/qa-standards.html');
        await expect
          .soft(home.navLink('tau'))
          .toHaveAttribute('href', '/test-automation-university.html');
        await expect.soft(home.navLink('jobs')).toHaveAttribute('href', '/jobs.html');
      });

      await test.step('Then every in-page nav link targets a hash that exists on this page', async () => {
        const inPageLinks: Array<[Parameters<typeof home.navLink>[0], string]> = [
          ['experience', '#experience'],
          ['accomplishments', '#fieldnotes'],
          ['recommendations', '#letters'],
          ['about-me', '#origins'],
          ['mentors', '#mentors'],
          ['mentees', '#mentees'],
          ['adventures', '#volunteer'],
          ['contact', '#contact'],
        ];
        for (const [section, hash] of inPageLinks) {
          await expect.soft(home.navLink(section)).toHaveAttribute('href', hash);
          await expect.soft(page.locator(hash)).toHaveCount(1);
        }
      });
    },
  );

  test(
    'Test_Case_1001_Home_NavToggle_OpensAndClosesMobileNav',
    { tag: '@smoke' },
    async ({ page }) => {
      await page.setViewportSize({ width: 480, height: 900 });
      const home = new HomePage(page);
      await home.goto();

      await test.step('Given the mobile nav starts closed', async () => {
        await expect.soft(home.navToggle).toHaveAttribute('aria-expanded', 'false');
      });

      await test.step('When the toggle is clicked, the nav opens', async () => {
        await home.openMobileNav();
        await expect.soft(home.navToggle).toHaveAttribute('aria-expanded', 'true');
        await expect.soft(home.navLink('contact')).toBeVisible();
      });

      await test.step('When a nav link is clicked, the mobile nav closes again', async () => {
        await home.navLink('contact').click();
        await expect.soft(home.navToggle).toHaveAttribute('aria-expanded', 'false');
      });
    },
  );
});

// What It Tests: The hero identity section (name, role, and the screen-reader
// text backing the animated eyebrow/tagline) is present and correct.
// Why It Matters: This is the first thing a hiring manager sees — and per the
// site's own accessibility fix, the *only* stable text a screen reader gets
// for it, since the animated versions are aria-hidden and pass through
// empty/partial states mid-cycle.
test.describe('Home — Hero', () => {
  test(
    'Test_Case_1010_Home_Hero_IdentityText_IsVisibleAndStable',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the h1 shows the name, and the static a11y text backs the eyebrow/tagline', async () => {
        await expect.soft(home.heroHeading).toHaveText('Matthew D Thornell');
        await expect.soft(home.heroEyebrowStatic).toHaveText('A career portfolio, written by');
        await expect
          .soft(home.heroTaglineStatic)
          .toHaveText('Software QA Engineer & Quality Advocate');
      });

      await test.step('Then the scroll cue points at the first chapter', async () => {
        await expect.soft(home.heroScrollCue).toHaveAttribute('href', '#chapter-one');
      });
    },
  );

  test(
    'Test_Case_1011_Home_CareerTrail_PopulatesAsTaglineCycles',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the first "Former X at Y" tagline phrase adds a career-trail entry', async () => {
        // the typewriter takes a few seconds to reach the first employer phrase —
        // no hard sleep, just a generous auto-retrying wait on the real DOM change
        await expect(home.careerTrailItem('veterans-united')).toBeVisible({ timeout: 20_000 });
      });
    },
  );
});
