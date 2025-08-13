

import React from 'react';
import { useUserProfile, useFollow } from '../hooks/useFollow';
import AvatarWithBorder from './AvatarWithBorder';
import { motion } from 'framer-motion';

export const UserListItemSkeleton: React.FC = () => {
    return (
      <div className="flex items-center gap-3 p-2 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-brand-border shrink-0"></div>
          <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-brand-border rounded w-2/3"></div>
              <div className="h-3 bg-brand-border rounded w-1/3"></div>
          </div>
          <div className="h-7 w-20 bg-brand-border rounded-full shrink-0"></div>
      </div>
    );
  };

const UserListItem: React.FC<{ userId: string, context?: string }> = ({ userId, context }) => {
  const profile = useUserProfile(userId);
  const { isFollowing, toggleFollow, loading, disabled } = useFollow(userId);

  // Render a skeleton while the profile is loading
  if (profile === undefined) {
    return <UserListItemSkeleton />;
  }

  // Render nothing if the profile doesn't exist (user was deleted)
  if (profile === null) {
    return null;
  }

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFollow();
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-bg transition-colors">
      <AvatarWithBorder
        seed={profile.avatarStyle || userId}
        alt={profile.username}
        vibePoints={profile.vibePoints || 0}
        selectedBorder={profile.selectedBorder}
        className="w-10 h-10"
      />
      <div className="flex-1">
        <p className="text-brand-text font-semibold text-sm">{profile.username}</p>
        {context ? (
            <p className="text-xs text-brand-text-secondary italic">{context}</p>
        ) : (
            <p className="text-xs text-brand-text-secondary">{profile.barangay}, {profile.city}</p>
        )}
      </div>
      {!disabled && (
        <motion.button
          onClick={handleFollowClick}
          disabled={loading}
          whileTap={{ scale: 0.95 }}
          className={`font-bold text-xs px-3 py-1.5 rounded-full transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed ${
            isFollowing
            ? 'bg-brand-border text-brand-text-secondary'
            : 'bg-brand-subtle text-brand-text'
          }`}
        >
          {loading ? '...' : (isFollowing ? 'Following' : 'Follow')}
        </motion.button>
      )}
    </div>
  );
};



export default UserListItem;