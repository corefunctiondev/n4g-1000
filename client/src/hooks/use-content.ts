import { useQuery } from '@tanstack/react-query';
import type { SiteContent } from '@shared/schema';

// Hook to get content by section
export function useContentBySection(section: string) {
  return useQuery<SiteContent[]>({
    queryKey: ['/api/content/section', section],
    queryFn: () => fetch(`/api/content/section?section=${section}`).then(res => res.json()),
    enabled: !!section,
  });
}

// Hook to get content by key
export function useContentByKey(key: string) {
  return useQuery<SiteContent>({
    queryKey: ['/api/content/key', key],
    enabled: !!key,
  });
}

// Hook to get all content
export function useAllContent() {
  return useQuery<SiteContent[]>({
    queryKey: ['/api/content'],
  });
}

// Helper function to apply styling from content
export function getContentStyles(content: SiteContent) {
  const styles: React.CSSProperties = {};
  
  if (content.background_color) {
    styles.backgroundColor = content.background_color;
  }
  
  if (content.text_color) {
    styles.color = content.text_color;
  }
  
  if (content.font_size) {
    const fontSizeMap = {
      'small': '0.875rem',
      'medium': '1rem',
      'large': '1.25rem',
      'xl': '1.5rem',
      '2xl': '2rem'
    };
    styles.fontSize = fontSizeMap[content.font_size as keyof typeof fontSizeMap] || '1rem';
  }
  
  return styles;
}

// Helper function to get content value with fallback
export function getContentValue(content: SiteContent | undefined, field: keyof SiteContent, fallback: string = '') {
  return content?.[field] as string || fallback;
}