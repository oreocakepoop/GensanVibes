
import React, { useState } from 'react';
import type { Badge } from '../types';
import { iconUrls } from '../data/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface BadgeIconProps {
  badge: Badge;
  isAchieved: boolean;
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ badge, isAchieved }) => {
  const [isHovered, setIsHovered] = useState(false);
  const iconName = badge.iconName as keyof typeof iconUrls;
  const iconUrl = iconUrls[iconName] || iconUrls.badgeDefault;

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex justify-center ${!isAchieved ? 'opacity-50 grayscale' : ''}`}
      whileHover={{ scale: 1.1, y: -2 }}
      title={`${badge.name}${!isAchieved ? ' (Not achieved)' : ''}`}
    >
      <img src={iconUrl} alt={badge.name} className="w-12 h-12" />
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-xs p-2.5 bg-brand-text text-brand-surface rounded-lg shadow-lg z-10 text-center"
          >
            <p className="font-bold text-sm whitespace-nowrap">{badge.name}</p>
            <p className="text-xs text-brand-surface/80 whitespace-nowrap">{badge.description}</p>
            {!isAchieved && <p className="text-xs font-semibold text-yellow-300 mt-1">Not Achieved</p>}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-brand-text"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BadgeIcon;
