
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue } from 'firebase/database';
import UserListItem, { UserListItemSkeleton } from './UserListItem';
import type { UserProfile } from '../types';

// Helper to shuffle and slice an array
const shuffleAndSlice = <T,>(array: T[], count: number): T[] => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const UserSuggestions: React.FC = () => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<Record<string, UserProfile>>({});
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    const currentUser = auth.currentUser;

    useEffect(() => {
        // Real-time listener for all users
        const usersRef = ref(db, 'users');
        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            setAllUsers(snapshot.val() || {});
        });

        // Real-time listener for current user's following list
        let unsubscribeFollowing = () => {};
        if (currentUser) {
            const followingRef = ref(db, `users/${currentUser.uid}/following`);
            unsubscribeFollowing = onValue(followingRef, (snapshot) => {
                const followingData = snapshot.val() || {};
                setFollowingIds(new Set(Object.keys(followingData)));
            });
        }
        
        return () => {
            unsubscribeUsers();
            unsubscribeFollowing();
        };
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || Object.keys(allUsers).length === 0) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const exclusionIds = new Set(followingIds);
        exclusionIds.add(currentUser.uid);

        const allUserProfiles: (UserProfile & { id: string })[] = Object.keys(allUsers)
            .map(id => ({ ...allUsers[id], id }));

        const potentialSuggestions = allUserProfiles.filter(user =>
            !exclusionIds.has(user.id) && user.username && user.username.trim() !== ''
        );
        
        if (potentialSuggestions.length === 0) {
            setSuggestions([]);
            setLoading(false);
            return;
        }

        let finalSuggestions: string[] = [];
        
        // Tier 1: Suggest users from the same barangay
        const currentUserProfile = allUsers[currentUser.uid];
        if (currentUserProfile?.barangay) {
            const localSuggestions = potentialSuggestions.filter(
                user => user.barangay === currentUserProfile.barangay
            );
            if (localSuggestions.length > 0) {
                finalSuggestions = shuffleAndSlice(localSuggestions, 3).map(u => u.id);
            }
        }

        // Tier 2: Fallback to general suggestions if no local ones found
        if (finalSuggestions.length === 0) {
            finalSuggestions = shuffleAndSlice(potentialSuggestions, 3).map(u => u.id);
        }

        setSuggestions(finalSuggestions);
        setLoading(false);

    }, [allUsers, followingIds, currentUser]);


    if (loading) {
        return (
            <div className="flex flex-col gap-2">
                {[...Array(3)].map((_, i) => <UserListItemSkeleton key={i} />)}
            </div>
        );
    }

    if (suggestions.length === 0) {
        return (
            <div className="text-center text-brand-text-secondary text-sm py-4">
                <p>No new people to suggest right now.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {suggestions.map((id) => (
                <UserListItem key={id} userId={id} />
            ))}
        </div>
    );
};

export default UserSuggestions;
