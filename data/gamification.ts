import { db } from '../firebase';
import { ref, runTransaction } from 'firebase/database';

export const VibePoints = {
  POST_CREATE: 25,
  POST_RECEIVE_LIKE: 5,
  POST_RECEIVE_COMMENT: 10,
  COMMENT_CREATE: 5,
  USER_GETS_FOLLOWED: 15,
};

export const VibeTiers = [
  { name: 'Newcomer', minVP: 0, borderColorClass: 'border-tier-0', isActive: true },
  { name: 'Local Viber', minVP: 250, borderColorClass: 'border-tier-1', isActive: true },
  { name: 'Barangay Star', minVP: 1500, borderColorClass: 'border-tier-2', isActive: true },
  { name: 'Vibe Captain', minVP: 3000, borderColorClass: 'border-tier-3', isActive: true },
  { name: 'Gensan Legend', minVP: 5000, borderColorClass: 'border-tier-4', isActive: true },
  { name: "Tuna's Pride", minVP: 10000, borderColorClass: 'border-tier-5', isActive: true },
  { name: 'Sarangani Soul', minVP: 20000, borderColorClass: 'border-tier-6', isActive: true },
  { name: 'Mindanao Luminary', minVP: 35000, borderColorClass: 'border-tier-7', isActive: true },
  { name: 'SOX Icon', minVP: 50000, borderColorClass: 'border-tier-8', isActive: true },
  { name: 'The Vibe Pinnacle', minVP: 75000, borderColorClass: 'border-tier-9', isActive: true },
];

export const getTierInfo = (points: number) => {
    let currentTier = VibeTiers[0];
    for (const tier of VibeTiers) {
        if (points >= tier.minVP) {
            currentTier = tier;
        }
    }
    return currentTier;
};

export const addVibePoints = async (userId: string, points: number) => {
    if (!userId || !points) return;
    const vibePointsRef = ref(db, `users/${userId}/vibePoints`);
    try {
        await runTransaction(vibePointsRef, (currentPoints) => {
            return (currentPoints || 0) + points;
        });
    } catch (error) {
        console.error(`Failed to add ${points} VP to user ${userId}:`, error);
    }
};