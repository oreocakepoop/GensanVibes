import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase.ts';
import { ref, set, push, runTransaction, get } from 'firebase/database';
import { PostType, UserProfile, Post, Notification, NotificationType, View, Badge } from '../types.ts';
import { motion, Variants } from 'framer-motion';
import Multiavatar from './Multiavatar.tsx';
import { useUserProfile } from '../hooks/useFollow.ts';
import EmbeddedPost from './EmbeddedPost.tsx';
import { iconUrls } from '../data/icons.ts';
import { badges as allBadges } from '../data/badges.ts';
import { addVibePoints, VibePoints } from '../data/gamification.ts';

// Badge Awarding Logic
const checkAndAwardBadge = async (userId: string, badgeId: string) => {
    const badgeRef = ref(db, `users/${userId}/badges/${badgeId}`);
    const snapshot = await get(badgeRef);
    if (!snapshot.exists()) {
        await set(badgeRef, new Date().toISOString());
        // Optional: show a notification to the user about the new badge
    }
};

const checkPostBadges = async (userId: string, newTotalPosts: number, userProfile: UserProfile, postBarangay: string | null) => {
    if (newTotalPosts === 1) await checkAndAwardBadge(userId, 'first_vibe');
    if (newTotalPosts >= 10) await checkAndAwardBadge(userId, 'word_weaver');
    if (newTotalPosts >= 100) await checkAndAwardBadge(userId, 'tuna_capital_titan');

    // Barangay specific badge
    if (postBarangay && userProfile.barangay && userProfile.barangay === postBarangay) {
        await checkAndAwardBadge(userId, 'local_viber');
    }
};


interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  postType: PostType;
  postToRepost?: Post | null;
  onNavigate: (view: View) => void;
}

const backdropVariants: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 }
};

