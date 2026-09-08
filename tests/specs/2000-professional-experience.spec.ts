import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: The credential buttons (resume, letter of recommendation,
// LinkedIn, GitHub) are present, correctly labelled, and point at the right
// destination.
// Why It Matters: These are the highest-intent CTAs on the whole site for a
// hiring manager — a broken download link or wrong profile URL here directly
// costs an opportunity, silently.
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
