
import React from 'react';

const VibeSetterSkeleton: React.FC = () => (
    <div className="flex-shrink-0 w-32 flex flex-col items-center gap-2 p-3">
        <div className="w-16 h-16 rounded-full bg-brand-border"></div>
        <div className="w-full space-y-1.5">
            <div className="h-4 bg-brand-border rounded w-5/6 mx-auto"></div>
            <div className="h-3 bg-brand-border rounded w-1/2 mx-auto"></div>
        </div>
    </div>
);

const BarangayFeedHeaderSkeleton: React.FC = () => {
  return (
    <div className="border-b border-brand-border animate-pulse">
        {/* Hub Header Skeleton */}
        <div className="p-6 bg-brand-bg/50">
            <div className="h-10 bg-brand-border rounded w-1/2"></div>
            <div className="h-5 bg-brand-border rounded w-1/3 mt-2"></div>
        </div>

        {/* Vibe-setters Skeleton */}
        <div className="p-4">
            <div className="h-6 w-1/4 bg-brand-border rounded mb-2 px-2"></div>
            <div className="flex gap-2 -mx-2">
                {[...Array(4)].map((_, i) => <VibeSetterSkeleton key={i} />)}
            </div>
        </div>
    </div>
  );
};

export default BarangayFeedHeaderSkeleton;
