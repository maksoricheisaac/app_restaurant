import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.label,
      'item': item.href ? `https://restaurant-africain.com${item.href}` : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <nav 
        className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`}
        aria-label="Breadcrumb"
      >
        <Link
          href="/"
          className="flex items-center hover:text-orange-600 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span className="sr-only">Accueil</span>
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="ml-1 hover:text-orange-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="ml-1 text-gray-900 font-medium">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>
    </>
  );
} 