/**
 * Unit Tests for LoadingSpinner Component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('should render with default message', () => {
    const { getByText } = render(<LoadingSpinner />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should render with custom message', () => {
    const { getByText } = render(<LoadingSpinner message="Fetching fields..." />);
    expect(getByText('Fetching fields...')).toBeTruthy();
  });

  it('should render full variant by default', () => {
    const { getByText, UNSAFE_getByType } = render(<LoadingSpinner />);
    
    expect(getByText('Loading...')).toBeTruthy();
    // Check that ActivityIndicator is rendered
    const indicator = UNSAFE_getByType('ActivityIndicator' as any);
    expect(indicator).toBeTruthy();
  });

  it('should render inline variant when specified', () => {
    const { getByText, UNSAFE_getByType } = render(<LoadingSpinner variant="inline" />);
    
    expect(getByText('Loading...')).toBeTruthy();
    // Check that ActivityIndicator is rendered
    const indicator = UNSAFE_getByType('ActivityIndicator' as any);
    expect(indicator).toBeTruthy();
  });

  it('should render ActivityIndicator', () => {
    const { UNSAFE_getByType } = render(<LoadingSpinner />);
    
    const indicator = UNSAFE_getByType('ActivityIndicator' as any);
    expect(indicator).toBeTruthy();
  });

  it('should not render message when empty', () => {
    const { queryByText } = render(<LoadingSpinner message="" />);
    expect(queryByText('')).toBeFalsy();
  });
});

