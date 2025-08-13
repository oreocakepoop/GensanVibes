

import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { ref, query, orderByChild, equalTo, onValue, get } from 'firebase/database';
import type { Post, UserProfile, View, Badge } from '../types';
import PostComponent from './Post';
import ProfileSkeleton from './ProfileSkeleton';
import { useFollow } from '../hooks/useFollow';
import { AnimatePresence, motion } from 'framer-motion';
import EditAvatarModal from './EditAvatarModal';
import EditProfileModal from './EditProfileModal';
import FollowListModal from './FollowListModal';
import { iconUrls } from '../data/icons';
import { badges as allBadges } from '../data/badges';
import BadgeIcon from './BadgeIcon';
import AvatarWithBorder from './AvatarWithBorder';
import ProfileBorders from './ProfileBorders';


interface ProfilePageProps {
    userId: string;
    onNavigate: (view: View) => void;
    onRepost: (post: Post) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

const ProfilePage: React.FC<ProfilePageProps> = ({ userId, onNavigate, onRepost }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [modalState, setModalState] = useState<{isOpen: boolean; title: string; userIds: string[]}>({
    isOpen: false,
    title: '',
    userIds: [],
  });
  
  const currentUser = auth.currentUser;
  const isOwnProfile = currentUser?.uid === userId;
  const { isFollowing, toggleFollow, loading: followLoading, disabled: followDisabled } = useFollow(userId);

  useEffect(() => {
    let unsubscribePosts = () => {};
    let unsubscribeProfile = () => {};

    const fetchData = async () => {
        setLoading(true);
        setError('');
        
        try {
            // Fetch profile with real-time updates
            const userRef = ref(db, `users/${userId}`);
            unsubscribeProfile = onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    setProfile(snapshot.val());
                } else {
                    setError('Profile not found.');
                    setLoading(false);
                }
            }, (err) => {
                console.error(err);
                setError('Failed to fetch profile.');
                setLoading(false);
            });


            // Fetch posts
            const postsQuery = query(
                ref(db, 'posts'),
                orderByChild('userId'),
                equalTo(userId)
            );
            
            unsubscribePosts = onValue(postsQuery, (snapshot) => {
                const data = snapshot.val();
                const postsArray: Post[] = data 
                    ? Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse()
                    : [];
                setPosts(postsArray);
                setLoading(false);
            }, (err) => {
                console.error(err);
                setError("Failed to fetch posts.");
                setLoading(false);
            });

        } catch(e: any) {
            setError(e.message || "Failed to fetch data.");
            setLoading(false);
        }
    }
    
    fetchData();

