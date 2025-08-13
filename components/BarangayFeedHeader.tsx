

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import type { UserProfile, View } from '../types';
import BarangayFeedHeaderSkeleton from './BarangayFeedHeaderSkeleton';
import Multiavatar from './Multiavatar';
import { motion } from 'framer-motion';
import { iconUrls } from '../data/icons';

interface BarangayFeedHeaderProps {
  barangayName: string;
  onNavigate: (view: View) => void;
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

const BarangayFeedHeader: React.FC<BarangayFeedHeaderProps> = ({ barangayName, onNavigate }) => {
  const [vibeSetters, setVibeSetters] = useState<(UserProfile & {id: string})[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

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
        setLoading(false);
    }, (err) => {
        console.error(err);
        setLoading(false);
    });

    return () => unsubscribeUsers();
  }, [barangayName]);

  if (loading) {
    return <BarangayFeedHeaderSkeleton />;
  }
  
  return (
    <div className="border-b border-brand-border">
        {/* Hub Header */}
        <div className="p-6 bg-brand-bg/50 flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-brand-text font-serif">Barangay {barangayName}</h1>
                <p className="text-base text-brand-text-secondary mt-1">General Santos City</p>
            </div>
            <button
                onClick={() => onNavigate({ type: 'barangayChat', barangayName })}
                className="flex items-center gap-2 bg-brand-accent text-brand-surface font-bold py-2 px-4 rounded-lg text-sm transition-opacity hover:opacity-90"
            >
                <img src={iconUrls.chatBubble} alt="" className="w-5 h-5" />
                <span>Chika Corner</span>
            </button>
        </div>

        {/* Vibe-setters section */}
        {vibeSetters.length > 0 && (
            <div className="p-4">
                <h2 className="text-base font-bold text-brand-text mb-2 px-2">Top Vibe-setters</h2>
                <div className="flex gap-2 -mx-2 overflow-x-auto pb-2">
                    {vibeSetters.map(user => <VibeSetterCard key={user.id} user={user} onNavigate={onNavigate} />)}
                </div>
            </div>
        )}
    </div>
  );
};

export default BarangayFeedHeader;