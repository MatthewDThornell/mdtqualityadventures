import { type Page, type Locator } from '@playwright/test';

export type NavSection =
  | 'experience'
  | 'accomplishments'
  | 'qa-standards'
  | 'tau'
  | 'recommendations'
  | 'about-me'
  | 'mentors'
  | 'mentees'
  | 'adventures'
  | 'contact';

/**
 * Shared by every page object below. The header/nav markup is duplicated
 * byte-for-byte across index.html, qa-standards.html, and
 * test-automation-university.html (see the nav-sync comment at the top of
 * each file's <nav>) rather than shared via a template, so its
 * data-testid values are identical on all three pages too — see
 * README.md#automation-ids in the site repo for the convention.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  get skipLink(): Locator {
    return this.page.getByTestId('skip-link');
  }

  /** Has its own stable id (`#main-content`) predating the data-testid rollout — no testid needed. */
  get mainContent(): Locator {
    return this.page.locator('#main-content');
  }

  get navBrand(): Locator {
    return this.page.getByTestId('nav-brand');
  }

  get navToggle(): Locator {
    return this.page.getByTestId('nav-toggle');
  }

  navLink(section: NavSection): Locator {
    return this.page.getByTestId(`nav-link-${section}`);
  }

  /** Opens the mobile nav via the hamburger toggle (hidden at desktop widths). */
  async openMobileNav(): Promise<void> {
    await this.navToggle.click();
  }
}