    return () => {
        unsubscribePosts();
        unsubscribeProfile();
    }
  }, [userId]);

  const showFollowList = async (listType: 'followers' | 'following') => {
    try {
        const listRef = ref(db, `users/${userId}/${listType}`);
        const snapshot = await get(listRef);
        const ids = snapshot.exists() ? Object.keys(snapshot.val()) : [];
        setModalState({
            isOpen: true,
            title: listType.charAt(0).toUpperCase() + listType.slice(1),
            userIds: ids
        });
    } catch (error) {
        console.error(`Failed to fetch ${listType}`, error);
        alert(`Could not load ${listType} list.`);
    }
  };


  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return <div className="w-full bg-brand-surface border border-brand-accent rounded-xl p-8 text-center text-brand-accent">{error}</div>;
  }
  
  if (!profile) {
    return <div className="w-full bg-brand-surface border border-brand-border rounded-xl p-8 text-center text-brand-text-secondary">Could not load profile.</div>
  }

  const handleFollowClick = () => {
    if (!currentUser) {
        alert("You must be logged in to follow users.");
        return;
    }
    toggleFollow();
  }

  const handleMessageClick = () => {
    if (!currentUser) {
        alert("You must be logged in to message users.");
        return;
    }
    // Create a deterministic conversation ID
    const conversationId = [currentUser.uid, userId].sort().join('_');
    onNavigate({ type: 'dmConversation', conversationId });
  };

  const avatarSeed = profile.avatarStyle || userId;
  
  const earnedBadgeIds = new Set(profile.badges ? Object.keys(profile.badges) : []);
  const allBadgesSorted = [...allBadges].sort((a, b) => a.tier - b.tier);


  return (
    <>
    <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl overflow-hidden">
        {/* Profile Header */}
        <div className="p-8 border-b border-brand-border bg-brand-bg/50">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <div className="relative group shrink-0">
                    <AvatarWithBorder
                        seed={avatarSeed}
                        alt={profile.username}
                        vibePoints={profile.vibePoints || 0}
                        selectedBorder={profile.selectedBorder}
                        className="w-24 h-24 sm:w-28 sm:h-28 shadow-lg"
                    />
                    {isOwnProfile && (
                         <button 
                            onClick={() => setIsEditingAvatar(true)}
                            className="absolute inset-0 bg-brand-text/50 rounded-full flex items-center justify-center text-brand-surface opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            aria-label="Edit avatar"
                        >
                            <img src={iconUrls.editPencil} alt="" className="w-8 h-8"/>
                        </button>
                    )}
                </div>

                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-brand-text font-serif">{profile.username}</h1>
                    <div className="text-brand-text-secondary mt-1 text-sm flex items-center justify-center sm:justify-start flex-wrap gap-x-1">
                        <span>From</span>
                        {profile.barangay && (
                            <button onClick={() => onNavigate({ type: 'dashboard', filter: { type: 'barangay', name: profile.barangay! } })} className="font-semibold text-brand-text hover:underline">{profile.barangay}</button>
                        )}
                        {profile.city && (
                            <>
                                <span>,</span>
                                <span className="font-semibold text-brand-text ml-1">{profile.city}</span>
                            </>
                        )}
                    </div>
                    {profile.bio && <p className="mt-3 text-brand-text-secondary max-w-lg">{profile.bio}</p>}

                    <div className="mt-4 flex items-center justify-center sm:justify-start gap-6 text-sm">
                        <button onClick={() => showFollowList('followers')} className="hover:underline">
                            <strong className="text-brand-text">{profile.followersCount?.toLocaleString() || 0}</strong>
                            <span className="text-brand-text-secondary ml-1">Followers</span>
                        </button>
                         <button onClick={() => showFollowList('following')} className="hover:underline">
                            <strong className="text-brand-text">{profile.followingCount?.toLocaleString() || 0}</strong>
                            <span className="text-brand-text-secondary ml-1">Following</span>
                        </button>
                    </div>

                    <div className="mt-4 flex justify-center sm:justify-start items-center gap-2">
                        {isOwnProfile ? (
                            <button 
                                onClick={() => setIsEditingProfile(true)}
                                className="bg-brand-border hover:bg-brand-subtle text-brand-text font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <>
                            <button 
                                onClick={handleFollowClick}
                                disabled={followLoading || followDisabled}
                                className={`font-bold py-2 px-4 rounded-lg text-sm transition-all disabled:opacity-50 w-28 ${
                                    isFollowing 
                                    ? 'bg-brand-border text-brand-text-secondary hover:bg-brand-subtle'
                                    : 'bg-brand-accent text-brand-surface hover:opacity-90'
                                }`}
                            >
                                {followLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
                            </button>
                            <button
                                onClick={handleMessageClick}
                                disabled={followDisabled}
                                className="bg-brand-border hover:bg-brand-subtle text-brand-text font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                            >
                                Message
                            </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Vibe-setter Badges */}
        <div className="p-6 border-b border-brand-border">
            <h3 className="text-base font-bold text-brand-text mb-3">Vibe-setter Badges</h3>
            <div className="flex flex-wrap items-center gap-4">
                {allBadgesSorted.map(badge => (
                    <BadgeIcon 
                        key={badge.id} 
                        badge={badge} 
                        isAchieved={earnedBadgeIds.has(badge.id)} 
                    />
                ))}
            </div>
        </div>

        {/* Profile Borders Showcase */}
        <div className="border-b border-brand-border">
          <ProfileBorders userProfile={profile} isOwnProfile={isOwnProfile} userId={userId} />
        </div>


        {/* Posts */}
        <div className="flex flex-col">
            {posts.length > 0 ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="divide-y divide-brand-border">
                {posts.map(post => (
                    <motion.div key={post.id} variants={itemVariants}>
                        <PostComponent post={post} onNavigate={onNavigate} onRepost={onRepost}/>
                    </motion.div>
                ))}
                </motion.div>
            ) : (
                <div className="p-8 text-center text-brand-text-secondary">
                    <p className="font-semibold text-lg">{profile.username} hasn't posted anything yet.</p>
                </div>
            )}
        </div>
    </div>
    
    {/* Modals */}
    <AnimatePresence>
        {isEditingAvatar && <EditAvatarModal isOpen={isEditingAvatar} onClose={() => setIsEditingAvatar(false)} currentSeed={profile.avatarStyle || userId} userId={userId}/>}
        {isEditingProfile && <EditProfileModal isOpen={isEditingProfile} onClose={() => setIsEditingProfile(false)} userProfile={profile} userId={userId}/>}
        {modalState.isOpen && <FollowListModal isOpen={modalState.isOpen} onClose={() => setModalState(s => ({...s, isOpen: false}))} title={modalState.title} userIds={modalState.userIds} />}
    </AnimatePresence>
    </>
  );
};

export default ProfilePage;