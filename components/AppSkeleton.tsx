
import React from 'react';
import PostCreatorSkeleton from './PostCreatorSkeleton.tsx';
import PostSkeleton from './PostSkeleton.tsx';
import SidebarSkeleton from './SidebarSkeleton.tsx';

const AppSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen text-brand-text animate-pulse">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-20 bg-brand-surface/75 backdrop-blur-xl border-b border-brand-border/80">
        <div className="w-full max-w-[990px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-40 bg-brand-border rounded-md"></div>
            <div className="hidden md:block h-9 w-64 bg-brand-border rounded-md"></div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="h-9 w-9 bg-brand-border rounded-full"></div>
            <div className="h-9 w-9 bg-brand-border rounded-full"></div>
            <div className="h-9 w-9 bg-brand-border rounded-full"></div>
            <div className="h-9 w-9 bg-brand-border rounded-full ml-2"></div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="w-full max-w-[990px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-8">
          {/* Dashboard Skeleton */}
          <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl">
            <PostCreatorSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
          {/* Sidebar Skeleton */}
          <SidebarSkeleton />
        </div>
      </main>
    </div>
  );
};

export default AppSkeleton;