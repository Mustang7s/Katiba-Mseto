import useSWR from 'swr';
import { getChapters } from '@/lib/api';
import localChaptersData from '@/data/chapters.json';

/**
 * Custom hook to fetch chapters from the backend using SWR.
 * Returns chapters array, pagination, loading, error, and mutate function.
 */
export function useChapters(limit = 18, offset = 0) {
  const { data, error, isLoading, mutate } = useSWR(
    ['chapters', limit, offset],
    () => getChapters(limit, offset)
  );

  const chapters = data?.body?.chapters?.length > 0 
    ? data.body.chapters 
    : (localChaptersData as any[]).slice(offset, offset + limit);

  return {
    chapters,
    pagination: data?.body?.pagination,
    error: chapters.length > 0 ? null : error,
    isLoading: isLoading && chapters.length === 0,
    mutate,
  };
}
