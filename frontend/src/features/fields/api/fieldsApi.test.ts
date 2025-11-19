import { httpClient } from '../../../shared/api';

import { listFields } from './fieldsApi';

jest.mock('../../../shared/api', () => {
  // Preserve non-http exports (e.g. types, normalizeApiError) but stub httpClient.
  const actual = jest.requireActual('../../../shared/api');
  return {
    ...actual,
    httpClient: {
      get: jest.fn(),
    },
  };
});

const mockedHttpClient = httpClient as unknown as {
  get: jest.Mock;
};

describe('fieldsApi.listFields', () => {
  it('calls /fields with mapped query params and returns typed response', async () => {
    const backendResponse = {
      success: true,
      data: [
        {
          field_id: 'field-1',
          user_id: 'user-1',
          name: 'Test Field',
          boundary: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [80, 7],
                [80.1, 7],
                [80.1, 7.1],
                [80, 7.1],
                [80, 7],
              ],
            ],
          },
          area_sqm: 10_000,
          center: {
            type: 'Point' as const,
            coordinates: [80.05, 7.05],
          },
          status: 'active',
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-02T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 2,
        page_size: 50,
        total: 1,
      },
      meta: {
        foo: 'bar',
      },
    };

    mockedHttpClient.get.mockResolvedValue({ data: backendResponse });

    const result = await listFields({
      page: 2,
      pageSize: 50,
      search: 'test',
      sort: 'created_at',
      order: 'desc',
    });

    expect(mockedHttpClient.get).toHaveBeenCalledWith('/fields', {
      params: {
        page: 2,
        page_size: 50,
        search: 'test',
        sort: 'created_at',
        order: 'desc',
      },
    });

    expect(result).toEqual({
      data: [
        {
          id: 'field-1',
          name: 'Test Field',
          areaHa: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
          status: 'active',
          centroidLatLon: {
            lat: 7.05,
            lon: 80.05,
          },
        },
      ],
      pagination: {
        page: 2,
        pageSize: 50,
        total: 1,
      },
      meta: {
        foo: 'bar',
      },
    });
  });
});