import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: The credential buttons (resume, letter of recommendation,
// LinkedIn, GitHub) are present, correctly labelled, and point at the right
// destination.
// Why It Matters: These are the highest-intent CTAs on the whole site for a
// hiring manager — a broken download link or wrong profile URL here directly
// costs an opportunity, silently.
// What It Tests: The "by the numbers" strip lands on the figures the page
// states elsewhere in prose, once its count-up has finished.
// Why It Matters: A hiring manager skims these four numbers before reading
// a word — a figure stuck mid-count, or one that drifts from the content it
// summarises (the letters count is checked against the actual cards), reads
// as sloppiness on the one page that argues for attention to detail.
test.describe('Professional Experience — By the numbers', () => {
  test(
    'Test_Case_2010_Experience_Figures_CountUpToTheStatedValues',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('When the strip scrolls into view, the figures count up and settle', async () => {
        await home.figures.scrollIntoViewIfNeeded();
        await expect(home.figureNumber('years')).toHaveText('7+');
        await expect.soft(home.figureNumber('coverage')).toHaveText('80%');
        await expect.soft(home.figureNumber('mentored')).toHaveText('15+');
      });

      await test.step('Then the letters figure matches the number of recommendation cards on the page', async () => {
        const letters = await home.recommendationLetters.count();
        expect.soft(letters).toBeGreaterThan(0);
        await expect.soft(home.figureNumber('letters')).toHaveText(String(letters));
      });
    },
  );

  test(
    'Test_Case_2011_Experience_Figures_ReducedMotion_ShowsFinalValuesImmediately',
    { tag: '@regression' },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then no count-up runs — the markup already carries the final values', async () => {
        await expect.soft(home.figureNumber('years')).toHaveText('7+');
        await expect.soft(home.figureNumber('coverage')).toHaveText('80%');
        await expect.soft(home.figureNumber('mentored')).toHaveText('15+');
        await expect.soft(home.figureNumber('letters')).toHaveText('10');
      });
    },
  );
});

test.describe('Professional Experience — Credentials', () => {
  test(
    'Test_Case_2000_Experience_CredentialButtons_HaveCorrectDestinations',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the resume and letter buttons download the right files', async () => {
        await expect.soft(home.credentialResumeBtn).toHaveAttribute('href', '/resume.pdf');
        await expect.soft(home.credentialResumeBtn).toHaveAttribute('download', '');
        await expect
          .soft(home.credentialLetterBtn)
          .toHaveAttribute('href', '/letter-of-recommendation.pdf');
        await expect.soft(home.credentialLetterBtn).toHaveAttribute('download', '');
      });

      await test.step('Then the LinkedIn and GitHub buttons open the right profiles in a new tab', async () => {
        await expect
          .soft(home.credentialLinkedInBtn)
          .toHaveAttribute('href', 'https://www.linkedin.com/in/matthew-d-thornell/');
        await expect.soft(home.credentialLinkedInBtn).toHaveAttribute('target', '_blank');
        await expect.soft(home.credentialLinkedInBtn).toHaveAttribute('rel', /noopener/);
        await expect
          .soft(home.credentialGitHubBtn)
          .toHaveAttribute('href', 'https://github.com/MatthewDThornell');
        await expect.soft(home.credentialGitHubBtn).toHaveAttribute('target', '_blank');
        await expect.soft(home.credentialGitHubBtn).toHaveAttribute('rel', /noopener/);
      });
    },
  );

  test(
    'Test_Case_2001_Experience_Timeline_AllEmployersArePresentInOrder',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then every employer timeline entry is present, most recent first', async () => {
        const expectedOrder = [
          'veterans-united',
          'seekwell-1800contacts',
          'werner',
          'conexed',
          'legrand',
          'devmountain',
        ];
        for (const slug of expectedOrder) {
          await expect.soft(home.timelineItem(slug)).toBeVisible();
        }

        const timeline = page.locator('.timeline > li');
        await expect.soft(timeline).toHaveCount(expectedOrder.length);
        for (let i = 0; i < expectedOrder.length; i++) {
          await expect
            .soft(timeline.nth(i))
            .toHaveAttribute('data-testid', `timeline-item-${expectedOrder[i]}`);
        }
      });
    },
  );
});

// What It Tests: Each role on the timeline writes itself out when it scrolls
// into view, and its words are in the page the whole time it does.
// Why It Matters: This is the résumé. The effect may never cost a reader, a
// screen reader or a crawler the text itself — src/type-reveal.js hides what
// it has not typed yet instead of removing it, and this is what holds that
// promise in place.
test.describe('Experience — Roles type themselves out', () => {
  const ROLE_TEXT = 'Built Playwright automation from scratch';

  test(
    'Test_Case_2020_Experience_Roles_TypeOutWithoutEverLosingTheirText',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const entry = home.timelineEntry('veterans-united');

      await test.step('Given the role waits unwritten — its ink hidden, its words already there', async () => {
        await expect.soft(entry).toHaveClass(/tw-waiting/);
        await expect.soft(entry).not.toBeVisible();
        // the assertion a crawler or a screen reader would make
        await expect.soft(entry).toContainText(ROLE_TEXT);
      });

      await test.step('When it scrolls into view, it types — and still reads in full while it does', async () => {
        await entry.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await expect(entry).toHaveClass(/is-typing|tw-written/, { timeout: 15_000 });
        await expect.soft(entry).toContainText(ROLE_TEXT);
        // whatever is still to come is hidden, never deleted
        const pending = await entry.locator('.tw-pending').count();
        const written = await entry.evaluate((el) => el.classList.contains('tw-written'));
        expect
          .soft(pending > 0 || written, 'mid-type, the untyped tail is a hidden span')
          .toBe(true);
      });

      await test.step('Then it finishes, and leaves the markup exactly as it found it', async () => {
        await expect(entry).toHaveClass(/tw-written/, { timeout: 30_000 });
        await expect.soft(entry).toBeVisible();
        await expect.soft(entry).toContainText(ROLE_TEXT);
        await expect.soft(entry.locator('.tw-typed, .tw-pending')).toHaveCount(0);
      });
    },
  );

  test(
    'Test_Case_2021_Experience_Roles_ReducedMotion_AreSimplyWritten',
    { tag: '@regression' },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then nothing waits to be typed, and every role reads plainly', async () => {
        await expect.soft(page.locator('#experience .tw-waiting')).toHaveCount(0);
        await expect.soft(page.locator('#experience .tw-pending')).toHaveCount(0);
        const entry = home.timelineEntry('veterans-united');
        await expect.soft(entry).toBeVisible();
        await expect.soft(entry).toContainText(ROLE_TEXT);
      });
    },
  );
});
