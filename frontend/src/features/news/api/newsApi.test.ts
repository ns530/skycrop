/**
 * Tests for News API
 */

import { httpClient } from "../../../shared/api";

import {
  getNewsList,
  getNewsArticle,
  searchNews,
  getNewsByCategory,
} from "./newsApi";

// Mock httpClient
jest.mock("../../../shared/api", () => ({
  httpClient: {
    get: jest.fn(),
  },
  normalizeApiError: jest.fn((error) => error),
}));

describe("newsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getNewsList", () => {
    it("should fetch list of published articles", async () => {
      const mockData = {
        success: true,
        data: [
          {
            id: "article-1",
            title: "Farming Tips",
            summary: "Learn about modern farming",
            body: "Full content here...",
            category: "farming-tips",
            published_at: "2025-01-01T00:00:00Z",
            status: "published",
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getNewsList();

      expect(httpClient.get).toHaveBeenCalledWith("/admin/content", {
        params: expect.objectContaining({
          status: "published",
        }),
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe("Farming Tips");
      expect(result.data[0].category).toBe("farming-tips");
    });

    it("should apply filters and pagination", async () => {
      const mockData = {
        success: true,
        data: [],
        pagination: {
          page: 2,
          pageSize: 20,
          total: 0,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      await getNewsList({
        page: 2,
        pageSize: 20,
        category: "weather",
        search: "rainfall",
      });

      expect(httpClient.get).toHaveBeenCalledWith("/admin/content", {
        params: expect.objectContaining({
          page: 2,
          pageSize: 20,
          category: "weather",
          search: "rainfall",
          status: "published",
        }),
      });
    });
  });

  describe("getNewsArticle", () => {
    it("should fetch single article by ID", async () => {
      const mockData = {
        success: true,
        data: {
          id: "article-1",
          title: "Test Article",
          summary: "Test summary",
          body: "Test body",
          category: "general",
          published_at: "2025-01-01T00:00:00Z",
          status: "published",
          view_count: 100,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getNewsArticle("article-1");

      expect(httpClient.get).toHaveBeenCalledWith("/admin/content/article-1");
      expect(result.id).toBe("article-1");
      expect(result.title).toBe("Test Article");
      expect(result.viewCount).toBe(100);
    });
  });

  describe("searchNews", () => {
    it("should search articles by query", async () => {
      const mockData = {
        success: true,
        data: [
          {
            id: "article-1",
            title: "Weather Alert",
            summary: "Heavy rainfall expected",
            body: "Full content...",
            category: "weather",
            published_at: "2025-01-01T00:00:00Z",
            status: "published",
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await searchNews("rainfall");

      expect(httpClient.get).toHaveBeenCalledWith("/admin/content", {
        params: expect.objectContaining({
          search: "rainfall",
          status: "published",
        }),
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getNewsByCategory", () => {
    it("should filter articles by category", async () => {
      const mockData = {
        success: true,
        data: [
          {
            id: "article-1",
            title: "Market Update",
            summary: "Latest prices",
            body: "Full content...",
            category: "market-prices",
            published_at: "2025-01-01T00:00:00Z",
            status: "published",
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getNewsByCategory("market-prices");

      expect(httpClient.get).toHaveBeenCalledWith("/admin/content", {
        params: expect.objectContaining({
          category: "market-prices",
          status: "published",
        }),
      });
      expect(result.data[0].category).toBe("market-prices");
    });
  });
});
