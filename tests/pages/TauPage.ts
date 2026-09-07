import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class TauPage extends BasePage {
  static readonly url = '/test-automation-university.html';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(TauPage.url);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Test Automation University' });
  }

  /** A course row, keyed by the course's own testautomationu.applitools.com URL slug
   *  where it has a link, or a hand-written slug where it doesn't. */
  courseRow(courseSlug: string): Locator {
    return this.page.getByTestId(`tau-course-row-${courseSlug}`);
  }

  /** The Watch/Hide toggle for a course row — not every row has one (two
   *  older courses have no attached video). */
  watchButton(courseSlug: string): Locator {
    return this.page.getByTestId(`tau-course-watch-btn-${courseSlug}`);
  }

  /** The YouTube iframe created on click by src/test-automation-university.js,
   *  keyed by the button's data-video-id (not the course slug). */
  videoEmbed(videoId: string): Locator {
    return this.page.getByTestId(`tau-video-embed-${videoId}`);
  }
}
