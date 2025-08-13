import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, db } from '../firebase';
import { ref, onValue, push, remove, runTransaction, get, query, orderByChild, set } from 'firebase/database';
import type { Comment, UserProfile, Notification, Post, View } from '../types';
import { NotificationType } from '../types';
import CommentSkeleton from './CommentSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import Multiavatar from './Multiavatar';
import { useUserProfile } from '../hooks/useFollow';
import { iconUrls } from '../data/icons';
import { addVibePoints, VibePoints } from '../data/gamification';

// Badge Awarding Logic
const checkAndAwardBadge = async (userId: string, badgeId: string) => {
    const badgeRef = ref(db, `users/${userId}/badges/${badgeId}`);
    const snapshot = await get(badgeRef);
    if (!snapshot.exists()) {
        await set(badgeRef, new Date().toISOString());
    }
};

const checkCommentBadges = async (userId: string) => {
    const commentsCountRef = ref(db, `users/${userId}/commentsMadeCount`);
    let newTotalComments = 0;
    await runTransaction(commentsCountRef, (count) => {
        newTotalComments = (count || 0) + 1;
        return newTotalComments;
    });

    if (newTotalComments >= 25) {
        await checkAndAwardBadge(userId, 'comment_connoisseur');
    }
};

// Helper function to format time distance
const formatDistanceToNow = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return "just now";
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;

    const years = Math.floor(days / 365);
    return `${years}y`;
};

const CommentForm: React.FC<{
    onSubmit: (text: string) => void;
    isSubmitting: boolean;
    currentUserProfile?: UserProfile | null;
    onCancel?: () => void;
    isReply?: boolean;
    inputRef?: React.Ref<HTMLInputElement>;
}> = ({ onSubmit, isSubmitting, currentUserProfile, onCancel, isReply = false, inputRef }) => {
    const [text, setText] = useState('');
    const currentUser = auth.currentUser;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit(text.trim());
        setText('');
    };
    
    const avatarSeed = currentUserProfile?.avatarStyle || currentUser?.uid || 'default';
    const placeholder = isReply ? "Write a reply..." : `Reply as @${currentUserProfile?.username || 'Gensan User'}`;

    if (isReply) {
      // Keep original reply form for nested replies
      return (
        <form onSubmit={handleSubmit} className="flex items-start gap-2.5 py-3">
            <Multiavatar seed={avatarSeed} alt="Your avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5 bg-brand-border" />
            <div className="flex-1">
                 <div className="bg-brand-bg rounded-2xl flex items-end px-3.5 py-1.5 group focus-within:bg-brand-border/50 transition-colors duration-200">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none overflow-hidden text-sm placeholder:text-brand-text-secondary pr-2"
                        rows={1}
                        disabled={!currentUser}
                        autoFocus={isReply}
                    />
                    <motion.button
                        type="submit"
                        disabled={!text.trim() || isSubmitting || !currentUser}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 rounded-full text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent-light disabled:text-brand-border disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors self-end shrink-0"
                        aria-label="Send comment"
                    >
                        <img src={iconUrls.send} alt="Send comment" className="w-5 h-5" />
                    </motion.button>
                </div>
                {isReply && onCancel && (
                    <button onClick={onCancel} className="text-xs font-semibold text-brand-text-secondary hover:underline mt-1 ml-2">Cancel</button>
                )}
            </div>
        </form>
      );
    }
    
    // New top-level reply form design
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full">
        <Multiavatar seed={avatarSeed} alt="Your avatar" className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-brand-border" />
        <div className="flex-1 bg-white border border-brand-border rounded-lg flex items-center pr-2">
           <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-base placeholder:text-brand-text-secondary px-3 py-2"
              disabled={!currentUser}
            />
            <motion.button
              type="submit"
              disabled={!text.trim() || isSubmitting || !currentUser}
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded-full text-brand-text-secondary hover:text-brand-accent disabled:text-brand-border disabled:cursor-not-allowed"
              aria-label="Send comment"
            >
              <img src={iconUrls.send} alt="Send comment" className="w-6 h-6" />
            </motion.button>
        </div>
      </form>
    );
};


