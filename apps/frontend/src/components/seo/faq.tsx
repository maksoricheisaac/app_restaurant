import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
  className?: string;
}

export function FAQ({ items, title = "Questions Fréquentes", className = '' }: FAQProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': items.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };

  return (
    <div className={className}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
          {title}
        </h2>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <Card key={index} className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto text-left font-semibold text-lg text-gray-900 hover:bg-transparent"
                  onClick={() => toggleItem(index)}
                >
                  {item.question}
                  {openItems.includes(index) ? (
                    <ChevronUp className="h-5 w-5 text-orange-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-orange-600" />
                  )}
                </Button>
              </CardHeader>
              
              {openItems.includes(index) && (
                <CardContent className="pt-0">
                  <p className="text-gray-700 leading-relaxed">
                    {item.answer}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 