const modalVariants: Variants = {
  hidden: { y: "-50px", scale: 0.95, opacity: 0 },
  visible: { y: "0", scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { y: "50px", scale: 0.95, opacity: 0, transition: { duration: 0.2 } }
};

const PostCreationModal: React.FC<PostCreationModalProps> = ({ isOpen, onClose, postType, postToRepost, onNavigate }) => {
  // Common state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;
  const userProfile = useUserProfile(user?.uid);
  
  // Post-specific state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState(''); // Also used for repost commentary
  const [imageUrl, setImageUrl] = useState('');
  const [quote, setQuote] = useState('');
  const [source, setSource] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  // Tag state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
        setTitle('');
        setBody('');
        setImageUrl('');
        setQuote('');
        setSource('');
        setLinkUrl('');
        setTags(postToRepost?.tags || []);
        setTagInput('');
        setError('');
        setLoading(false);
    }
  }, [isOpen, postToRepost]);

  const handleNavigateAndClose = (view: View) => {
    onNavigate(view);
    onClose();
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      setError("You must be logged in to post.");
      return;
    }

    setLoading(true);
    setError('');

    try {
        if (postType === PostType.REPOST && postToRepost) {
            await handleRepostSubmit();
        } else {
            await handleNewPostSubmit();
        }
        onClose();

    } catch (err: any) {
        setError(err.message || 'Failed to create post.');
    } finally {
        setLoading(false);
    }
  };
  
  const handlePostCreationSuccess = async (postData: Partial<Post>) => {
    if (!user || !userProfile) return;
    
    // Award Vibe Points
    await addVibePoints(user.uid, VibePoints.POST_CREATE);

    // Increment user's post count
    const postCountRef = ref(db, `users/${user.uid}/postsCount`);
    let newTotalPosts = 0;
    await runTransaction(postCountRef, (count) => {
        newTotalPosts = (count || 0) + 1;
        return newTotalPosts;
    });

    // Check for badges
    await checkPostBadges(user.uid, newTotalPosts, userProfile, postData.barangay || null);
  };


  const handleNewPostSubmit = async () => {
    if (!user) throw new Error("User not found");

    const postsRef = ref(db, 'posts');
    const newPostRef = push(postsRef);
    const newPostData: any = {
        userId: user.uid,
        type: postType,
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        tags: tags,
        barangay: userProfile?.barangay || null,
        createdAt: new Date().toISOString()
    };

    switch (postType) {
        case PostType.TEXT: newPostData.title = title; newPostData.body = body; break;
        case PostType.PHOTO: newPostData.imageUrl = imageUrl; newPostData.body = body; break;
        case PostType.QUOTE: newPostData.quote = quote; newPostData.source = source; break;
        case PostType.LINK: newPostData.linkUrl = linkUrl; newPostData.title = title; newPostData.body = body; break;
        default: throw new Error("Unsupported post type");
    }
    
    await set(newPostRef, newPostData);
    await handlePostCreationSuccess(newPostData);
  };

  const handleRepostSubmit = async () => {
    if (!user || !postToRepost) throw new Error("Missing data for repost");

    // 1. Create the new repost object
    const postsRef = ref(db, 'posts');
    const newPostRef = push(postsRef);
    const newPostData: Omit<Post, 'id'> = {
        userId: user.uid,
        type: PostType.REPOST,
        body: body.trim(), // The commentary
        originalPostId: postToRepost.id,
        tags: tags,
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        barangay: userProfile?.barangay || null,
        createdAt: new Date().toISOString()
    };
    await set(newPostRef, newPostData);

    // 2. Increment the repost count on the original post
    const originalPostRef = ref(db, `posts/${postToRepost.id}/repostsCount`);
    await runTransaction(originalPostRef, (count) => (count || 0) + 1);

    // 3. Create a notification for the original author
    if (user.uid !== postToRepost.userId) {
        const notificationsRef = ref(db, `notifications/${postToRepost.userId}`);
        const newNotificationRef = push(notificationsRef);
        const newNotification: Omit<Notification, 'id'> = {
            senderId: user.uid,
            recipientId: postToRepost.userId,
            type: NotificationType.REPOST,
            postId: postToRepost.id,
            createdAt: new Date().toISOString(),
            read: false
        };
        await set(newNotificationRef, newNotification);
    }
    
    await handlePostCreationSuccess(newPostData);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === ',' || e.key === 'Enter') {
          e.preventDefault();
          const newTag = tagInput.trim().replace(/,/g, '');
          if (newTag && !tags.includes(newTag)) {
              setTags([...tags, newTag]);
          }
          setTagInput('');
      }
  };

  const removeTag = (tagToRemove: string) => {
      setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const isFormContentValid = (() => {
    switch (postType) {
        case PostType.TEXT: return !!body.trim();
        case PostType.PHOTO: return !!imageUrl.trim() && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));
        case PostType.QUOTE: return !!quote.trim();
        case PostType.LINK: return !!linkUrl.trim() && (linkUrl.startsWith('http://') || linkUrl.startsWith('https://'));
        case PostType.REPOST: return true; // Can repost with no commentary
        default: return false;
    }
  })();

  // The button should only be submittable if not loading, the user profile is loaded, and the form content is valid.
  const isSubmittable = !loading && !!userProfile && isFormContentValid;
  
  const getModalTitle = () => {
    if (!postType) return "Create a Post";
    if (postType === PostType.REPOST) return "Re-vibe this post";
    const typeName = postType.charAt(0) + postType.slice(1).toLowerCase();
    return `Create a New ${typeName} Post`;
  }
  
  const avatarSeed = userProfile?.avatarStyle || auth.currentUser?.uid || 'default';


  const renderFormFields = () => {
    if (postType === PostType.REPOST) {
        return (
            <div className="p-4 space-y-4">
                <textarea placeholder="Add a comment... (optional)" value={body} onChange={e => setBody(e.target.value)} className="w-full bg-transparent text-lg text-brand-text placeholder:text-brand-text-secondary/70 focus:outline-none resize-none" />
                {postToRepost && <EmbeddedPost originalPostId={postToRepost.id} onNavigate={handleNavigateAndClose} />}
            </div>
        )
    }
    switch (postType) {
        case PostType.TEXT:
            return <>
                <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent p-4 text-3xl font-bold text-brand-text placeholder:text-brand-text-secondary/70 focus:outline-none font-serif" />
                <textarea placeholder="Your text here..." value={body} onChange={e => setBody(e.target.value)} className="w-full bg-transparent p-4 text-lg text-brand-text-secondary placeholder:text-brand-text-secondary/70 focus:outline-none resize-none flex-grow" required />
            </>;
        case PostType.PHOTO:
            return <div className="p-4 flex flex-col h-full">
                <input 
                    type="url" 
                    placeholder="Paste an image URL" 
                    value={imageUrl} 
                    onChange={e => setImageUrl(e.target.value)} 
                    className="w-full text-base p-3 border bg-brand-bg rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent border-brand-border" 
                    required 
                />
                {imageUrl && (
                    <div className="mt-4 flex-grow relative bg-brand-bg rounded-lg">
                        <img 
                            src={imageUrl} 
                            alt="URL Preview" 
                            className="w-full h-full object-contain rounded-lg" 
                            onError={(e) => { e.currentTarget.src = "https://placehold.co/600x400/ebeccc/473C33?text=Invalid+Image+URL"; }}
                        />
                    </div>
                )}
                <textarea placeholder="Add a caption... (optional)" value={body} onChange={e => setBody(e.target.value)} className="w-full bg-transparent p-4 text-base text-brand-text-secondary placeholder:text-brand-text-secondary/70 focus:outline-none resize-none mt-4 h-24" />
            </div>;
        case PostType.QUOTE:
            return <div className="p-4 flex flex-col justify-center h-full">
                <textarea placeholder="“Quote”" value={quote} onChange={e => setQuote(e.target.value)} className="w-full bg-transparent text-4xl italic font-medium text-brand-text placeholder:text-brand-text-secondary/70 focus:outline-none resize-none h-48 font-serif" required />
                <input type="text" placeholder="— Source" value={source} onChange={e => setSource(e.target.value)} className="w-full bg-transparent text-xl text-brand-text-secondary placeholder:text-brand-text-secondary/70 focus:outline-none mt-2" />
            </div>;
        case PostType.LINK:
             return <div className="p-4 flex flex-col h-full">
                <input type="url" placeholder="Type or paste a URL" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full text-base p-3 border bg-brand-bg rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent border-brand-border" required />
                <input type="text" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent p-4 text-2xl font-bold text-brand-text placeholder:text-brand-text-secondary/70 focus:outline-none mt-4 font-serif" />
                <textarea placeholder="Add a description... (optional)" value={body} onChange={e => setBody(e.target.value)} className="w-full bg-transparent p-4 text-base text-brand-text-secondary placeholder:text-brand-text-secondary/70 focus:outline-none resize-none mt-2" />
            </div>;
      default:
        return <p className="p-4 text-center text-brand-text-secondary">This post type isn't available yet. Stay tuned!</p>
    }
  }

  return (
    <motion.div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" 
        onClick={onClose}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
    >
      <motion.div 
        className="bg-brand-surface rounded-xl shadow-2xl w-full max-w-3xl flex flex-col h-[700px]" 
        onClick={e => e.stopPropagation()}
        variants={modalVariants}
      >
        <header className="p-4 flex items-center border-b border-brand-border shrink-0">
            <Multiavatar seed={avatarSeed} alt="User Avatar" className="w-10 h-10 rounded-full object-cover bg-brand-border" />
            <div className="ml-3">
              <span className="font-bold text-brand-text">{userProfile?.username || 'Gensan User'}</span>
              <p className="text-sm text-brand-text-secondary">{getModalTitle()}</p>
            </div>
            <button onClick={onClose} className="ml-auto text-brand-text-secondary hover:text-brand-text p-2 rounded-full transition-colors">
                <img src={iconUrls.close} alt="Close" className="w-6 h-6" />
            </button>
        </header>
        
        <form onSubmit={handleCreatePost} className="flex flex-col flex-grow min-h-0">
            <div className="flex-grow flex flex-col min-h-0 overflow-y-auto">
                {renderFormFields()}
            </div>
            
            {isFormContentValid !== null && (
                 <footer className="p-4 border-t border-brand-border shrink-0">
                    <div className="bg-brand-bg rounded-lg p-2 flex flex-wrap items-center gap-2">
                        {tags.map(tag => (
                            <div key={tag} className="flex items-center gap-1 bg-brand-subtle text-brand-text font-bold text-sm px-2 py-1 rounded-md">
                                <span>#{tag}</span>
                                <button type="button" onClick={() => removeTag(tag)} className="text-brand-text hover:bg-eucalyptus rounded-full">
                                    <img src={iconUrls.close} alt="Remove tag" className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                        <input 
                            type="text" 
                            placeholder={tags.length === 0 ? "#add_tags" : ""}
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                            className="flex-grow bg-transparent text-base text-brand-text-secondary focus:outline-none p-1 min-w-[120px]" 
                        />
                    </div>
                    <div className="flex justify-end items-center mt-4">
                        {error && <p className="text-brand-accent text-sm mr-4">{error}</p>}
                        <button 
                            type="submit" 
                            disabled={!isSubmittable}
                            className="bg-brand-accent hover:opacity-90 text-brand-surface font-bold py-2.5 px-6 rounded-lg text-base transition-all disabled:bg-brand-border disabled:text-brand-text-secondary disabled:cursor-not-allowed">
                            {loading ? 'Posting...' : (userProfile ? 'Post' : 'Loading...')}
                        </button>
                    </div>
                </footer>
            )}
        </form>

      </motion.div>
    </motion.div>
  );
};

export default PostCreationModal;