const CommentItem: React.FC<{ 
    comment: Comment; 
    replies: Comment[];
    level: number;
    currentUserId: string | undefined; 
    postId: string; 
    onDelete: (comment: Comment) => void; 
    onReply: (commentId: string) => void;
    replyingTo: string | null;
    onCancelReply: () => void;
    onSubmitReply: (text: string, parentId: string) => void;
    isSubmitting: boolean;
}> = ({ comment, replies, level, currentUserId, postId, onDelete, onReply, replyingTo, onCancelReply, onSubmitReply, isSubmitting }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.likesCount || 0);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const authorProfile = useUserProfile(comment.userId);
    const currentUserProfile = useUserProfile(currentUserId);
    
    const isOwner = currentUserId === comment.userId;
    
    useEffect(() => {
        setIsLiked(!!(currentUserId && comment.likes?.[currentUserId]));
        setLikeCount(comment.likesCount || 0);
    }, [comment.likes, comment.likesCount, currentUserId]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setMenuOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
  
    const handleLike = async () => {
      if (!currentUserId) return;
      const commentRef = ref(db, `comments/${postId}/${comment.id}`);
      
      await runTransaction(commentRef, (currentComment) => {
        if (currentComment) {
          if (currentComment.likes && currentComment.likes[currentUserId]) {
            currentComment.likesCount = (currentComment.likesCount || 1) - 1;
            currentComment.likes[currentUserId] = null;
          } else {
            currentComment.likesCount = (currentComment.likesCount || 0) + 1;
            if (!currentComment.likes) currentComment.likes = {};
            currentComment.likes[currentUserId] = true;
          }
        }
        return currentComment;
      });
    };
    
    if (authorProfile === undefined) return <CommentSkeleton />;

    const isDeletedComment = authorProfile === null;
    const avatarSeed = isDeletedComment ? 'deleted-user' : (authorProfile.avatarStyle || comment.userId);
    const username = isDeletedComment ? '[Deleted User]' : authorProfile.username;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-start gap-2.5 py-3"
        >
            <div className="flex-shrink-0 mt-0.5">
                <Multiavatar seed={avatarSeed} alt={username} className="w-8 h-8 rounded-full object-cover bg-brand-border" />
            </div>

            <div className="flex-1">
                <div className="relative group">
                    <div className="bg-ivory/80 rounded-xl px-3 py-1.5">
                        <span className={`font-semibold text-sm ${isDeletedComment ? 'text-brand-text-secondary italic' : 'text-brand-text'}`}>{username}</span>
                        <p className={`text-sm leading-snug break-words ${isDeletedComment ? 'text-brand-text-secondary italic' : 'text-brand-text'}`}>
                            {isDeletedComment ? 'This comment was deleted.' : comment.body}
                        </p>
                    </div>
                    {!isDeletedComment && likeCount > 0 && (
                        <div className="absolute -bottom-2.5 right-2 bg-brand-surface border border-brand-border rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm">
                            <img src={iconUrls.thumbsUpActive} alt="" className="w-3 h-3"/>
                            <span className="text-xs font-bold text-brand-text-secondary">{likeCount}</span>
                        </div>
                    )}
                    {isOwner && (
                        <div ref={menuRef} className="absolute top-1 right-1">
                           <motion.button onClick={() => setMenuOpen(p => !p)} whileTap={{scale: 0.9}} className="p-1 rounded-full text-brand-text-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-brand-border hover:text-brand-text transition-all">
                                <img src={iconUrls.moreOptions} alt="More options" className="w-4 h-4"/>
                            </motion.button>
                            <AnimatePresence>
                            {menuOpen && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute top-full right-0 mt-1 w-32 bg-brand-surface rounded-lg shadow-xl z-10 ring-1 ring-brand-border/50">
                                    <button onClick={() => { onDelete(comment); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-brand-accent hover:bg-brand-accent-light transition-colors rounded-lg">
                                        <img src={iconUrls.trash} alt="Delete" className="w-4 h-4" />
                                        <span>Delete</span>
                                    </button>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
                {!isDeletedComment && (
                    <div className="flex items-center gap-3 text-xs text-brand-text-secondary font-semibold mt-1 ml-3">
                        <motion.button onClick={handleLike} whileTap={{scale: 0.9}} className={`${isLiked ? 'text-brand-accent' : 'hover:underline'}`}>Like</motion.button>
                        <span>·</span>
                        <motion.button onClick={() => onReply(comment.id)} whileTap={{scale: 0.9}} className="hover:underline">Reply</motion.button>
                         <span>·</span>
                        <span className="font-normal text-brand-text-secondary/80 cursor-default">{formatDistanceToNow(comment.createdAt)}</span>
                    </div>
                )}
                 {replyingTo === comment.id && (
                    <div className="mt-2">
                        <CommentForm
                            onSubmit={(text) => onSubmitReply(text, comment.id)}
                            isSubmitting={isSubmitting}
                            currentUserProfile={currentUserProfile}
                            onCancel={onCancelReply}
                            isReply={true}
                        />
                    </div>
                )}
                {replies.length > 0 && level === 0 && (
                     <div className="mt-2 pl-4 relative border-l-2 border-brand-border/80 ml-4">
                        {replies.map(reply => (
                           <CommentItem
                                key={reply.id}
                                comment={reply}
                                replies={[]} // Max 1 level of nesting
                                level={1}
                                currentUserId={currentUserId}
                                postId={postId}
                                onDelete={onDelete}
                                onReply={onReply}
                                replyingTo={replyingTo}
                                onCancelReply={onCancelReply}
                                onSubmitReply={onSubmitReply}
                                isSubmitting={isSubmitting}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const CommentSection: React.FC<{ post: Post; onClose: () => void, onRepost: (post: Post) => void; onNavigate: (view: View) => void; }> = ({ post, onClose, onRepost, onNavigate }) => {
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  const currentUser = auth.currentUser;
  const currentUserProfile = useUserProfile(currentUser?.uid);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const commentsRef = query(ref(db, `comments/${post.id}`), orderByChild('createdAt'));
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedComments: Comment[] = data 
        ? Object.keys(data).map(key => ({ id: key, ...data[key] }))
        : [];
      setAllComments(loadedComments);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [post.id]);

  const { topLevelComments, repliesByParentId } = useMemo(() => {
    const topLevel = allComments.filter(c => !c.parentId);
    const repliesMap = allComments.reduce<Record<string, Comment[]>>((acc, comment) => {
        if (comment.parentId) {
            if (!acc[comment.parentId]) acc[comment.parentId] = [];
            acc[comment.parentId].push(comment);
        }
        return acc;
    }, {});
    return { topLevelComments: topLevel, repliesByParentId: repliesMap };
  }, [allComments]);

  const handleCommentSubmit = async (text: string, parentId: string | null) => {
    if (!currentUser || !currentUserProfile) return;
    setIsSubmitting(true);
    try {
      const commentData: Omit<Comment, 'id' | 'postId'> = {
        userId: currentUser.uid,
        body: text,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        replyCount: 0,
        ...(parentId && { parentId }),
      };
      
      await push(ref(db, `comments/${post.id}`), commentData);
      await runTransaction(ref(db, `posts/${post.id}/commentsCount`), (count) => (count || 0) + 1);
      
      if (parentId) {
          await runTransaction(ref(db, `comments/${post.id}/${parentId}/replyCount`), (count) => (count || 0) + 1);
      }

      // Award Vibe points
      await addVibePoints(currentUser.uid, VibePoints.COMMENT_CREATE);
      if (post.userId !== currentUser.uid) {
        await addVibePoints(post.userId, VibePoints.POST_RECEIVE_COMMENT);
      }
      
      const recipients = new Set<string>();
      if (post.userId !== currentUser.uid) recipients.add(post.userId);
      
      if (parentId) {
        const parentComment = allComments.find(c => c.id === parentId);
        if (parentComment && parentComment.userId !== currentUser.uid) {
            recipients.add(parentComment.userId);
        }
      }

      recipients.forEach(recipientId => {
          const newNotificationRef = push(ref(db, `notifications/${recipientId}`));
          set(newNotificationRef, {
            senderId: currentUser.uid,
            recipientId,
            type: NotificationType.COMMENT,
            postId: post.id,
            createdAt: new Date().toISOString(),
            read: false
          });
      });

      await checkCommentBadges(currentUser.uid);

      setReplyingTo(null);
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await remove(ref(db, `comments/${post.id}/${comment.id}`));
      await runTransaction(ref(db, `posts/${post.id}/commentsCount`), (count) => Math.max(0, (count || 0) - 1));
      if (comment.parentId) {
        await runTransaction(ref(db, `comments/${post.id}/${comment.parentId}/replyCount`), (count) => Math.max(0, (count || 0) - 1));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };
  
  const handleFocusInput = () => {
      inputRef.current?.focus();
  }

  const handleLike = async () => {
    if (!currentUser) return;
    const postRef = ref(db, `posts/${post.id}`);
    await runTransaction(postRef, (p) => {
      if (p) {
        if (p.likes && p.likes[currentUser.uid]) {
          p.likesCount--;
          p.likes[currentUser.uid] = null;
        } else {
          p.likesCount++;
          if (!p.likes) p.likes = {};
          p.likes[currentUser.uid] = true;
        }
      }
      return p;
    });
  };

  const isLiked = !!(currentUser && post.likes?.[currentUser.uid]);
  
  const topBarActions = [
      { label: 'Reply', icon: iconUrls.reply, action: handleFocusInput },
      { label: 'Repost', icon: iconUrls.repost, action: () => onRepost(post) },
      { label: 'Like', icon: isLiked ? iconUrls.likeActive : iconUrls.like, action: handleLike, active: isLiked },
  ];

  return (
    <div className="bg-brand-surface">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-2 border-b border-brand-border/50">
        <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg transition-colors">
            <img src={iconUrls.close} alt="" className="w-5 h-5"/>
            <span>Close reactions</span>
        </button>
        <div className="flex items-center text-brand-text-secondary">
          {topBarActions.map(({label, icon, action, active}) => (
            <button key={label} onClick={action} aria-label={label} className={`p-2 rounded-full hover:bg-brand-bg transition-colors ${active ? 'text-brand-accent' : ''}`}>
                <img src={icon} alt={label} className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>

      {/* Counts Header */}
      <div className="flex justify-between items-center px-4 py-1">
        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-brand-info text-white font-bold text-sm px-3 py-1.5 rounded-full">
                <img src={iconUrls.reply} alt="" className="w-5 h-5" style={{filter: 'brightness(0) invert(1)'}}/>
                <span>{post.commentsCount || 0}</span>
            </button>
            <button className="flex items-center gap-2 text-brand-text-secondary font-bold text-sm px-3 py-1.5 rounded-full hover:bg-brand-bg transition-colors">
                <img src={iconUrls.repost} alt="" className="w-5 h-5"/>
                <span>{post.repostsCount || 0}</span>
            </button>
            <button className="flex items-center gap-2 text-brand-text-secondary font-bold text-sm px-3 py-1.5 rounded-full hover:bg-brand-bg transition-colors">
                <img src={iconUrls.like} alt="" className="w-5 h-5"/>
                <span>{post.likesCount || 0}</span>
            </button>
        </div>
        
      </div>
      
      {/* Reply Form */}
      <div className="px-4 py-3 border-t border-b border-brand-border">
          {currentUser && (
            <CommentForm
                onSubmit={(text) => handleCommentSubmit(text, null)}
                isSubmitting={isSubmitting}
                currentUserProfile={currentUserProfile}
                inputRef={inputRef}
            />
          )}
      </div>

      {/* Comments List */}
      <div className="px-4">
        {loading ? (
          <CommentSkeleton />
        ) : topLevelComments.length > 0 ? (
            topLevelComments.map((comment) => (
              <CommentItem 
                  key={comment.id}
                  comment={comment}
                  replies={repliesByParentId[comment.id] || []}
                  level={0}
                  currentUserId={currentUser?.uid}
                  postId={post.id}
                  onDelete={handleDeleteComment}
                  onReply={setReplyingTo}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  onSubmitReply={handleCommentSubmit}
                  isSubmitting={isSubmitting}
              />
            ))
        ) : (
          <div className="text-center py-12">
            <img src={iconUrls.commentLarge} alt="" className="w-16 h-16 mx-auto opacity-40" />
            <p className="mt-4 text-base text-brand-text-secondary">Be the first to Reply! Or...</p>
            <button onClick={() => onNavigate({type: 'dashboard', filter: {type: 'explore'}})} className="mt-2 font-bold text-brand-accent hover:underline">
                Check out other posts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;