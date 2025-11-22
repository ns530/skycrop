import { device, element, by, expect as detoxExpect } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display login screen on first launch', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await detoxExpect(element(by.id('email-input'))).toBeVisible();
    await detoxExpect(element(by.id('password-input'))).toBeVisible();
    await detoxExpect(element(by.id('login-button'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('invalid@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();

    await detoxExpect(element(by.text('Invalid email or password'))).toBeVisible();
  });

  it('should login successfully with valid credentials', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    // Wait for home screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should navigate to signup screen', async () => {
    await element(by.id('signup-link')).tap();
    await detoxExpect(element(by.id('signup-screen'))).toBeVisible();
  });

  it('should create new account', async () => {
    await element(by.id('signup-link')).tap();

    await element(by.id('signup-name-input')).typeText('Test User');
    await element(by.id('signup-email-input')).typeText(`test-${Date.now()}@example.com`);
    await element(by.id('signup-password-input')).typeText('password123');
    await element(by.id('signup-confirm-password-input')).typeText('password123');
    await element(by.id('signup-button')).tap();

    // Wait for verification or home screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should logout successfully', async () => {
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Navigate to profile
    await element(by.id('profile-tab')).tap();
    await element(by.id('logout-button')).tap();

    // Confirm logout
    await element(by.text('Logout')).tap();

    // Should return to login
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
  });
});

