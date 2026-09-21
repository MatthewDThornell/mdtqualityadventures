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

      await test.step('Then the brand link, the three group headings, and Contact are visible', async () => {
        await expect.soft(home.navBrand).toBeVisible();
        await expect.soft(home.navGroupToggle('professional')).toHaveText('The Professional');
        await expect.soft(home.navGroupToggle('person')).toHaveText('The Person');
        await expect.soft(home.navGroupToggle('people')).toHaveText('The People');
        await expect.soft(home.navLink('contact')).toBeVisible();
      });

      await test.step('Then each group folds out its own pages, in order', async () => {
        // the nav is hand-duplicated across four pages (README.md#automation-ids),
        // so the grouping and labels are asserted here, not just the hrefs
        const groups = [
          {
            group: 'professional',
            labels: [
              'Professional Experience',
              'Accomplishments',
              'QA Standards',
              'QA Courses',
              'Jobs',
            ],
          },
          { group: 'person', labels: ['About Me', 'Quality Adventures', 'Test Pilot'] },
          { group: 'people', labels: ['Mentors', 'The Quality Ripple', 'Recommendations'] },
        ] as const;
        for (const { group, labels } of groups) {
          await home.openNavGroup(group);
          await expect.soft(home.navGroupMenu(group).getByRole('link')).toHaveText([...labels]);
        }
      });

      await test.step("Then the page's three chapter openers carry the same names, in the same order", async () => {
        // the nav is the journal's table of contents — the groups and the chapters
        // must keep naming the same three things (see README.md#structure)
        await expect
          .soft(page.locator('.chapter-opener h2'))
          .toHaveText(['The Professional', 'The Person', 'The People']);
      });

      await test.step('Then the QA Standards, TAU, and Jobs links point at real pages', async () => {
        await home.openNavGroup('professional');
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
          ['about-me', '#origins'],
          ['adventures', '#volunteer'],
          ['test-pilot', '#test-pilot'],
          ['mentors', '#mentors'],
          ['mentees', '#mentees'],
          ['recommendations', '#letters'],
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

      await test.step('When the toggle is clicked, the nav opens as a full outline with every group unfolded', async () => {
        await home.openMobileNav();
        await expect.soft(home.navToggle).toHaveAttribute('aria-expanded', 'true');
        for (const group of ['professional', 'person', 'people'] as const) {
          await expect.soft(home.navGroupToggle(group)).toHaveAttribute('aria-expanded', 'true');
        }
        await expect.soft(home.navLink('experience')).toBeVisible();
        await expect.soft(home.navLink('test-pilot')).toBeVisible();
        await expect.soft(home.navLink('recommendations')).toBeVisible();
        await expect.soft(home.navLink('contact')).toBeVisible();
      });

      await test.step('When a group heading is tapped, only that group folds away', async () => {
        await home.openNavGroup('person');
        await expect.soft(home.navGroupToggle('person')).toHaveAttribute('aria-expanded', 'false');
        await expect.soft(home.navLink('about-me')).not.toBeVisible();
        await expect.soft(home.navGroupToggle('people')).toHaveAttribute('aria-expanded', 'true');
        await expect.soft(home.navLink('mentors')).toBeVisible();
      });

      await test.step('When a nav link is clicked, the mobile nav closes again', async () => {
        await home.navLink('contact').click();
        await expect.soft(home.navToggle).toHaveAttribute('aria-expanded', 'false');
      });

      await test.step('When the nav is open and a tap lands outside it, it closes', async () => {
        await home.openMobileNav();
        await expect.soft(home.navToggle).toHaveAttribute('aria-expanded', 'true');
        await page.mouse.click(240, 850);
        await expect.soft(home.navToggle).toHaveAttribute('aria-expanded', 'false');
      });
    },
  );

  test(
    'Test_Case_1002_Home_NavGroups_OpenOneAtATimeAndClose',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Given every group starts closed', async () => {
        for (const group of ['professional', 'person', 'people'] as const) {
          await expect.soft(home.navGroupToggle(group)).toHaveAttribute('aria-expanded', 'false');
        }
        await expect.soft(home.navLink('qa-standards')).not.toBeVisible();
      });

      await test.step('When The Professional is opened, it reveals its pages', async () => {
        await home.openNavGroup('professional');
        await expect
          .soft(home.navGroupToggle('professional'))
          .toHaveAttribute('aria-expanded', 'true');
        await expect.soft(home.navLink('experience')).toBeVisible();
        await expect.soft(home.navLink('jobs')).toBeVisible();
      });

      await test.step('When The People is opened, The Professional closes — one group at a time', async () => {
        await home.openNavGroup('people');
        await expect.soft(home.navGroupToggle('people')).toHaveAttribute('aria-expanded', 'true');
        await expect.soft(home.navLink('mentors')).toBeVisible();
        await expect
          .soft(home.navGroupToggle('professional'))
          .toHaveAttribute('aria-expanded', 'false');
        await expect.soft(home.navLink('jobs')).not.toBeVisible();
      });

      await test.step('When Escape is pressed, it closes and returns focus to its heading', async () => {
        await page.keyboard.press('Escape');
        await expect.soft(home.navGroupToggle('people')).toHaveAttribute('aria-expanded', 'false');
        await expect.soft(home.navGroupToggle('people')).toBeFocused();
      });

      await test.step('When open and a click lands outside it, it closes again', async () => {
        await home.openNavGroup('person');
        await home.navBrand.click();
        await expect.soft(home.navGroupToggle('person')).toHaveAttribute('aria-expanded', 'false');
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

      await test.step('Then the entry is bracketed by the company logo, actually drawn on screen', async () => {
        // toBeVisible() ignores opacity, and the trail's logos are built after the
        // page's lazy-image fade-in has done its first pass — this once left every
        // logo parked at opacity 0 while every visibility check still passed
        const logos = home.careerTrailLogos('veterans-united');
        await expect.soft(logos).toHaveCount(2);
        await expect(logos.first()).toHaveCSS('opacity', '1');
        await expect.soft(logos.last()).toHaveCSS('opacity', '1');
        expect
          .soft(await logos.first().evaluate((img: HTMLImageElement) => img.naturalWidth))
          .toBeGreaterThan(0);
      });
    },
  );
});
