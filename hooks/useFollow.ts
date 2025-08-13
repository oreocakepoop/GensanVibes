
import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { ref, onValue, runTransaction, set, off, push, get } from 'firebase/database';
import { User } from 'firebase/auth';
import type { UserProfile, Notification } from '../types';
import { NotificationType } from '../types';
import { addVibePoints, VibePoints } from '../data/gamification';

// Badge Awarding Logic
const checkAndAwardBadge = async (userId: string, badgeId: string) => {
    const badgeRef = ref(db, `users/${userId}/badges/${badgeId}`);
    const snapshot = await get(badgeRef);
    if (!snapshot.exists()) {
        await set(badgeRef, new Date().toISOString());
    }
};

const checkFollowBadges = async (userId: string, newFollowingCount: number) => {
    if (newFollowingCount >= 50) await checkAndAwardBadge(userId, 'social_butterfly');
    if (newFollowingCount >= 100) await checkAndAwardBadge(userId, 'people_person');
};


export const useFollow = (targetUserId?: string) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
        setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const disabled = !currentUser || !targetUserId || currentUser.uid === targetUserId;

  useEffect(() => {
    if (disabled) {
      setLoading(false);
      setIsFollowing(false);
      return;
    }

    setLoading(true);
    const followingRef = ref(db, `users/${currentUser.uid}/following/${targetUserId}`);
    
    const unsubscribe = onValue(followingRef, (snapshot) => {
      setIsFollowing(snapshot.exists());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, targetUserId, disabled]);

  const toggleFollow = useCallback(async () => {
    if (disabled || loading) return;

    setLoading(true);

    try {
        if (isFollowing) {
            // Unfollow
            await set(ref(db, `users/${currentUser.uid}/following/${targetUserId}`), null);
            await set(ref(db, `users/${targetUserId}/followers/${currentUser.uid}`), null);

            await runTransaction(ref(db, `users/${currentUser.uid}/followingCount`), (count) => Math.max(0, (count || 0) - 1));
            await runTransaction(ref(db, `users/${targetUserId}/followersCount`), (count) => Math.max(0, (count || 0) - 1));

        } else {
            // Follow
            await set(ref(db, `users/${currentUser.uid}/following/${targetUserId}`), true);
            await set(ref(db, `users/${targetUserId}/followers/${currentUser.uid}`), true);
            
            let newFollowingCount = 0;
            await runTransaction(ref(db, `users/${currentUser.uid}/followingCount`), (count) => {
                newFollowingCount = (count || 0) + 1;
                return newFollowingCount;
            });
            await runTransaction(ref(db, `users/${targetUserId}/followersCount`), (count) => (count || 0) + 1);
            
            // Award Vibe Points to the user being followed
            await addVibePoints(targetUserId!, VibePoints.USER_GETS_FOLLOWED);
            
            // Check for follow-related badges
            await checkFollowBadges(currentUser.uid, newFollowingCount);

            // Create notification for the user who was followed
            const notificationsRef = ref(db, `notifications/${targetUserId}`);
            const newNotificationRef = push(notificationsRef);
            const newNotification: Omit<Notification, 'id'> = {
                senderId: currentUser.uid,
                recipientId: targetUserId!,
                type: NotificationType.FOLLOW,
                createdAt: new Date().toISOString(),
                read: false
            };
            await set(newNotificationRef, newNotification);
        }
    } catch (error) {
        console.error("Failed to toggle follow state", error);
        // Revert loading state in case of error
        setLoading(false);
    }
    // The onValue listener will handle the final state update
  }, [isFollowing, loading, disabled, currentUser, targetUserId]);

  return { isFollowing, loading, toggleFollow, disabled };
};


// --- User Profile Hook ---
// New, simplified, and robust implementation to fix loading bugs.
export const useUserProfile = (userId?: string): UserProfile | null | undefined => {
    // State represents: undefined = loading, null = not found, UserProfile = found
    const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

    useEffect(() => {
        // If no userId is provided, there's nothing to fetch.
        if (!userId) {
            setProfile(undefined);
            return;
        }

        // Set state to loading whenever a new userId is provided.
        setProfile(undefined);

        const userRef = ref(db, `users/${userId}`);

        // Establish the real-time listener.
        const unsubscribe = onValue(userRef, 
            (snapshot) => {
                // Update state based on whether the profile exists.
                setProfile(snapshot.exists() ? snapshot.val() : null);
            }, 
            (error) => {
                // In case of error (e.g., permissions), log it and set profile to null.
                console.error(`Error fetching profile for ${userId}`, error);
                setProfile(null);
            }
        );

        // The cleanup function is called when the component unmounts or userId changes.
        // This is crucial to prevent memory leaks by removing the listener.
        return () => unsubscribe();

    }, [userId]); // This effect re-runs only when the userId prop changes.

    return profile;
};