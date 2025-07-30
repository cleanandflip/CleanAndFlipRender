interface CardSkeletonProps {
  count?: number;
}

export default function CardSkeleton({ count = 8 }: CardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <div 
          key={index} 
          className="bg-gray-800/30 rounded-lg overflow-hidden animate-pulse"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="aspect-square bg-gray-700/50" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-700/50 rounded w-3/4" />
            <div className="h-3 bg-gray-700/50 rounded w-1/2" />
            <div className="h-6 bg-gray-700/50 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}