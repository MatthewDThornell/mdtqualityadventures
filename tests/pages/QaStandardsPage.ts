import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class QaStandardsPage extends BasePage {
  static readonly url = '/qa-standards.html';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(QaStandardsPage.url);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'QA Standards' });
  }

  get githubCard(): Locator {
    return this.page.getByTestId('github-card');
  }

  /** One of the labelled code blocks' "Copy" buttons — see README.md#automation-ids
   *  for the full list of standards-copy-btn-* slugs (locator-strategy-avoid/prefer,
   *  no-hard-sleeps-avoid/prefer, soft-assertions, smoke-test-template,
   *  cypress-template, comment-template, xml-doc-comments, jsdoc, bug-report-template). */
  copyButton(blockSlug: string): Locator {
    return this.page.getByTestId(`standards-copy-btn-${blockSlug}`);
  }
}
