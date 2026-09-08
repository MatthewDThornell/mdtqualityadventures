import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: Every contact method (email, phone, LinkedIn, GitHub, QAP)
// and the closing resume download button resolve to the right destination.
// Why It Matters: This is the last chapter on the page and the site's whole
// call to action — a wrong phone number or dead mailto link here silently
// costs a hiring manager's follow-up.
test.describe('Contact', () => {
  test(
    'Test_Case_9000_Contact_Links_PointToRealDestinations',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the section heading is visible', async () => {
        await expect.soft(page.getByRole('heading', { name: 'Send Word', level: 2 })).toBeVisible();
      });

      await test.step('Then every contact link resolves to the right destination', async () => {
        await expect
          .soft(home.contactLink('email'))
          .toHaveAttribute('href', 'mailto:MatthewDavidThornell@gmail.com');
        await expect.soft(home.contactLink('phone')).toHaveAttribute('href', 'tel:+18016608758');
        await expect
          .soft(home.contactLink('linkedin'))
          .toHaveAttribute('href', 'https://www.linkedin.com/in/matthew-d-thornell/');
        await expect
          .soft(home.contactLink('github'))
          .toHaveAttribute('href', 'https://github.com/MatthewDThornell');
        await expect.soft(home.contactLink('qap')).toHaveAttribute('href', 'https://qap.dev');
      });
    },
  );

  test(
    'Test_Case_9001_Contact_ResumeButton_DownloadsResumePdf',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the closing resume button downloads the real resume file', async () => {
        await expect.soft(home.contactResumeBtn).toHaveAttribute('href', '/resume.pdf');
        await expect.soft(home.contactResumeBtn).toHaveAttribute('download', '');
      });
    },
  );
});
