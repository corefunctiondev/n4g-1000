import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Preload all content when app starts to prevent flashing
export function usePreloadContent() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Preload all sections
    const sections = ['home', 'about', 'contact', 'sets', 'podcasts', 'bookings', 'releases', 'mixes'];
    
    sections.forEach(section => {
      queryClient.prefetchQuery({
        queryKey: ['/api/content/section', section],
        queryFn: () => fetch(`/api/content/section?section=${section}`).then(res => res.json()),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    });

    // Also preload all content
    queryClient.prefetchQuery({
      queryKey: ['/api/content'],
      queryFn: () => fetch('/api/content').then(res => res.json()),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
}