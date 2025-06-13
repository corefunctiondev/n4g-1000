import { useQuery } from '@tanstack/react-query';
import type { SiteContent } from '@shared/schema';

// Hook to get content by section
export function useContentBySection(section: string) {
  return useQuery<SiteContent[]>({
    queryKey: ['/api/content', section],
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
  
  if (content.backgroundColor) {
    styles.backgroundColor = content.backgroundColor;
  }
  
  if (content.textColor) {
    styles.color = content.textColor;
  }
  
  if (content.fontSize) {
    const fontSizeMap = {
      'small': '0.875rem',
      'medium': '1rem',
      'large': '1.25rem',
      'xl': '1.5rem',
      '2xl': '2rem'
    };
    styles.fontSize = fontSizeMap[content.fontSize as keyof typeof fontSizeMap] || '1rem';
  }
  
  return styles;
}

// Helper function to get content value with fallback
export function getContentValue(content: SiteContent | undefined, field: keyof SiteContent, fallback: string = '') {
  return content?.[field] as string || fallback;
}