

import React, { useState, useEffect, useRef } from 'react';
import type { Post, View, Notification } from '../types.ts';
import { PostType, NotificationType } from '../types.ts';
import { auth, db } from '../firebase.ts';
import { ref, remove, runTransaction, set, push } from 'firebase/database';
import { useFollow, useUserProfile } from '../hooks/useFollow.ts';
import CommentSection from './CommentSection.tsx';
import { motion } from 'framer-motion';
import { iconUrls } from '../data/icons.ts';
import EmbeddedPost from './EmbeddedPost.tsx';
import { addVibePoints, VibePoints } from '../data/gamification.ts';
import AvatarWithBorder from './AvatarWithBorder.tsx';

interface PostComponentProps {
  post: Post;
  onNavigate: (view: View) => void;
  onRepost: (post: Post) => void;
}

const PostContent: React.FC<{ post: Post, onNavigate: (view: View) => void }> = ({ post, onNavigate }) => {
  switch (post.type) {
    case PostType.REPOST:
      return (
        <div className="px-4 space-y-3">
          {post.body && (
            <div className="text-base text-brand-text leading-relaxed space-y-4">
              {post.body.split('\n').filter(p => p.trim()).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
          {post.originalPostId && <EmbeddedPost originalPostId={post.originalPostId} onNavigate={onNavigate} />}
        </div>
      );
    case PostType.TEXT:
      return (
        <div className="px-4">
          {post.title && <h2 className="text-xl font-bold text-brand-text mb-2 font-serif">{post.title}</h2>}
          {post.body && (
            <div className="text-base text-brand-text leading-relaxed space-y-4">
              {post.body.split('\n').filter(p => p.trim()).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      );
    case PostType.PHOTO:
      return (
        <div>
          {post.imageUrl && <img src={post.imageUrl} alt={post.body || 'Post image'} className="w-full h-auto" />}
          {post.body && <p className="text-base leading-relaxed p-4">{post.body}</p>}
        </div>
      );
    case PostType.QUOTE:
       return (
        <div className="px-4">
            <blockquote className="pl-4 text-3xl font-medium italic text-brand-text border-l-4 border-brand-accent font-serif">“{post.quote}”</blockquote>
            {post.source && <p className="pl-4 mt-2 text-base text-brand-text-secondary font-semibold">— {post.source}</p>}
        </div>
      );
    case PostType.LINK:
      return (
        <div className="mx-4 border border-brand-border bg-brand-bg/50 p-4 rounded-lg">
            <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-brand-text hover:underline font-serif">{post.title}</a>
            {post.body && <p className="mt-1 text-sm text-brand-text-secondary">{post.body}</p>}
        </div>
      );
    case PostType.CHAT:
      return (
        <div className="px-4">
            {post.title && <h2 className="text-xl font-bold text-brand-text mb-3 font-serif">{post.title}</h2>}
            <ul className="space-y-1.5 font-mono text-sm">
                {post.chat?.map((line, index) => (
                    <li key={index}>
                        <span className="font-bold text-brand-text">{line.author}:</span>
                        <span className="ml-2 text-brand-text-secondary">{line.line}</span>
                    </li>
                ))}
            </ul>
        </div>
      );
    default:
      return <div className="px-4"><p className="text-brand-text-secondary">This post type is not supported yet.</p></div>;
  }
};

const PostHeader: React.FC<{post: Post, onNavigate: (view: View) => void}> = ({ post, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;
  const authorProfile = useUserProfile(post.userId);

  const isOwner = user && user.uid === post.userId;
  const { isFollowing, toggleFollow, loading, disabled } = useFollow(post.userId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }
    try {
      await remove(ref(db, `posts/${post.id}`));
      // Also need to delete associated comments and notifications if any
      await remove(ref(db, `comments/${post.id}`));
      // Deleting notifications related to this post is more complex and might be skipped for now.
      setMenuOpen(false); 
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate({ type: 'profile', userId: post.userId });
  };
  
  if (authorProfile === undefined) {
    return (
        <header className="flex items-center justify-between p-4 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-border"></div>
                <div>
                    <div className="h-5 w-24 bg-brand-border rounded"></div>
                </div>
            </div>
        </header>
    )
  }

  if (authorProfile === null) {
      return (
        <header className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-10 h-10">
                <AvatarWithBorder seed={'deleted-user'} alt="Deleted user" vibePoints={0} className="w-10 h-10" />
            </div>
            <div>
              <span className="font-bold text-base text-brand-text-secondary italic">[Deleted User]</span>
            </div>
          </div>
        </header>
      );
  }

  const avatarSeed = authorProfile.avatarStyle || post.userId;

  return (
    <header className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <button onClick={handleAuthorClick} className="shrink-0">
            <AvatarWithBorder seed={avatarSeed} alt={authorProfile.username} vibePoints={authorProfile.vibePoints || 0} selectedBorder={authorProfile.selectedBorder} className="w-10 h-10" />
        </button>
        <div>
            <div className="flex items-center flex-wrap gap-x-1.5">
              <button onClick={handleAuthorClick} className="font-bold text-base text-brand-text hover:underline">{authorProfile.username}</button>
              {post.barangay && (
                <>
                  <span className="text-brand-text-secondary font-bold text-xs">•</span>
                  <button 
                    onClick={() => onNavigate({ type: 'dashboard', filter: { type: 'barangay', name: post.barangay! } })}
                    className="text-brand-text-secondary text-sm font-medium hover:underline"
                  >
                    in {post.barangay}
                  </button>
                </>
              )}
            </div>
            {!isOwner && (
                <button
                  onClick={toggleFollow}
                  disabled={loading || disabled}
                  className={`mt-0.5 font-bold text-xs px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
                    isFollowing 
                    ? 'bg-brand-border text-brand-text-secondary'
                    : 'bg-brand-subtle text-brand-text'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
            )}
        </div>
      </div>

      <div className="relative">
          {isOwner && (
            <button
                onClick={() => setMenuOpen(prev => !prev)}
                className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full hover:bg-brand-bg active:bg-brand-border transition-colors" 
                aria-label="More options"
                aria-haspopup="true"
                aria-expanded={menuOpen}
            >
                <img src={iconUrls.moreOptions} alt="" className="w-5 h-5" />
            </button>
          )}
          
          {menuOpen && isOwner && (
              <div ref={menuRef} className="absolute top-full right-0 mt-2 w-48 bg-brand-surface rounded-lg shadow-xl z-10 ring-1 ring-brand-border/50">
                  <ul>
                      <li>
                          <button 
                              onClick={handleDelete}
                              className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-brand-accent hover:bg-brand-accent-light transition-colors rounded-lg"
                          >
                              <img src={iconUrls.trash} alt="" className="w-5 h-5" />
                              <span>Delete post</span>
                          </button>
                      </li>
                  </ul>
              </div>
          )}
      </div>
    </header>
  )
}

const PostFooter: React.FC<{post: Post, onToggleComments: () => void, onRepost: () => void}> = ({ post, onToggleComments, onRepost }) => {
  const [isLiked, setIsLiked] = useState(false);
  const currentUser = auth.currentUser;
  
  useEffect(() => {
    setIsLiked(!!(currentUser && post.likes?.[currentUser.uid]));
  }, [post.likes, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      alert("You must be logged in to like a post.");
      return;
    }
    const postRef = ref(db, `posts/${post.id}`);
    const wasLiked = post.likes?.[currentUser.uid];
    
    await runTransaction(postRef, (currentPost) => {
      if (currentPost) {
        if (currentPost.likes && currentPost.likes[currentUser.uid]) {
          // Unlike the post
          currentPost.likesCount = (currentPost.likesCount || 1) - 1;
          currentPost.likes[currentUser.uid] = null; // Use null to delete in transaction
        } else {
          // Like the post
          currentPost.likesCount = (currentPost.likesCount || 0) + 1;
          if (!currentPost.likes) {
            currentPost.likes = {};
          }
          currentPost.likes[currentUser.uid] = true;
        }
      }
      return currentPost;
    });

    // Award points and create a notification if the post was just liked
    if (!wasLiked && currentUser.uid !== post.userId) {
        // Award Vibe Points to the post author
        await addVibePoints(post.userId, VibePoints.POST_RECEIVE_LIKE);

        // Create notification
        const notificationsRef = ref(db, `notifications/${post.userId}`);
        const newNotificationRef = push(notificationsRef);
        const newNotification: Omit<Notification, 'id'> = {
            senderId: currentUser.uid,
            recipientId: post.userId,
            type: NotificationType.LIKE,
            postId: post.id,
            createdAt: new Date().toISOString(),
            read: false
        };
        await set(newNotificationRef, newNotification);
    }
  };

  const totalReactions = (post.likesCount ?? 0) + (post.commentsCount ?? 0) + (post.repostsCount ?? 0);

  const interactionButtons = [
    { label: 'Reply', action: onToggleComments, icon: iconUrls.reply, active: false },
    { label: 'Repost', action: onRepost, icon: iconUrls.repost, active: false },
    { label: 'Like', action: handleLike, icon: iconUrls.like, active: isLiked },
  ]

  return (
    <footer className="flex justify-between items-center p-4">
      <button onClick={onToggleComments} className="text-sm font-semibold text-brand-text-secondary hover:text-brand-text transition-colors">
        {totalReactions.toLocaleString()} reactions
      </button>
      <div className="flex items-center gap-1 text-brand-text-secondary">
        {interactionButtons.map(({ label, icon, action, active }) => (
            <button
              key={label}
              onClick={action}
              className={`p-2 rounded-full transition-colors duration-200 ${
                active ? 'text-brand-accent' : 'hover:text-brand-text hover:bg-brand-bg'
              }`} 
              aria-label={label}
            >
              <img src={label === 'Like' && active ? iconUrls.likeActive : icon} alt="" className="w-6 h-6" />
            </button>
        ))}
      </div>
    </footer>
  )
}

const PostComponent: React.FC<PostComponentProps> = ({ post, onNavigate, onRepost }) => {
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(false);

  const toggleCommentSection = () => {
    setIsCommentSectionOpen(prev => !prev);
  }

  return (
    <article className="bg-brand-surface overflow-hidden border-b border-brand-border">
      <PostHeader post={post} onNavigate={onNavigate} />
      
      <div className="pb-4">
        <PostContent post={post} onNavigate={onNavigate} />
      </div>
      
      {!isCommentSectionOpen && (post.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-4">
              {post.tags?.map(tag => (
                  <button
                    onClick={() => onNavigate({ type: 'dashboard', filter: { type: 'tag', value: tag } })}
                    key={tag}
                    className="text-sm font-medium bg-brand-bg text-brand-text-secondary px-2.5 py-1 rounded-md transition-colors duration-200 hover:bg-brand-subtle hover:text-brand-text"
                  >
                    #{tag}
                  </button>
              ))}
          </div>
      )}
      
      {!isCommentSectionOpen ? (
        <PostFooter post={post} onToggleComments={toggleCommentSection} onRepost={() => onRepost(post)} />
      ) : (
        <CommentSection post={post} onClose={toggleCommentSection} onRepost={() => onRepost(post)} onNavigate={onNavigate} />
      )}
    </article>
  );
};

export default PostComponent;