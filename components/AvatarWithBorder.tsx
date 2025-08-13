import React from 'react';
import Multiavatar from './Multiavatar';
import { getTierInfo } from '../data/gamification';

interface AvatarWithBorderProps {
  seed: string;
  vibePoints: number;
  selectedBorder?: string;
  alt: string;
  className?: string;
}

const AvatarWithBorder: React.FC<AvatarWithBorderProps> = ({ seed, vibePoints, selectedBorder, alt, className }) => {
  const automaticTier = getTierInfo(vibePoints);
  const borderClass = selectedBorder ?? automaticTier.borderColorClass;

  // The className on the wrapper div will control size (w-10, h-10, etc)
  return (
    <div className={`rounded-full transition-all duration-300 ${borderClass} ${className}`}>
      <Multiavatar seed={seed} alt={alt} className="w-full h-full rounded-full object-cover bg-brand-border" />
    </div>
  );
};

export default AvatarWithBorder;