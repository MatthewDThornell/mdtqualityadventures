import { type Page, type Locator } from '@playwright/test';

export type NavSection =
  | 'experience'
  | 'accomplishments'
  | 'qa-standards'
  | 'tau'
  | 'jobs'
  | 'recommendations'
  | 'about-me'
  | 'mentors'
  | 'mentees'
  | 'adventures'
  | 'test-pilot'
  | 'contact';

/** The nav's three journal-style groups; every NavSection except 'contact' lives inside one. */
export type NavGroup = 'professional' | 'person' | 'people';

export const NAV_GROUP_OF: Record<Exclude<NavSection, 'contact'>, NavGroup> = {
  experience: 'professional',
  accomplishments: 'professional',
  'qa-standards': 'professional',
  tau: 'professional',
  jobs: 'professional',
  'about-me': 'person',
  adventures: 'person',
  'test-pilot': 'person',
  mentors: 'people',
  mentees: 'people',
  recommendations: 'people',
};

/**
 * Shared by every page object below. The header/nav markup is duplicated
 * byte-for-byte across index.html, qa-standards.html,
 * test-automation-university.html, and jobs.html (see the nav-sync comment
 * at the top of each file's <nav>) rather than shared via a template, so
 * its data-testid values are identical on all four pages too — see
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

  navGroupToggle(group: NavGroup): Locator {
    return this.page.getByTestId(`nav-${group}-toggle`);
  }

  navGroupMenu(group: NavGroup): Locator {
    return this.navGroupToggle(group).locator('xpath=..').locator('.nav-dropdown-menu');
  }

  /** Opens one of the nav's group dropdowns — every link but Contact is hidden
   * inside one until its group is opened. At desktop widths opening a group
   * closes whichever other group was open. */
  async openNavGroup(group: NavGroup): Promise<void> {
    await this.navGroupToggle(group).click();
  }

  /** Opens the group a section lives in, then returns that section's link,
   * ready to click — the common "navigate via the header" step. */
  async revealNavLink(section: Exclude<NavSection, 'contact'>): Promise<Locator> {
    await this.openNavGroup(NAV_GROUP_OF[section]);
    return this.navLink(section);
  }
}
