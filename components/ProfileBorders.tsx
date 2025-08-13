
import React, { useState } from 'react';
import { VibeTiers, getTierInfo } from '../data/gamification';
import { UserProfile } from '../types';
import Multiavatar from './Multiavatar';
import { iconUrls } from '../data/icons';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { ref, update } from 'firebase/database';

interface ProfileBordersProps {
  userProfile: UserProfile;
  isOwnProfile: boolean;
  userId: string;
}

const ProfileBorders: React.FC<ProfileBordersProps> = ({ userProfile, isOwnProfile, userId }) => {
  const [loading, setLoading] = useState<string | null>(null); // Track which border is being saved
  const currentUserPoints = userProfile.vibePoints || 0;

  const automaticTier = getTierInfo(currentUserPoints);
  const currentSelectedBorder = userProfile.selectedBorder ?? automaticTier.borderColorClass;

  const handleSelectBorder = async (borderClass: string) => {
    if (!isOwnProfile || !userId) return;
    setLoading(borderClass);
    try {
      const userRef = ref(db, `users/${userId}`);
      await update(userRef, { selectedBorder: borderClass });
    } catch (error) {
      console.error("Failed to update border:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-base font-bold text-brand-text mb-4">Profile Borders</h3>
      <p className="text-sm text-brand-text-secondary mb-4 -mt-2">
        {isOwnProfile ? "Select a border you've unlocked to show it off!" : "Check out all the borders you can unlock by earning Vibe Points."}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {VibeTiers.map((tier, index) => {
          const isUnlocked = currentUserPoints >= tier.minVP;

          let progress = 0;
          if (!isUnlocked) {
            const prevTierVP = VibeTiers[index - 1]?.minVP || 0;
            const tierRange = tier.minVP - prevTierVP;
            const progressInRange = currentUserPoints - prevTierVP;
            if (tierRange > 0) {
              progress = Math.max(0, Math.min(100, (progressInRange / tierRange) * 100));
            }
          }

          const isSelected = currentSelectedBorder === tier.borderColorClass;

          return (
            <div key={tier.name} className="relative flex flex-col items-center p-3 bg-brand-bg rounded-xl border border-brand-border/80 text-center">
              <div className={`rounded-full transition-all duration-300 ${tier.borderColorClass}`}>
                <div className="w-16 h-16 p-1">
                  <Multiavatar seed={`border_preview_${index}`} alt={tier.name} className="w-full h-full rounded-full object-cover bg-brand-border" />
                </div>
              </div>
              <p className="font-bold text-sm text-brand-text mt-2 h-10 flex items-center justify-center">{tier.name}</p>
              <p className="text-xs text-brand-text-secondary -mt-2">{tier.minVP.toLocaleString()} VP</p>
              
              <div className="mt-auto pt-2 w-full">
                {!isUnlocked ? (
                  <div className="w-full">
                    <div className="progress-bar">
                      <motion.div
                        className="progress-bar-inner"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ) : isOwnProfile ? (
                  isSelected ? (
                    <span className="font-bold text-sm text-brand-subtle px-3 py-1.5 rounded-full">Selected</span>
                  ) : (
                    <button
                      onClick={() => handleSelectBorder(tier.borderColorClass)}
                      disabled={loading !== null}
                      className="font-bold text-sm text-brand-accent bg-brand-accent-light px-3 py-1.5 rounded-full hover:bg-brand-subtle hover:text-brand-text transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                      {loading === tier.borderColorClass ? '...' : 'Select'}
                    </button>
                  )
                ) : (
                  <span className="font-bold text-sm text-brand-accent/70 px-3 py-1.5 rounded-full">Unlocked</span>
                )}
              </div>

              {!isUnlocked && (
                <div className="locked-overlay">
                  <img src={iconUrls.lock} alt="Locked" className="w-8 h-8 opacity-75"/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileBorders;
