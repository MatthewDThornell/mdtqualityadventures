import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: The About Me chapter's core identity statement and its
// "7 Habits" list render with the right content and in the right order.
// Why It Matters: This is the one chapter that's pure narrative (no cards,
// no links) — the quote and habit list are the only structured content in
// it worth pinning down against silent copy edits.
test.describe('About Me', () => {
  test('Test_Case_5000_AboutMe_Section_LoadsWithHeadingAndQuote', { tag: '@smoke' }, async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await test.step('Then the About Me heading and core quote are visible', async () => {
      await expect.soft(page.getByRole('heading', { name: 'About Me', level: 2 })).toBeVisible();
      await expect.soft(home.aboutQuote).toHaveText('Quality isn’t something we test in. It’s something we build in.');
    });
  });

  test('Test_Case_5001_AboutMe_HabitsList_HasAllSevenHabitsInOrder', { tag: '@regression' }, async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await test.step('Then the 7 Habits list is present, in order, unabridged', async () => {
      const expectedHabits = [
        'Be Proactive',
        'Begin with the End in Mind',
        'Put First Things First',
        'Think Win-Win',
        'Seek First to Understand, Then to Be Understood',
        'Synergize',
        'Sharpen the Saw',
      ];
      await expect.soft(home.habitsList).toHaveCount(expectedHabits.length);
      await expect.soft(home.habitsList).toHaveText(expectedHabits);
    });
  });
});
