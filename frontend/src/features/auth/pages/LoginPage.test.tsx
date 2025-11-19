import { render, screen } from '@testing-library/react';
import React from 'react';

import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders heading and core form fields', () => {
    render(<LoginPage />);

    // Heading
    expect(
      screen.getByRole('heading', { name: /sign in/i })
    ).toBeInTheDocument();

    // Email input
    expect(
      screen.getByLabelText(/email/i)
    ).toBeInTheDocument();

    // Password input
    expect(
      screen.getByLabelText(/password/i)
    ).toBeInTheDocument();

    // Submit button
    expect(
      screen.getByRole('button', { name: /continue/i })
    ).toBeInTheDocument();
  });
});