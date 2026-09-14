import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class JobsPage extends BasePage {
  static readonly url = '/jobs.html';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(JobsPage.url);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'QA Jobs' });
  }

  get updatedLabel(): Locator {
    return this.page.getByTestId('jobs-updated');
  }

  get jobsList(): Locator {
    return this.page.getByTestId('jobs-list');
  }

  /** Rendered by src/jobs.js only when public/data/jobs.json has zero entries
   *  for this build, or the fetch itself fails — see its two call sites. */
  get emptyState(): Locator {
    return this.page.getByTestId('jobs-empty');
  }

  /** A rendered job card — src/jobs.js keys it off `${company}-${title}`,
   *  slugified, since job listings have no stable id of their own. */
  jobCard(slug: string): Locator {
    return this.page.getByTestId(`job-card-${slug}`);
  }

  get searchInput(): Locator {
    return this.page.getByTestId('jobs-search');
  }

  get workTypeFilter(): Locator {
    return this.page.getByTestId('jobs-filter-worktype');
  }

  /** Defaults to "United States" — see README.md#job-listings on why country
   *  is a best-effort classification of free-text location strings, not
   *  sourced data. */
  get countryFilter(): Locator {
    return this.page.getByTestId('jobs-filter-country');
  }

  /** The pill-button quick links under the hero intro — attribution links
   *  required by Remote OK's API terms and Arbeitnow's own listing pages
   *  (actual imported-listing sources), plus LinkedIn/Indeed (excluded here
   *  via .board-link-search — see searchEngineLink() below). */
  get sourceLinks(): Locator {
    return this.page.getByTestId('jobs-board-links').locator('a:not(.board-link-search)');
  }

  /** LinkedIn/Indeed have no free jobs API, so these are plain outbound
   *  search links, not imported listings — see README.md#job-listings. */
  searchEngineLink(engine: 'LinkedIn' | 'Indeed'): Locator {
    return this.page.getByRole('link', { name: engine });
  }
}
