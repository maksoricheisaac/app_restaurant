import { Utensils } from 'lucide-react';

export function MenuHeader() {
  return (
    <div className="text-center mb-10 sm:mb-16">
      <div className="inline-flex items-center justify-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
        <div className="h-px w-8 sm:w-12 bg-orange-300"></div>
        <Utensils className="h-5 sm:h-6 w-5 sm:w-6 text-orange-600" />
        <div className="h-px w-8 sm:w-12 bg-orange-300"></div>
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif mb-3 sm:mb-4 text-gray-900">
        Notre Carte
      </h2>
      <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
        Des saveurs authentiques préparées avec amour et tradition
      </p>
    </div>
  );
} 