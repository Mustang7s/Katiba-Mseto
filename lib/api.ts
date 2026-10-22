/**
 * API utilities for making requests to the backend
 */

import localChaptersData from '@/data/chapters.json';
import billOfRightsData from '@/data/bill-of-rights.json';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const DEBUG_MODE = process.env.NODE_ENV === 'development';


/**
 * Make a request to the backend API
 */
export async function fetchAPI(
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  let accessToken = null;
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('accessToken');
    // Ensure we don't send "undefined" as the token
    if (accessToken === 'undefined' || accessToken === 'null') {
      accessToken = null;
    }
  }
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  };

  const finalOptions = {
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Enhanced logging for debugging
  if (DEBUG_MODE) {
    console.log('--- API Request ---');
    console.log(`Endpoint: ${endpoint}`);
    console.log(`URL: ${url}`);
    console.log('Options:', JSON.stringify(finalOptions, null, 2));
    console.log('-------------------');
  }

  const response = await fetch(url, finalOptions);

  let data;
  try {
    data = await response.json();
  } catch (e) {
    console.error('Failed to parse response as JSON:', e);
    console.error('Response status:', response.status);
    console.error('Response headers:', response.headers);
    throw new Error('Invalid JSON response from server');
  }

  if (!response.ok) {
    const error = new Error(data.detail ?? 'An error occurred while fetching data');
    (error as any).status = response.status;
    console.error('API Error:', { url, status: response.status, response: data });
    throw error;
  }

  return data;
}

/**
 * Make a request with automatic token refresh on 401 errors
 */
