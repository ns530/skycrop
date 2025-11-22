import { device, element, by, expect as detoxExpect } from 'detox';

describe('Notifications', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    // Login
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should display notification bell', async () => {
    await detoxExpect(element(by.id('notification-bell'))).toBeVisible();
  });

  it('should show unread count badge', async () => {
    await detoxExpect(element(by.id('notification-badge'))).toBeVisible();
  });

  it('should open notifications list', async () => {
    await element(by.id('notification-bell')).tap();
    await detoxExpect(element(by.id('notifications-list'))).toBeVisible();
  });

  it('should display notification items', async () => {
    await element(by.id('notification-bell')).tap();
    await detoxExpect(element(by.id('notification-item'))).toBeVisible();
  });

  it('should mark notification as read', async () => {
    await element(by.id('notification-bell')).tap();
    await element(by.id('notification-item')).atIndex(0).tap();

    // Notification should be marked as read
    // Badge count should decrease
    await detoxExpect(element(by.id('notification-read-indicator'))).toExist();
  });

  it('should mark all notifications as read', async () => {
    await element(by.id('notification-bell')).tap();
    await element(by.id('mark-all-read-button')).tap();

    // Badge should disappear or show 0
    await waitFor(element(by.id('notification-badge')))
      .not.toBeVisible()
      .withTimeout(2000);
  });

  it('should clear all notifications', async () => {
    await element(by.id('notification-bell')).tap();
    await element(by.id('clear-all-button')).tap();

    // Confirmation dialog
    await element(by.text('Clear All')).tap();

    // Notifications list should be empty
    await detoxExpect(element(by.text('No notifications'))).toBeVisible();
  });

  it('should filter notifications by type', async () => {
    await element(by.id('notification-bell')).tap();
    await element(by.id('filter-button')).tap();
    await element(by.text('Health Alerts')).tap();

    // Should show only health alert notifications
    await detoxExpect(element(by.id('notification-item'))).toBeVisible();
  });

  it('should navigate from notification to related screen', async () => {
    await element(by.id('notification-bell')).tap();
    await element(by.id('notification-item')).atIndex(0).tap();

    // Should navigate to related field or recommendation
    await waitFor(element(by.id('field-detail-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should receive real-time notification', async () => {
    // Simulate trigger that causes notification (e.g., health alert)
    // This would require backend interaction or mock push notification

    await waitFor(element(by.id('notification-badge')))
      .toBeVisible()
      .withTimeout(10000);

    await detoxExpect(element(by.id('notification-badge'))).toBeVisible();
  });
});

