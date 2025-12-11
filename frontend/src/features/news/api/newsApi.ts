/**
 * News/Knowledge Hub API
 * Public-facing API for browsing published content
 */

import {
  httpClient,
  normalizeApiError,
  type PaginatedResponse,
  type ListParams,
} from "../../../shared/api";

export type NewsCategory =
  | "farming-tips"
  | "weather"
  | "market-prices"
  | "government-schemes"
  | "general";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  body: string;
  category?: NewsCategory;
  imageUrl?: string;
  author?: string;
  publishedAt: string;
  viewCount?: number;
  tags?: string[];
}

export interface NewsListParams extends ListParams {
  category?: NewsCategory;
  search?: string;
  tags?: string[];
}

// --------------------
// Backend types (internal)
// --------------------

interface BackendNewsArticle {
  id: string;
  title: string;
  summary: string;
  body: string;
  category?: string;
  image_url?: string;
  author?: string;
  published_at: string;
  view_count?: number;
  tags?: string[];
  status: string;
}

interface BackendNewsListEnvelope {
  success: boolean;
  data: BackendNewsArticle[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  meta?: Record<string, unknown>;
}

interface BackendNewsSingleEnvelope {
  success: boolean;
  data: BackendNewsArticle;
  meta?: Record<string, unknown>;
}

// --------------------
// Mappers
// --------------------

const mapBackendArticle = (item: BackendNewsArticle): NewsArticle => ({
  id: item.id,
  title: item.title,
  summary: item.summary,
  body: item.body,
  category: item.category as NewsCategory,
  imageUrl: item.image_url,
  author: item.author,
  publishedAt: item.published_at,
  viewCount: item.view_count,
  tags: item.tags,
});

const mapListParamsToQuery = (
  params?: NewsListParams,
): Record<string, unknown> => {
  if (!params) return {};

  return {
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    order: params.order,
    category: params.category,
    search: params.search,
    tags: params.tags?.join(","),
  };
};

// --------------------
// Public API functions
// --------------------

/**
 * Get list of published news articles
 *
 * GET /api/v1/news
 *
 * Note: Currently uses admin content API as fallback
 * Will be replaced with dedicated news endpoint
 */
export const getNewsList = async (
  params?: NewsListParams,
): Promise<PaginatedResponse<NewsArticle>> => {
  try {
    // For now, use admin content API but filter for published only
    // In production, this would be /api/v1/news
    const res = await httpClient.get<BackendNewsListEnvelope>(
      "/admin/content",
      {
        params: {
          ...mapListParamsToQuery(params),
          status: "published", // Only published articles
        },
      },
    );

    const { data, pagination, meta } = res.data;

    return {
      data: data.map(mapBackendArticle),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
      },
      meta,
    };
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Get single news article by ID
 *
 * GET /api/v1/news/:id
 */
export const getNewsArticle = async (id: string): Promise<NewsArticle> => {
  try {
    // For now, use admin content API
    // In production, this would be /api/v1/news/:id
    const res = await httpClient.get<BackendNewsSingleEnvelope>(
      `/admin/content/${id}`,
    );
    return mapBackendArticle(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Search news articles
 *
 * GET /api/v1/news/search?q={query}
 */
export const searchNews = async (
  query: string,
  params?: ListParams,
): Promise<PaginatedResponse<NewsArticle>> => {
  try {
    return getNewsList({
      ...params,
      search: query,
    });
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Get news articles by category
 */
export const getNewsByCategory = async (
  category: NewsCategory,
  params?: ListParams,
): Promise<PaginatedResponse<NewsArticle>> => {
  try {
    return getNewsList({
      ...params,
      category,
    });
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Increment view count for an article
 * (Track engagement)
 */
export const trackArticleView = async (id: string): Promise<void> => {
  try {
    // In production, this would track views
    // For now, it's a no-op
    console.log(`Tracking view for article: ${id}`);
  } catch (error) {
    // Silent fail - analytics shouldn't break user experience
    console.warn("Failed to track article view:", error);
  }
};
