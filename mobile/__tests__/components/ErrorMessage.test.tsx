/**
 * Unit Tests for ErrorMessage Component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorMessage } from '../../src/components/ErrorMessage';

describe('ErrorMessage Component', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render error message', () => {
    const { getByText } = render(
      <ErrorMessage message="Failed to load data" onRetry={mockOnRetry} />
    );
    
    expect(getByText('Failed to load data')).toBeTruthy();
  });

  it('should render default error message when not provided', () => {
    const { getByText } = render(<ErrorMessage onRetry={mockOnRetry} />);
    
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('should render retry button when onRetry is provided', () => {
    const { getByText } = render(
      <ErrorMessage message="Network error" onRetry={mockOnRetry} />
    );
    
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should call onRetry when retry button is pressed', () => {
    const { getByText } = render(
      <ErrorMessage message="Network error" onRetry={mockOnRetry} />
    );
    
    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render retry button when onRetry is not provided', () => {
    const { queryByText } = render(<ErrorMessage message="Network error" />);
    
    expect(queryByText('Try Again')).toBeFalsy();
  });

  it('should display error message and retry button', () => {
    const { getByText } = render(
      <ErrorMessage message="Network error" onRetry={mockOnRetry} />
    );
    
    // Error message is displayed
    expect(getByText('Network error')).toBeTruthy();
    // Retry button is displayed
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should render error message', () => {
    const { getByText } = render(
      <ErrorMessage
        message="Custom error"
        onRetry={mockOnRetry}
      />
    );
    
    expect(getByText('Custom error')).toBeTruthy();
  });
});

