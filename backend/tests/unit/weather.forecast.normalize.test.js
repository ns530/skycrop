const axios = require('axios');

// In-memory Redis
const store = new Map();
const fakeRedis = {
  isOpen: true,
  async get(key) {
    return store.has(key) ? store.get(key) : null;
  },
  async setEx(key, ttl, value) {
    store.set(key, value);
    return 'OK';
  },
  async setex(key, ttl, value) {
    return this.setEx(key, ttl, value);
  },
};

jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedis,
  getRedisClient: () => fakeRedis,
}));

const { WeatherService } = require('../../src/services/weather.service');

describe('WeatherService forecast normalization', () => {
  let svc;

  beforeEach(() => {
    jest.clearAllMocks();
    store.clear();
    process.env.OPENWEATHER_API_KEY = 'k';
    jest.spyOn(axios, 'get').mockReset();
    svc = new WeatherService();
  });

  test('normalize from provider daily -> days[] with totals rain_3d_mm and rain_7d_mm', async () => {
    const lat = 7.21;
    const lon = 80.11;

    // Prepare provider-like payload with daily entries
    const now = Math.floor(Date.now() / 1000);
    const daily = [
      { dt: now + 86400 * 0, rain: 1.2, temp: { min: 23.1, max: 31.5 }, wind_speed: 3.2 },
      { dt: now + 86400 * 1, rain: 0.8, temp: { min: 22.5, max: 32.0 }, wind_speed: 2.8 },
      { dt: now + 86400 * 2, rain: 0, temp: { min: 22.0, max: 33.0 }, wind_speed: 2.5 },
      { dt: now + 86400 * 3, rain: 4.4, temp: { min: 21.2, max: 30.0 }, wind_speed: 4.0 },
      { dt: now + 86400 * 4, rain: 3.0, temp: { min: 21.0, max: 29.0 }, wind_speed: 4.5 },
      { dt: now + 86400 * 5, temp: { min: 20.0, max: 28.0 }, wind_speed: 5.0 }, // no rain property -> 0
      { dt: now + 86400 * 6, rain: 0.2, temp: { min: 19.0, max: 27.0 }, wind_speed: 3.0 },
      { dt: now + 86400 * 7, rain: 10.0, temp: { min: 18.0, max: 26.0 }, wind_speed: 2.0 }, // should be sliced out (keep 7 days)
    ];

    axios.get.mockResolvedValueOnce({
      status: 200,
      data: { daily },
    });

    const out = await svc.getForecastByCoords(lat, lon);
    expect(out.meta).toMatchObject({ cache: 'miss', source: 'provider' });
    expect(out.data).toHaveProperty('coord', { lat, lon });
    expect(Array.isArray(out.data.days)).toBe(true);
    expect(out.data.days.length).toBeLessThanOrEqual(7);

    // Validate per-day normalization shape
    const d0 = out.data.days[0];
    expect(d0).toHaveProperty('date'); // YYYY-MM-DD
    expect(d0).toHaveProperty('rain_mm', expect.any(Number));
    expect(d0).toHaveProperty('tmin');
    expect(d0).toHaveProperty('tmax');
    expect(d0).toHaveProperty('wind');

    // Validate totals
    const { totals } = out.data;
    expect(totals).toHaveProperty('rain_3d_mm', expect.any(Number));
    expect(totals).toHaveProperty('rain_7d_mm', expect.any(Number));

    // Manual sums (first 3 days, then first 7 days)
    const rain3 = (daily[0].rain || 0) + (daily[1].rain || 0) + (daily[2].rain || 0);
    const rain7 =
      (daily[0].rain || 0) +
      (daily[1].rain || 0) +
      (daily[2].rain || 0) +
      (daily[3].rain || 0) +
      (daily[4].rain || 0) +
      (daily[5].rain || 0) +
      (daily[6].rain || 0);

    // Allow small rounding differences due to toFixed in implementation
    expect(Math.abs(totals.rain_3d_mm - rain3)).toBeLessThan(0.01);
    expect(Math.abs(totals.rain_7d_mm - rain7)).toBeLessThan(0.01);

    // Second call should be cache hit
    const out2 = await svc.getForecastByCoords(lat, lon);
    expect(out2.meta.cache).toBe('hit');
    expect(out2.data.totals.rain_7d_mm).toBeCloseTo(rain7, 2);
  });
});
