
import React from 'react';
import PostSkeleton from './PostSkeleton';

const ProfileSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl overflow-hidden animate-pulse">
      {/* Profile Header Skeleton */}
      <div className="p-8 border-b border-brand-border bg-brand-bg/50">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-brand-border shrink-0"></div>
          <div className="flex-1 w-full space-y-3">
            <div className="h-10 bg-brand-border rounded w-1/2"></div>
            <div className="h-5 bg-brand-border rounded w-1/3"></div>
            <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
              <div className="h-6 bg-brand-border rounded w-16"></div>
              <div className="h-6 bg-brand-border rounded w-20"></div>
              <div className="h-6 bg-brand-border rounded w-20"></div>
            </div>
            <div className="h-9 bg-brand-border rounded-lg w-28 mt-2"></div>
          </div>
        </div>
      </div>
      
      {/* Post Skeleton place holder */}
      <PostSkeleton />
      <PostSkeleton />

    </div>
  );
};

export default ProfileSkeleton;
