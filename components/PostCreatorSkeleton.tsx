
import React from 'react';

const PostCreatorSkeleton: React.FC = () => {
  return (
    <div className="bg-brand-surface p-4 flex items-center gap-4 border-b border-brand-border animate-pulse">
      <div className="w-12 h-12 rounded-full bg-brand-border shrink-0"></div>
      <div className="flex-1 flex justify-around items-start">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex flex-col items-center justify-start gap-1.5 w-16 h-16">
            <div className="w-7 h-7 bg-brand-border rounded-md"></div>
            <div className="w-10 h-4 bg-brand-border rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostCreatorSkeleton;