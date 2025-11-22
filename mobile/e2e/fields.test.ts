import { device, element, by, expect as detoxExpect } from 'detox';

describe('Fields Management', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    // Login before each test
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should display fields list', async () => {
    await detoxExpect(element(by.id('fields-list'))).toBeVisible();
    await detoxExpect(element(by.id('field-item').withAncestor(by.id('fields-list')))).toExist();
  });

  it('should navigate to field details', async () => {
    await element(by.id('field-item')).atIndex(0).tap();
    await detoxExpect(element(by.id('field-detail-screen'))).toBeVisible();
    await detoxExpect(element(by.id('field-name'))).toBeVisible();
    await detoxExpect(element(by.id('field-health-score'))).toBeVisible();
  });

  it('should display field health visualization', async () => {
    await element(by.id('field-item')).atIndex(0).tap();
    await detoxExpect(element(by.id('health-chart'))).toBeVisible();
    await detoxExpect(element(by.id('health-status-badge'))).toBeVisible();
  });

  it('should navigate to add new field screen', async () => {
    await element(by.id('add-field-button')).tap();
    await detoxExpect(element(by.id('add-field-screen'))).toBeVisible();
    await detoxExpect(element(by.id('field-name-input'))).toBeVisible();
  });

  it('should create a new field', async () => {
    await element(by.id('add-field-button')).tap();

    await element(by.id('field-name-input')).typeText('Test Field');
    await element(by.id('crop-type-select')).tap();
    await element(by.text('Paddy')).tap();
    await element(by.id('area-input')).typeText('2.5');
    await element(by.id('save-field-button')).tap();

    // Should navigate back to field list
    await waitFor(element(by.id('fields-list'))).toBeVisible().withTimeout(5000);

    // New field should appear
    await detoxExpect(element(by.text('Test Field'))).toBeVisible();
  });

  it('should search fields', async () => {
    await element(by.id('search-input')).typeText('Test Field');
    await waitFor(element(by.text('Test Field'))).toBeVisible().withTimeout(2000);
  });

  it('should filter fields by crop type', async () => {
    await element(by.id('filter-button')).tap();
    await element(by.id('crop-type-filter')).tap();
    await element(by.text('Paddy')).tap();
    await element(by.id('apply-filters-button')).tap();

    // Only paddy fields should be visible
    await detoxExpect(element(by.id('field-item'))).toBeVisible();
  });

  it('should refresh fields list', async () => {
    await element(by.id('fields-list')).swipe('down', 'fast', 0.8);
    await waitFor(element(by.id('loading-indicator')))
      .toBeVisible()
      .withTimeout(1000);
    await waitFor(element(by.id('loading-indicator')))
      .not.toBeVisible()
      .withTimeout(5000);
  });
});

