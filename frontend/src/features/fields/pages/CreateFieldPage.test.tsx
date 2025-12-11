import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { CreateFieldPage } from './CreateFieldPage';

const mockedNavigate = jest.fn();
const createFieldMock = jest.fn();
const setCurrentFieldMock = jest.fn();
const showToastMock = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

jest.mock('../../../shared/context/UiContext', () => {
  return {
    useUiState: () => ({
      setCurrentField: setCurrentFieldMock,
    }),
  };
});

jest.mock('../../../shared/hooks/useToast', () => {
  return {
    useToast: () => ({
      showToast: showToastMock,
    }),
  };
});

jest.mock('../hooks/useFields', () => {
  const actual = jest.requireActual('../hooks/useFields');
  return {
    ...actual,
    useCreateField: jest.fn(),
  };
});

const { useCreateField } = jest.requireMock('../hooks/useFields') as {
  useCreateField: jest.Mock;
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper =
  (initialEntries: string[] = ['/fields/create']): React.FC<{ children: React.ReactNode }> =>
  ({ children }) => {
    const queryClient = createTestQueryClient();

    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/fields/create" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

createWrapper.displayName = 'TestRouterWrapper';

describe('CreateFieldPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    createFieldMock.mockResolvedValue({
      id: 'new-field-id',
      name: 'New field',
    });

    useCreateField.mockReturnValue({
      mutateAsync: createFieldMock,
      isPending: false,
    });
  });

  it('submits field form, creates field with placeholder geometry, updates UiContext, and navigates to detail', async () => {
    const wrapper = createWrapper();

    render(<CreateFieldPage />, { wrapper });

    const nameInput = screen.getByLabelText(/field name/i);
    fireEvent.change(nameInput, { target: { value: 'New field' } });

    const saveButton = screen.getByRole('button', { name: /save field/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(createFieldMock).toHaveBeenCalledTimes(1);
    });

    const payload = createFieldMock.mock.calls[0][0];

    expect(payload).toMatchObject({
      name: 'New field',
      cropType: undefined,
      notes: undefined,
    });

    expect(payload.geometry).toEqual({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [0, 0.0001],
          [0.0001, 0.0001],
          [0.0001, 0],
          [0, 0],
        ],
      ],
    });

    expect(setCurrentFieldMock).toHaveBeenCalledWith('new-field-id');

    expect(mockedNavigate).toHaveBeenCalledWith('/fields/new-field-id');

    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Field created',
      }),
    );
  });
});