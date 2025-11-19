import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import { RequireAuth } from './RequireAuth';

jest.mock('../context/AuthContext', () => {
  return {
    useAuth: jest.fn(),
  };
});

const { useAuth } = jest.requireMock('../context/AuthContext') as {
  useAuth: jest.Mock;
};

const LoginCapture: React.FC = () => {
  const location = useLocation() as { state?: { from?: string } };
  const from = location.state?.from ?? '';

  return (
    <div>
      <h1>Login page</h1>
      {from && (
        <p data-testid="login-from-state">
          {from}
        </p>
      )}
    </div>
  );
};

describe('RequireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects unauthenticated users to /auth/login and preserves original location in state.from', () => {
    useAuth.mockReturnValue({
      status: 'unauthenticated',
    });

    render(
      <MemoryRouter initialEntries={['/protected?foo=1#hash']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <div>Protected content</div>
              </RequireAuth>
            }
          />
          <Route path="/auth/login" element={<LoginCapture />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /login page/i }),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/protected content/i),
    ).not.toBeInTheDocument();

    expect(
      screen.getByTestId('login-from-state'),
    ).toHaveTextContent('/protected?foo=1#hash');
  });

  it('renders children when user is authenticated', () => {
    useAuth.mockReturnValue({
      status: 'authenticated',
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <div>Protected content</div>
              </RequireAuth>
            }
          />
          <Route path="/auth/login" element={<LoginCapture />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/protected content/i),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('heading', { name: /login page/i }),
    ).not.toBeInTheDocument();
  });

  it('shows a loading fallback when auth status is loading', () => {
    useAuth.mockReturnValue({
      status: 'loading',
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <div>Protected content</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/checking your session/i),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/protected content/i),
    ).not.toBeInTheDocument();
  });
});