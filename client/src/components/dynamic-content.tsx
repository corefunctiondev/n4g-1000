import { useContentByKey, useContentBySection, getContentStyles, getContentValue } from '@/hooks/use-content';
import type { SiteContent } from '@shared/schema';

interface DynamicContentProps {
  contentKey?: string;
  section?: string;
  fallbackText?: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function DynamicContent({ 
  contentKey, 
  section, 
  fallbackText = '', 
  className = '',
  as: Component = 'div'
}: DynamicContentProps) {
  const { data: keyContent, isLoading: keyLoading } = useContentByKey(contentKey || '');
  const { data: sectionContent, isLoading: sectionLoading } = useContentBySection(section || '');

  if (keyLoading || sectionLoading) {
    return <Component className={`${className} animate-pulse bg-gray-800`}>{fallbackText}</Component>;
  }

  // Single content item by key
  if (contentKey && keyContent) {
    const styles = getContentStyles(keyContent);
    return (
      <Component 
        className={className} 
        style={styles}
        data-editable="true"
        data-editable-type="text"
        data-content-key={contentKey}
      >
        {keyContent.content || keyContent.title || fallbackText}
      </Component>
    );
  }

  // Multiple content items by section
  if (section && sectionContent && sectionContent.length > 0) {
    return (
      <Component className={className}>
        {sectionContent.map((content) => (
          <div key={content.id} style={getContentStyles(content)}>
            {content.title && (
              <h3 
                data-editable="true" 
                data-editable-type="text" 
                data-content-key={content.key}
              >
                {content.title}
              </h3>
            )}
            {content.subtitle && (
              <h4 
                data-editable="true" 
                data-editable-type="text" 
                data-content-key={content.key}
              >
                {content.subtitle}
              </h4>
            )}
            {content.content && (
              <p 
                data-editable="true" 
                data-editable-type="text" 
                data-content-key={content.key}
              >
                {content.content}
              </p>
            )}
            {content.link_url && content.button_text && (
              <a 
                href={content.link_url} 
                className="inline-block mt-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
                data-editable="true" 
                data-editable-type="link" 
                data-content-key={content.key}
              >
                {content.button_text}
              </a>
            )}
          </div>
        ))}
      </Component>
    );
  }

  return <Component className={className}>{fallbackText}</Component>;
}

interface DynamicTextProps {
  contentKey: string;
  fallback?: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function DynamicText({ contentKey, fallback = '', className = '', as: Component = 'span' }: DynamicTextProps) {
  const { data: content, isLoading } = useContentByKey(contentKey);

  if (isLoading) {
    return <Component className={`${className} animate-pulse`}>Loading...</Component>;
  }

  const styles = getContentStyles(content || {} as SiteContent);
  const text = content?.title || content?.content || fallback;

  return (
    <Component 
      className={className} 
      style={styles}
      data-editable="true"
      data-editable-type="text"
      data-content-key={contentKey}
    >
      {text}
    </Component>
  );
}

interface DynamicLinkProps {
  contentKey: string;
  fallbackHref?: string;
  fallbackText?: string;
  className?: string;
}

export function DynamicLink({ contentKey, fallbackHref = '#', fallbackText = 'Link', className = '' }: DynamicLinkProps) {
  const { data: content, isLoading } = useContentByKey(contentKey);

  if (isLoading) {
    return <span className={`${className} animate-pulse`}>Loading...</span>;
  }

  const styles = getContentStyles(content || {} as SiteContent);
  const href = content?.link_url || fallbackHref;
  const text = content?.title || content?.button_text || fallbackText;

  return (
    <a 
      href={href} 
      className={className} 
      style={styles}
      data-editable="true"
      data-editable-type="link"
      data-content-key={contentKey}
    >
      {text}
    </a>
  );
}

interface DynamicImageProps {
  contentKey: string;
  fallbackSrc?: string;
  alt?: string;
  className?: string;
}

export function DynamicImage({ contentKey, fallbackSrc = '', alt = '', className = '' }: DynamicImageProps) {
  const { data: content, isLoading } = useContentByKey(contentKey);

  if (isLoading) {
    return <div className={`${className} animate-pulse bg-gray-800`} />;
  }

  const src = content?.image_url || fallbackSrc;
  const imageAlt = content?.title || alt;

  if (!src) return null;

  return (
    <img 
      src={src} 
      alt={imageAlt} 
      className={className}
      data-editable="true"
      data-editable-type="image"
      data-content-key={contentKey}
    />
  );
}