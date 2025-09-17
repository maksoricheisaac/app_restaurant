import { generateStructuredData } from '@/lib/seo';

interface StructuredDataProps {
  type: 'restaurant' | 'menu' | 'organization';
}

export function StructuredData({ type }: StructuredDataProps) {
  const structuredData = generateStructuredData(type);
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
} 