/**
 * Unit Tests for FieldCard Component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FieldCard } from '../../src/components/FieldCard';

describe('FieldCard Component', () => {
  const mockField = {
    field_id: '1',
    name: 'Test Field',
    area_ha: 5.5,
    health_score: 85,
    health_status: 'good' as const,
    last_health_update: '2024-01-15T10:30:00Z',
    center: { type: 'Point' as const, coordinates: [74.3587, 31.5204] },
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render field information correctly', () => {
    const { getByText } = render(<FieldCard field={mockField} onPress={mockOnPress} />);

    expect(getByText('Test Field')).toBeTruthy();
    expect(getByText(/5\.50.*ha/)).toBeTruthy(); // Flexible matching for "5.50 ha"
    expect(getByText('good')).toBeTruthy();
    expect(getByText(/85/)).toBeTruthy(); // Match "Score: 85/100"
  });

  it('should call onPress when tapped', () => {
    const { getByText } = render(<FieldCard field={mockField} onPress={mockOnPress} />);

    const card = getByText('Test Field').parent?.parent?.parent;
    if (card) {
      fireEvent.press(card);
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    }
  });

  it('should display excellent health status', () => {
    const excellentField = { ...mockField, health_status: 'excellent' as const, health_score: 95 };
    const { getByText } = render(<FieldCard field={excellentField} onPress={mockOnPress} />);

    expect(getByText('excellent')).toBeTruthy();
    expect(getByText(/95/)).toBeTruthy();
  });

  it('should display poor health status', () => {
    const poorField = { ...mockField, health_status: 'poor' as const, health_score: 45 };
    const { getByText } = render(<FieldCard field={poorField} onPress={mockOnPress} />);

    expect(getByText('poor')).toBeTruthy();
    expect(getByText(/45/)).toBeTruthy();
  });

  it('should display field without health data', () => {
    const fieldWithoutHealth = {
      ...mockField,
      health_score: undefined,
      health_status: undefined,
    };
    const { getByText } = render(<FieldCard field={fieldWithoutHealth} onPress={mockOnPress} />);

    expect(getByText('Test Field')).toBeTruthy();
    expect(getByText(/5\.50.*ha/)).toBeTruthy();
  });

  it('should format date correctly', () => {
    const { getByText } = render(<FieldCard field={mockField} onPress={mockOnPress} />);

    // Should display formatted date
    expect(getByText(/1\/15\/2024/)).toBeTruthy();
  });

  it('should display field information', () => {
    const fieldWithoutDate = {
      ...mockField,
      last_health_update: undefined,
    };
    const { getByText } = render(<FieldCard field={fieldWithoutDate} onPress={mockOnPress} />);

    expect(getByText('Test Field')).toBeTruthy();
  });
});

