interface GalleryStatsProps {
  count: number;
  selectedCategory: string;
}

export function GalleryStats({ count, selectedCategory }: GalleryStatsProps) {
  return (
    <div className="text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
      <span className="font-semibold text-orange-600">{count}</span> photo{count > 1 ? 's' : ''} 
      {selectedCategory !== 'Tous' && <span className="ml-1">dans &quot;<span className="font-medium text-gray-900">{selectedCategory}</span>&quot;</span>}
    </div>
  );
}