export async function fetchAPIWithRefresh(
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> {
  // Import here to avoid circular dependency
  const { apiInterceptorService } = await import('@/services/api-interceptor.service');
  return apiInterceptorService.fetchWithRefresh(endpoint, options);
}

/**
 * Exchange Google OAuth code for tokens
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  state?: string
): Promise<any> {
  return fetchAPI('/api/v1/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
      state,
    }),
  });
}

/**
 * Get the current user's profile
 */
export async function getUserProfile(): Promise<any> {
  return fetchAPI('/api/v1/users/profile');
}

/**
 * Update the current user's profile
 * @param profileData Profile data to update
 */
export async function updateUserProfile(profileData: {
  display_name?: string;
  bio?: string;
}): Promise<any> {
  return fetchAPI('/api/v1/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

/**
 * Get the constitution overview
 */
export async function getConstitutionOverview(): Promise<any> {
  return fetchAPI('/api/v1/constitution');
}

/**
 * Get all chapters with pagination (with local fallback)
 * @param limit Number of chapters to fetch
 * @param offset Offset for pagination
 */
export async function getChapters(limit: number = 18, offset: number = 0): Promise<any> {
  try {
    return await fetchAPI(`/api/v1/constitution/chapters?limit=${limit}&offset=${offset}`);
  } catch (error) {
    if (DEBUG_MODE) {
      console.warn('Backend unavailable, using local constitution chapters fallback:', error);
    }
    const allChapters = localChaptersData as any[];
    const paginated = allChapters.slice(offset, offset + limit);
    return {
      statusCode: 200,
      body: {
        chapters: paginated,
        pagination: {
          total: allChapters.length,
          limit,
          offset,
          has_more: offset + limit < allChapters.length
        }
      }
    };
  }
}

/**
 * Get a chapter by its number (with local fallback)
 * @param chapterNumber Chapter number
 */
export async function getChapterByNumber(chapterNumber: number, options?: { force_reload?: boolean }): Promise<any> {
  const params = new URLSearchParams();
  if (options?.force_reload) {
    params.append('force_reload', 'true');
  }
  const url = `/api/v1/constitution/chapters/${chapterNumber}${params.toString() ? `?${params.toString()}` : ''}`;
  try {
    return await fetchAPI(url);
  } catch (error) {
    if (DEBUG_MODE) {
      console.warn(`Backend unavailable, loading local fallback for chapter ${chapterNumber}:`, error);
    }
    const allChapters = localChaptersData as any[];
    const chapter = allChapters.find((c: any) => c.chapter_number === chapterNumber);
    if (chapter) {
      // Create a copy to prevent mutation
      const enrichedChapter = { ...chapter };
      
      // If Chapter 4 (Bill of Rights), enrich with articles from bill-of-rights.json if articles are not already present
      if (chapterNumber === 4 && (!enrichedChapter.articles || enrichedChapter.articles.length === 0)) {
        const rights = (billOfRightsData as any).rights || [];
        enrichedChapter.articles = rights.map((r: any) => {
          const artNum = parseInt(r.article.replace('Article ', ''), 10) || r.id;
          return {
            article_number: artNum,
            article_title: r.title,
            content: r.description,
            clauses: r.key_provisions ? r.key_provisions.map((kp: string, idx: number) => ({
              clause_number: String(idx + 1),
              content: kp,
              sub_clauses: []
            })) : []
          };
        });
      }
      
      return {
        statusCode: 200,
        body: {
          chapter: enrichedChapter
        }
      };
    }
    throw error;
  }
}

/**
 * Force reload constitution data from the backend (clears cache)
 */
export async function reloadConstitutionData(): Promise<any> {
  try {
    return await fetchAPI('/api/v1/constitution/reload', {
      method: 'POST',
    });
  } catch (error) {
    // Graceful fallback for cache clear when backend is offline
    return { statusCode: 200, body: { message: 'Local cache reset' } };
  }
}

/**
 * Get an article by chapter and article number
 * @param chapterNumber Chapter number
 * @param articleNumber Article number
 */
export async function getArticleByChapterAndArticle(
  chapterNumber: number,
  articleNumber: number
): Promise<any> {
  try {
    return await fetchAPI(`/api/v1/constitution/chapters/${chapterNumber}/articles/${articleNumber}`);
  } catch (error) {
    if (chapterNumber === 4) {
      const rights = (billOfRightsData as any).rights || [];
      const found = rights.find((r: any) => {
        const num = parseInt(r.article.replace('Article ', ''), 10) || r.id;
        return num === articleNumber;
      });
      if (found) {
        return {
          statusCode: 200,
          body: {
            article: {
              article_number: articleNumber,
              article_title: found.title,
              content: found.description,
              clauses: found.key_provisions ? found.key_provisions.map((kp: string, idx: number) => ({
                clause_number: String(idx + 1),
                content: kp,
                sub_clauses: []
              })) : []
            }
          }
        };
      }
    }
    const chapter = (localChaptersData as any[]).find((c: any) => c.chapter_number === chapterNumber);
    const article = chapter?.articles?.find((a: any) => a.article_number === articleNumber);
    if (article) {
      return {
        statusCode: 200,
        body: {
          article
        }
      };
    }
    throw error;
  }
}

/**
 * Search the constitution (with local fallback)
 * @param params Search parameters (query, chapter, article, limit, offset, highlight, no_cache)
 */
export async function searchConstitution(params: {
  query: string;
  chapter?: number;
  article?: number;
  limit?: number;
  offset?: number;
  highlight?: boolean;
  no_cache?: boolean;
}): Promise<any> {
  const {
    query,
    chapter,
    article,
    limit = 10,
    offset = 0,
    highlight = false,
    no_cache = false,
  } = params;
  const url = `/api/v1/constitution/search?query=${encodeURIComponent(query)}${
    chapter !== undefined ? `&chapter=${chapter}` : ''
  }${article !== undefined ? `&article=${article}` : ''}&limit=${limit}&offset=${offset}&highlight=${highlight}&no_cache=${no_cache}`;
  
  try {
    return await fetchAPI(url);
  } catch (err) {
    const q = (query || '').toLowerCase();
    const results: any[] = [];

    // Search bill of rights
    const rights = (billOfRightsData as any).rights || [];
    rights.forEach((r: any) => {
      const artNum = parseInt(r.article.replace('Article ', ''), 10) || r.id;
      if (article !== undefined && artNum !== article) return;
      if (chapter !== undefined && chapter !== 4) return;
      
      const titleMatch = r.title.toLowerCase().includes(q);
      const descMatch = r.description.toLowerCase().includes(q);
      const provMatch = r.key_provisions?.some((kp: string) => kp.toLowerCase().includes(q));

      if (titleMatch || descMatch || provMatch || !q) {
        results.push({
          type: 'article',
          chapter_number: 4,
          chapter_title: 'The Bill of Rights',
          article_number: artNum,
          article_title: r.title,
          content: r.description,
          reference: `4.${artNum}`,
          url: `/chapters/4#article-${artNum}`
        });
      }
    });

    // Search chapters
    (localChaptersData as any[]).forEach((ch: any) => {
      if (chapter !== undefined && ch.chapter_number !== chapter) return;
      if (ch.chapter_title.toLowerCase().includes(q) || ch.chapter_summary.toLowerCase().includes(q) || !q) {
        results.push({
          type: 'chapter',
          chapter_number: ch.chapter_number,
          chapter_title: ch.chapter_title,
          content: ch.chapter_summary,
          reference: `${ch.chapter_number}`,
          url: `/chapters/${ch.chapter_number}`
        });
      }
      if (ch.articles) {
        ch.articles.forEach((art: any) => {
          if (article !== undefined && art.article_number !== article) return;
          if (art.article_title.toLowerCase().includes(q) || art.content?.toLowerCase().includes(q)) {
            results.push({
              type: 'article',
              chapter_number: ch.chapter_number,
              chapter_title: ch.chapter_title,
              article_number: art.article_number,
              article_title: art.article_title,
              content: art.content || art.article_title,
              reference: `${ch.chapter_number}.${art.article_number}`,
              url: `/chapters/${ch.chapter_number}#article-${art.article_number}`
            });
          }
        });
      }
    });

    const paginated = results.slice(offset, offset + limit);
    return {
      statusCode: 200,
      body: {
        results: paginated,
        total: results.length,
        pagination: {
          total: results.length,
          limit,
          offset,
          has_more: offset + limit < results.length
        }
      }
    };
  }
}

/**
 * Find related articles by reference
 * @param reference Reference string (e.g., '1.2')
 */
export async function getRelatedArticles(reference: string): Promise<any> {
  return fetchAPI(`/api/v1/constitution/related/${reference}`);
}

/**
 * Get popular/trending sections
 * @param timeframe Timeframe string (e.g., 'week', 'month')
 */
export async function getPopularSections(timeframe: string = 'week'): Promise<any> {
  return fetchAPI(`/api/v1/constitution/popular?timeframe=${timeframe}`);
}

/**
 * Save a bookmark for the user
 * @param userId User's UUID
 * @param bookmark Bookmark object with type, reference, and title
 */
export async function saveBookmark(
  userId: string,
  bookmark: {
    type: string;
    reference: string;
    title: string;
  }
): Promise<any> {
  return fetchAPI(
    `/api/v1/constitution/user/${userId}/bookmarks`,
    {
      method: 'POST',
      body: JSON.stringify({
        bookmark_type: bookmark.type,
        reference: bookmark.reference,
        title: bookmark.title,
      }),
    }
  );
}

/**
 * Get all bookmarks for a user
 * @param userId User's UUID
 */
export async function getUserBookmarks(userId: string): Promise<any> {
  return fetchAPIWithRefresh(`/api/v1/constitution/user/${userId}/bookmarks`);
}

/**
 * Remove a bookmark for the user
 * @param userId User's UUID
 * @param bookmarkId The ID of the bookmark to remove
 */
export async function removeBookmark(
  userId: string,
  bookmarkId: string
): Promise<any> {
  // console.log(`Removing bookmark: userId=${userId}, bookmarkId=${bookmarkId}`);
  const url = `/api/v1/constitution/user/${userId}/bookmarks/${bookmarkId}`;
  // console.log(`DELETE request to: ${url}`);
  
  return fetchAPI(
    url,
    {
      method: 'DELETE',
    }
  );
}


/**
 * Update reading progress for the user
 * @param userId User's UUID
 * @param itemType Type of item (e.g., 'chapter', 'article')
 * @param reference Reference string (e.g., '1', '1.2')
 * @param readTimeMinutes Incremental time spent reading in minutes for this session only
 */
export async function updateReadingProgress({
  userId,
  itemType,
  reference,
  readTimeMinutes,
}: {
  userId: string;
  itemType: 'chapter' | 'article';
  reference: string;
  readTimeMinutes: number;
}) {
  try {
    // Ensure readTimeMinutes is a valid number, never null or NaN
    const safeReadTimeMinutes = typeof readTimeMinutes === 'number' && !isNaN(readTimeMinutes) ? 
      Math.max(0, readTimeMinutes) : 0;
    
    // Log the API call for debugging
    if (DEBUG_MODE) {
      console.log(`[READ TIME DEBUG] API call: Sending incremental read time of ${safeReadTimeMinutes} minutes to server`);
      console.log(`[READ TIME DEBUG] API params: userId=${userId}, itemType=${itemType}, reference=${reference}`);
    }
    
    const response = await fetchAPI(
      `/api/v1/constitution/user/${userId}/progress`,
      {
        method: 'POST',
        body: JSON.stringify({
          item_type: itemType,
          reference,
          read_time_minutes: safeReadTimeMinutes,
          is_incremental: true, // Flag to tell backend this is incremental time
        }),
      }
    );
    
    if (DEBUG_MODE && response?.body?.progress) {
      console.log(`[READ TIME DEBUG] API response: total_read_time_minutes=${response.body.progress.total_read_time_minutes || 0}`);
    }
    
    return response;
  } catch (error) {
    console.error('Error updating reading progress:', error);
    throw error;
  }
}

/**
 * Get reading progress for a user
 * @param userId User's UUID
 */
export async function getUserReadingProgress(userId: string): Promise<any> {
  return fetchAPIWithRefresh(`/api/v1/constitution/user/${userId}/progress`);
}

/**
 * Get user's reading streak
 */
export async function getUserReadingStreak(): Promise<any> {
  return fetchAPI('/api/v1/reading/streak');
}

/**
 * Get reading analytics for a specific period
 * @param period Time period ('week', 'month', 'year')
 */
export async function getReadingAnalytics(period: string): Promise<any> {
  return fetchAPI(`/api/v1/reading/analytics/${period}`)
}

/**
 * Get user achievements
 */
export async function getUserAchievements(): Promise<any> {
  return fetchAPIWithRefresh('/api/v1/achievements');
}

/**
 * Get user saved content
 * @param folderId Optional folder ID to filter by
 */
export async function getUserSavedContent(folderId?: string): Promise<any> {
  const queryParam = folderId ? `?folder_id=${folderId}` : '';
  return fetchAPI(`/api/v1/content/saved${queryParam}`);
}

/**
 * Save content for user
 * @param contentData Content data to save
 */
export async function saveContent(contentData: {
  content_type: string;
  content_id: string;
  title: string;
  description?: string;
  folder_id?: string;
}): Promise<any> {
  return fetchAPI('/api/v1/content/saved', {
    method: 'POST',
    body: JSON.stringify(contentData),
  });
}

/**
 * Remove saved content
 * @param contentId Content ID to remove
 */
export async function removeSavedContent(contentId: string): Promise<any> {
  return fetchAPI(`/api/v1/content/saved/${contentId}`, {
    method: 'DELETE',
  });
}

/**
 * Get user's offline content
 */
export async function getUserOfflineContent(): Promise<any> {
  return fetchAPI('/api/v1/content/offline');
}

/**
 * Add content for offline access
 * @param contentData Offline content data
 */
export async function addOfflineContent(contentData: {
  content_id: string;
  content_type: string;
  priority?: number;
}): Promise<any> {
  return fetchAPI('/api/v1/content/offline', {
    method: 'POST',
    body: JSON.stringify(contentData),
  });
}

/**
 * Remove offline content
 * @param contentId Content ID to remove from offline
 */
export async function removeOfflineContent(contentId: string): Promise<any> {
  return fetchAPI(`/api/v1/content/offline/${contentId}`, {
    method: 'DELETE',
  });
}
