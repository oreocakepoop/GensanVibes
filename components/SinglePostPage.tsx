
import React from 'react';
import { usePost } from '../hooks/usePost.ts';
import PostComponent from './Post.tsx';
import PostSkeleton from './PostSkeleton.tsx';
import type { Post, View } from '../types.ts';

interface SinglePostPageProps {
  postId: string;
  onNavigate: (view: View) => void;
  onRepost: (post: Post) => void;
}

const SinglePostPage: React.FC<SinglePostPageProps> = ({ postId, onNavigate, onRepost }) => {
  const [post, loading] = usePost(postId);

  if (loading) {
    return (
      <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl">
        <PostSkeleton />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold font-serif text-brand-text">Post not found</h2>
        <p className="text-brand-text-secondary mt-2">This post may have been deleted or the link is incorrect.</p>
        <button
          onClick={() => onNavigate({ type: 'dashboard' })}
          className="mt-4 px-4 py-2 bg-brand-accent text-brand-surface font-bold rounded-lg text-sm hover:opacity-90 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl overflow-hidden">
      <PostComponent post={post} onNavigate={onNavigate} onRepost={onRepost} />
    </div>
  );
};

export default SinglePostPage;