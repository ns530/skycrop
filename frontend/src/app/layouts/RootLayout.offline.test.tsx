import { render, screen } from '@testing-library/react';
import React from 'react';

import { AppProviders } from '../providers/AppProviders';

import { RootLayout } from './RootLayout';

// Mock react-router-dom pieces used by RootLayout so we don't need a real Router.
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    NavLink: ({ children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a {...rest}>{children}</a>
    ),
    Outlet: () => <div data-testid="outlet" />,
  };
});

// Mock online status hook so we can force the offline state.
jest.mock('../../shared/hooks/useOnlineStatus', () => {
  return {
    useOnlineStatus: () => ({ isOnline: false }),
  };
});

describe('RootLayout offline banner', () => {
  it('shows an accessible offline banner when offline', () => {
    render(
      <AppProviders>
        <RootLayout />
      </AppProviders>,
    );

    const bannerText = /you're offline\. data may be outdated\. changes will sync when you're back online\./i;

    const banner = screen.getByText(bannerText);

    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute('role', 'status');
  });
});