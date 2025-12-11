/**
 * useNews Hooks
 * React Query hooks for news/knowledge hub
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError, PaginatedResponse } from '../../../shared/api';
import { getNewsList, getNewsArticle, searchNews, getNewsByCategory, trackArticleView, type NewsArticle, type NewsListParams, type NewsCategory } from '../api/newsApi';

/**
 * Query keys for news data
 */
export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (params?: NewsListParams) => [...newsKeys.lists(), params] as const,
  details: () => [...newsKeys.all, 'detail'] as const,
  detail: (id: string) => [...newsKeys.details(), id] as const,
  search: (query: string, params?: NewsListParams) => [...newsKeys.all, 'search', query, params] as const,
  category: (category: NewsCategory, params?: NewsListParams) => [...newsKeys.all, 'category', category, params] as const,
};

/**
 * useNewsList
 * 
 * Fetch paginated list of news articles
 * 
 * @param params - List parameters (page, pageSize, sort)
 * @returns Query result with news articles
 */
export const useNewsList = (params?: NewsListParams) => {
  return useQuery<PaginatedResponse<NewsArticle>, ApiError>({
    queryKey: newsKeys.list(params),
    queryFn: () => getNewsList(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * useNewsArticle
 * 
 * Fetch single news article by ID
 * Tracks view count on success
 * 
 * @param id - Article ID
 * @returns Query result with article details
 */
export const useNewsArticle = (id: string) => {
  const queryClient = useQueryClient();

  return useQuery<NewsArticle, ApiError>({
    queryKey: newsKeys.detail(id),
    queryFn: async () => {
      const article = await getNewsArticle(id);
      
      // Track view in background
      trackArticleView(id).catch(() => {
        // Silent fail
      });
      
      return article;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * useNewsSearch
 * 
 * Search news articles by query
 * 
 * @param query - Search query
 * @param params - List parameters
 * @returns Query result with search results
 */
export const useNewsSearch = (query: string, params?: NewsListParams) => {
  return useQuery<PaginatedResponse<NewsArticle>, ApiError>({
    queryKey: newsKeys.search(query, params),
    queryFn: () => searchNews(query, params),
    enabled: !!query && query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * useNewsByCategory
 * 
 * Get news articles filtered by category
 * 
 * @param category - News category
 * @param params - List parameters
 * @returns Query result with filtered articles
 */
export const useNewsByCategory = (category: NewsCategory, params?: NewsListParams) => {
  return useQuery<PaginatedResponse<NewsArticle>, ApiError>({
    queryKey: newsKeys.category(category, params),
    queryFn: () => getNewsByCategory(category, params),
    enabled: !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * usePrefetchNewsArticle
 * 
 * Prefetch article for faster navigation
 * 
 * @param id - Article ID to prefetch
 */
export const usePrefetchNewsArticle = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    void queryClient.prefetchQuery({
      queryKey: newsKeys.detail(id),
      queryFn: () => getNewsArticle(id),
      staleTime: 10 * 60 * 1000,
    });
  };
};

