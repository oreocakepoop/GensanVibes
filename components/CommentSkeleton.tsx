
import React from 'react';

const SingleCommentSkeleton: React.FC = () => {
    return (
        <div className="flex items-start gap-3 py-2.5">
            <div className="w-10 h-10 rounded-full bg-brand-border flex-shrink-0"></div>
            <div className="flex-1">
                <div className="bg-brand-bg rounded-xl px-3.5 py-2 space-y-2">
                    <div className="h-4 w-1/4 bg-brand-border rounded"></div>
                    <div className="h-3 w-4/5 bg-brand-border rounded"></div>
                </div>
                <div className="flex items-center gap-3 mt-1.5 ml-3">
                    <div className="h-3 w-8 bg-brand-border rounded"></div>
                </div>
            </div>
        </div>
    );
}

const CommentSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse pt-2 pb-4">
        <SingleCommentSkeleton />
        <SingleCommentSkeleton />
    </div>
  );
};

export default CommentSkeleton;