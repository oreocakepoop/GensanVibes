import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase.ts';
import { ref, query, orderByChild, equalTo, onValue, get, set } from 'firebase/database';
import type { Post, UserProfile, View } from '../types.ts';
import PostComponent from './Post.tsx';
import BarangayHubSkeleton from './BarangayHubSkeleton.tsx';
import Multiavatar from './Multiavatar.tsx';
import { motion } from 'framer-motion';
import { iconUrls } from '../data/icons.ts';

// Badge Awarding Logic
const checkAndAwardBadge = async (userId: string, badgeId: string) => {
    const badgeRef = ref(db, `users/${userId}/badges/${badgeId}`);
    const snapshot = await get(badgeRef);
    if (!snapshot.exists()) {
        await set(badgeRef, new Date().toISOString());
    }
};

interface BarangayHubPageProps {
  barangayName: string;
  onNavigate: (view: View) => void;
  onRepost: (post: Post) => void;
}

const VibeSetterCard: React.FC<{ user: UserProfile & { id: string }, onNavigate: (view: View) => void }> = ({ user, onNavigate }) => {
    const avatarSeed = user.avatarStyle || user.id;

    return (
        <motion.div
            className="flex-shrink-0 w-32"
            whileHover={{ y: -4 }}
        >
            <button onClick={() => onNavigate({type: 'profile', userId: user.id})} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-brand-bg/80 transition-colors w-full text-center">
                <Multiavatar seed={avatarSeed} alt={user.username} className="w-16 h-16 rounded-full object-cover bg-brand-border" />
                <div className="w-full">
                    <p className="font-bold text-sm text-brand-text truncate">{user.username}</p>
                    <p className="text-xs text-brand-text-secondary">{(user.followersCount || 0).toLocaleString()} followers</p>
                </div>
            </button>
        </motion.div>
    );
};

const BarangayHubPage: React.FC<BarangayHubPageProps> = ({ barangayName, onNavigate, onRepost }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [vibeSetters, setVibeSetters] = useState<(UserProfile & {id: string})[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    // Fetch posts from this barangay
    const postsQuery = query(
      ref(db, 'posts'),
      orderByChild('barangay'),
      equalTo(barangayName)
    );
    const unsubscribePosts = onValue(postsQuery, (snapshot) => {
      const data = snapshot.val();
      const postsArray: Post[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse() : [];
      setPosts(postsArray);
    }, (err) => {
      console.error(err);
      setError('Failed to fetch posts.');
    });

    // Fetch users to determine Vibe-setters
    const usersQuery = query(
        ref(db, 'users'),
        orderByChild('barangay'),
        equalTo(barangayName)
    );
    const unsubscribeUsers = onValue(usersQuery, (snapshot) => {
        const usersData = snapshot.val();
        if (usersData) {
            const usersArray: (UserProfile & {id: string})[] = Object.keys(usersData).map(id => ({ ...usersData[id], id }));
            const sortedUsers = usersArray.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
            setVibeSetters(sortedUsers.slice(0, 5)); // Get top 5
        }
        // Set loading to false only after both queries have had a chance to run
        setLoading(false);
    }, (err) => {
        console.error(err);
        setError('Failed to fetch users.');
        setLoading(false);
    });

    const checkAndSetExplorer = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser || !barangayName) return;

        try {
            const badgeRef = ref(db, `users/${currentUser.uid}/badges/the_explorer`);
            const badgeSnapshot = await get(badgeRef);
            if (badgeSnapshot.exists()) return; // Already has badge

            const visitedBarangayRef = ref(db, `users/${currentUser.uid}/visitedBarangays/${barangayName}`);
            const visitedSnapshot = await get(visitedBarangayRef);

            if (!visitedSnapshot.exists()) {
                await set(visitedBarangayRef, true);
                const allVisitedRef = ref(db, `users/${currentUser.uid}/visitedBarangays`);
                const allVisitedSnapshot = await get(allVisitedRef);
                if (allVisitedSnapshot.exists() && allVisitedSnapshot.size >= 5) {
                    await checkAndAwardBadge(currentUser.uid, 'the_explorer');
                }
            }
        } catch(e) {
            console.error("Error checking explorer badge:", e);
        }
    };
    checkAndSetExplorer();


    return () => {
      unsubscribePosts();
      unsubscribeUsers();
    };
  }, [barangayName]);

  if (loading) {
    return <BarangayHubSkeleton />;
  }

  if (error) {
    return <div className="w-full bg-brand-surface border border-brand-accent rounded-xl p-8 text-center text-brand-accent">{error}</div>;
  }
  
  return (
    <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl">
        {/* Hub Header */}
        <div className="p-6 border-b border-brand-border bg-brand-bg/50">
            <h1 className="text-3xl font-bold text-brand-text font-serif">Barangay {barangayName}</h1>
            <p className="text-base text-brand-text-secondary mt-1">General Santos City</p>
        </div>

        {/* Vibe-setters section */}
        {vibeSetters.length > 0 && (
            <div className="p-4 border-b border-brand-border">
                <h2 className="text-base font-bold text-brand-text mb-2 px-2">Top Vibe-setters</h2>
                <div className="flex gap-2 -mx-2 overflow-x-auto pb-2">
                    {vibeSetters.map(user => <VibeSetterCard key={user.id} user={user} onNavigate={onNavigate} />)}
                </div>
            </div>
        )}

        {/* Post Feed */}
        {posts.length === 0 ? (
            <div className="p-8 text-center text-brand-text-secondary">
                <h3 className="text-xl font-bold text-brand-text font-serif">It's quiet in here...</h3>
                <p className="mt-2">No posts from {barangayName} yet. Be the first to vibe!</p>
            </div>
        ) : (
            <div className="flex flex-col">
                {posts.map((post) => (
                    <PostComponent key={post.id} post={post} onNavigate={onNavigate} onRepost={onRepost} />
                ))}
            </div>
        )}
    </div>
  );
};

export default BarangayHubPage;