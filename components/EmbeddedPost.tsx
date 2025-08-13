
import React from 'react';
import type { Post, View } from '../types.ts';
import { PostType } from '../types.ts';
import { usePost } from '../hooks/usePost.ts';
import { useUserProfile } from '../hooks/useFollow.ts';
import Multiavatar from './Multiavatar.tsx';
import { motion } from 'framer-motion';

interface EmbeddedPostProps {
  originalPostId: string;
  onNavigate: (view: View) => void;
}

const EmbeddedPostContent: React.FC<{ post: Post }> = ({ post }) => {
  switch (post.type) {
    case PostType.TEXT:
      return (
        <div className="space-y-1">
          {post.title && <h3 className="font-semibold text-brand-text font-serif">{post.title}</h3>}
          {post.body && <p className="text-sm text-brand-text-secondary leading-snug">{post.body.substring(0, 150)}{post.body.length > 150 && '...'}</p>}
        </div>
      );
    case PostType.PHOTO:
      return (
        <div className="flex gap-3">
          {post.imageUrl && <img src={post.imageUrl} alt={post.body || ''} className="w-16 h-16 rounded-md object-cover bg-brand-border" />}
          {post.body && <p className="text-sm text-brand-text-secondary leading-snug flex-1">{post.body}</p>}
        </div>
      );
    case PostType.QUOTE:
       return (
        <div>
          <blockquote className="text-lg font-medium italic text-brand-text font-serif">“{post.quote}”</blockquote>
          {post.source && <p className="mt-1 text-sm text-brand-text-secondary font-semibold">— {post.source}</p>}
        </div>
      );
    case PostType.LINK:
      return (
        <div>
          <p className="font-semibold text-brand-text hover:underline font-serif">{post.title}</p>
          {post.body && <p className="mt-0.5 text-sm text-brand-text-secondary">{post.body}</p>}
        </div>
      );
    default:
      return <p className="text-sm text-brand-text-secondary italic">Original post content.</p>;
  }
};


const EmbeddedPost: React.FC<EmbeddedPostProps> = ({ originalPostId, onNavigate }) => {
  const [originalPost, loading] = usePost(originalPostId);
  const authorProfile = useUserProfile(originalPost?.userId);

  if (loading || !originalPost) {
    return (
      <div className="border border-brand-border rounded-lg p-3 animate-pulse">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-brand-border"></div>
            <div className="h-4 w-24 bg-brand-border rounded"></div>
        </div>
        <div className="h-10 bg-brand-border rounded"></div>
      </div>
    );
  }
  
  const avatarSeed = authorProfile?.avatarStyle || originalPost.userId;
  const authorUsername = authorProfile?.username || '...';

  return (
    <motion.button
      onClick={() => onNavigate({ type: 'post', postId: originalPostId })}
      className="w-full text-left border border-brand-border rounded-lg p-3 transition-colors hover:border-brand-subtle hover:bg-brand-bg/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-accent"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
        <div className="flex items-center gap-2 mb-2">
            <Multiavatar seed={avatarSeed} className="w-5 h-5 rounded-full" />
            <span className="text-sm font-semibold text-brand-text">{authorUsername}</span>
        </div>
        <div>
            <EmbeddedPostContent post={originalPost} />
        </div>
    </motion.button>
  );
};

export default EmbeddedPost;