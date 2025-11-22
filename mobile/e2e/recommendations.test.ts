import { device, element, by, expect as detoxExpect } from 'detox';

describe('Recommendations Management', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    // Login and navigate to recommendations
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Navigate to field with recommendations
    await element(by.id('field-item')).atIndex(0).tap();
    await element(by.id('recommendations-tab')).tap();
  });

  it('should display recommendations list', async () => {
    await detoxExpect(element(by.id('recommendations-list'))).toBeVisible();
  });

  it('should generate new recommendations', async () => {
    await element(by.id('generate-recommendations-button')).tap();

    await waitFor(element(by.text('Generating recommendations...')))
      .toBeVisible()
      .withTimeout(2000);

    await waitFor(element(by.id('recommendation-item')))
      .toBeVisible()
      .withTimeout(10000);

    await detoxExpect(element(by.id('recommendation-item'))).toBeVisible();
  });

  it('should display recommendation details', async () => {
    await element(by.id('recommendation-item')).atIndex(0).tap();

    await detoxExpect(element(by.id('recommendation-detail-screen'))).toBeVisible();
    await detoxExpect(element(by.id('recommendation-title'))).toBeVisible();
    await detoxExpect(element(by.id('recommendation-description'))).toBeVisible();
    await detoxExpect(element(by.id('recommendation-priority'))).toBeVisible();
  });

  it('should update recommendation status', async () => {
    await element(by.id('recommendation-item')).atIndex(0).tap();

    await element(by.id('status-select')).tap();
    await element(by.text('Completed')).tap();
    await element(by.id('save-status-button')).tap();

    await detoxExpect(element(by.text('Status updated'))).toBeVisible();
  });

  it('should filter recommendations by priority', async () => {
    await element(by.id('filter-button')).tap();
    await element(by.id('priority-filter')).tap();
    await element(by.text('Critical')).tap();
    await element(by.id('apply-filters-button')).tap();

    // Should show only critical recommendations
    await detoxExpect(element(by.id('recommendation-item'))).toBeVisible();
  });

  it('should filter recommendations by type', async () => {
    await element(by.id('filter-button')).tap();
    await element(by.id('type-filter')).tap();
    await element(by.text('Irrigation')).tap();
    await element(by.id('apply-filters-button')).tap();

    // Should show only irrigation recommendations
    await detoxExpect(element(by.id('recommendation-item'))).toBeVisible();
  });

  it('should share recommendation', async () => {
    await element(by.id('recommendation-item')).atIndex(0).tap();
    await element(by.id('share-button')).tap();

    // Share dialog should appear (platform-specific)
    await waitFor(element(by.text('Share'))).toBeVisible().withTimeout(2000);
  });

  it('should refresh recommendations', async () => {
    await element(by.id('recommendations-list')).swipe('down', 'fast', 0.8);
    await waitFor(element(by.id('loading-indicator')))
      .toBeVisible()
      .withTimeout(1000);
    await waitFor(element(by.id('loading-indicator')))
      .not.toBeVisible()
      .withTimeout(5000);
  });
});

