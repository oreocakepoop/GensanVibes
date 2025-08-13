
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { ref, onValue, query } from 'firebase/database';
import PostCreator from './PostCreator';
import PostComponent from './Post';
import PostSkeleton from './PostSkeleton';
import { Post, PostType, View } from '../types';
import PostCreatorSkeleton from './PostCreatorSkeleton';
import { motion } from 'framer-motion';
import BarangayFeedHeader from './BarangayFeedHeader';

interface DashboardProps {
    onSelectPostType: (postType: PostType) => void;
    onNavigate: (view: View) => void;
    onRepost: (post: Post) => void;
    filter?: { type: 'explore' } | { type: 'tag', value: string } | { type: 'barangay', name: string };
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


const Dashboard: React.FC<DashboardProps> = ({ onSelectPostType, onNavigate, onRepost, filter }) => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  
  const currentUser = auth.currentUser;

  // Real-time listener for all posts
  useEffect(() => {
    setLoadingPosts(true);
    const postsQuery = query(ref(db, 'posts'));

    const unsubscribe = onValue(postsQuery, (snapshot) => {
        const data = snapshot.val();
        const postsArray: Post[] = data ? Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })).reverse() : [];
        setAllPosts(postsArray);
        setLoadingPosts(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for user's following list
  useEffect(() => {
    if (!currentUser) {
        setFollowingIds(new Set());
        setLoadingFollowing(false);
        return;
    }
    setLoadingFollowing(true);
    const followingRef = ref(db, `users/${currentUser.uid}/following`);
    const unsubscribe = onValue(followingRef, (snapshot) => {
        const followingData = snapshot.val();
        const ids = new Set(followingData ? Object.keys(followingData) : []);
        ids.add(currentUser.uid); // Always include own posts
        setFollowingIds(ids);
        setLoadingFollowing(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Client-side filtering effect
  useEffect(() => {
    let postsToDisplay = allPosts;

    if (filter?.type === 'tag') {
        postsToDisplay = allPosts.filter(p => p.tags?.includes(filter.value));
    } else if (filter?.type === 'barangay') {
        postsToDisplay = allPosts.filter(p => p.barangay === filter.name);
    } else if (!filter) { // Curated feed (default)
        if (currentUser) {
            postsToDisplay = allPosts.filter(p => followingIds.has(p.userId));
        } else {
            postsToDisplay = [];
        }
    }
    // For 'explore' filter, no filtering is needed, all posts are shown.

    setPosts(postsToDisplay);
  }, [allPosts, followingIds, filter, currentUser]);

  const loading = loadingPosts || (!filter && loadingFollowing);
  
  const renderHeader = () => {
    if (filter?.type === 'barangay') {
      return <BarangayFeedHeader barangayName={filter.name} onNavigate={onNavigate} />;
    }
    if (filter?.type === 'tag') {
      return (
        <div className="p-4 border-b border-brand-border text-2xl font-bold text-brand-text bg-brand-surface font-serif">
          #{filter.value}
        </div>
      );
    }
    if (filter?.type === 'explore') {
      return (
        <div className="p-4 border-b border-brand-border text-2xl font-bold text-brand-text bg-brand-surface font-serif">
          Explore
        </div>
      );
    }
    return <PostCreator onSelectPostType={onSelectPostType} />;
  }

  return (
    <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl">
      
      {loading ? (
        <>
          {/* Render skeleton for post creator only on main dashboard view */}
          {!filter && <PostCreatorSkeleton />}
          <div className="flex flex-col">
              {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
          </div>
        </>
      ) : (
        <>
          {renderHeader()}
          {posts.length === 0 ? (
            <div className="p-8 text-center text-brand-text-secondary">
              <h3 className="text-xl font-bold text-brand-text font-serif">It's quiet in here...</h3>
              <p className="mt-2">
                {filter ? 'No posts found for this view.' : 'Follow some people to see their posts here!'}
              </p>
            </div>
          ) : (
             <motion.div 
                className="flex flex-col"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
              {posts.map((post) => (
                <motion.div key={post.id} variants={itemVariants}>
                  <PostComponent post={post} onNavigate={onNavigate} onRepost={onRepost} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
