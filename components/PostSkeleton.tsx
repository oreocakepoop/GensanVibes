
import React from 'react';

const PostSkeleton: React.FC = () => {
  return (
    <div className="bg-brand-surface overflow-hidden border-b border-brand-border p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-brand-border shrink-0"></div>
        <div className="flex-1">
          <div className="h-5 bg-brand-border rounded w-1/3"></div>
        </div>
        <div className="w-6 h-6 rounded-full bg-brand-border"></div>
      </div>

      {/* Body */}
      <div className="my-6 space-y-3">
        <div className="h-4 bg-brand-border rounded"></div>
        <div className="h-4 bg-brand-border rounded w-5/6"></div>
        <div className="h-4 bg-brand-border rounded w-4/6"></div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <div className="h-6 bg-brand-border rounded w-1/4"></div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand-border"></div>
          <div className="w-9 h-9 rounded-full bg-brand-border"></div>
          <div className="w-9 h-9 rounded-full bg-brand-border"></div>
          <div className="w-9 h-9 rounded-full bg-brand-border"></div>
        </div>
      </div>
    </div>
  );
};

export default PostSkeleton;