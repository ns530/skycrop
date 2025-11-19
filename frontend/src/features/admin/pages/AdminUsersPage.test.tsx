import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import type { PaginatedResponse } from '../../../shared/api';
import { ToastProvider } from '../../../shared/ui/Toast';
import type { AdminUserSummary } from '../api/adminApi';

import { AdminUsersPage } from './AdminUsersPage';

// ---- Mocks ----

jest.mock('../hooks/useAdmin', () => {
  return {
    useAdminUsers: jest.fn(),
    useUpdateUserStatus: jest.fn(),
  };
});

const { useAdminUsers, useUpdateUserStatus } = jest.requireMock('../hooks/useAdmin') as {
  useAdminUsers: jest.Mock;
  useUpdateUserStatus: jest.Mock;
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper = (initialEntries: string[] = ['/admin/users']): React.FC<{ children: React.ReactNode }> => {
  const queryClient = createTestQueryClient();

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );

  return Wrapper;
};

describe('AdminUsersPage', () => {
  const mutateAsyncMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    const users: AdminUserSummary[] = [
      {
        id: 'user-active',
        name: 'Active User',
        email: 'active@example.com',
        role: 'farmer',
        status: 'active',
        lastActiveAt: '2025-01-01T10:00:00.000Z',
      },
      {
        id: 'user-disabled',
        name: 'Disabled User',
        email: 'disabled@example.com',
        role: 'farmer',
        status: 'disabled',
        lastActiveAt: undefined,
      },
    ];

    const apiResponse: PaginatedResponse<AdminUserSummary> = {
      data: users,
      pagination: {
        page: 1,
        pageSize: 50,
        total: users.length,
      },
      meta: {
        source: 'test',
      },
    };

    useAdminUsers.mockReturnValue({
      data: apiResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mutateAsyncMock.mockResolvedValue(users[0]);

    useUpdateUserStatus.mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isLoading: false,
    });
  });

  it('renders users and triggers status change mutation after confirmation', () => {
    const wrapper = createWrapper();

    render(<AdminUsersPage />, { wrapper });

    // Heading
    expect(
      screen.getByRole('heading', { name: /user management/i }),
    ).toBeInTheDocument();

    // User rows
    expect(screen.getByText('Active User')).toBeInTheDocument();
    expect(screen.getByText('Disabled User')).toBeInTheDocument();

    // Click "Disable" on the active user row
    const disableButton = screen.getByRole('button', { name: /disable/i });
    fireEvent.click(disableButton);

    // Confirmation modal opens
    expect(
      screen.getByRole('heading', { name: /change user status/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/active@example.com/i)).toBeInTheDocument();

    // Confirm the change
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    expect(mutateAsyncMock).toHaveBeenCalledWith({
      id: 'user-active',
      status: 'disabled',
    });
  });
});