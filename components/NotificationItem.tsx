
import React from 'react';
import type { Notification, View } from '../types.ts';
import { NotificationType } from '../types.ts';
import { useUserProfile } from '../hooks/useFollow.ts';
import Multiavatar from './Multiavatar.tsx';
import { motion } from 'framer-motion';

interface NotificationItemProps {
    notification: Notification;
    onNavigate: (view: View) => void;
}

// Helper function from CommentSection
const formatDistanceToNow = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return "just now";
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;

    const years = Math.floor(days / 365);
    return `${years}y`;
};


const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onNavigate }) => {
    const senderProfile = useUserProfile(notification.senderId);

    if (!senderProfile) {
        // Skeleton or minimal loading state
        return (
            <div className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-brand-border shrink-0"></div>
                <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-brand-border rounded w-2/3"></div>
                    <div className="h-3 bg-brand-border rounded w-1/3"></div>
                </div>
            </div>
        );
    }
    
    const senderName = <strong className="font-bold">{senderProfile.username}</strong>;
    let message: React.ReactNode;
    let action: () => void;

    const navigateToPost = () => {
        if (notification.postId) {
            onNavigate({ type: 'post', postId: notification.postId });
        }
    };
    const navigateToSenderProfile = () => onNavigate({ type: 'profile', userId: notification.senderId });

    switch (notification.type) {
        case NotificationType.LIKE:
            message = <> {senderName} liked your post.</>;
            action = navigateToPost;
            break;
        case NotificationType.COMMENT:
            message = <> {senderName} commented on your post.</>;
            action = navigateToPost;
            break;
        case NotificationType.FOLLOW:
            message = <> {senderName} started following you.</>;
            action = navigateToSenderProfile;
            break;
        case NotificationType.REPOST:
            message = <> {senderName} re-vibed your post.</>;
            action = navigateToPost;
            break;
        default:
            return null;
    }
    
    const avatarSeed = senderProfile.avatarStyle || notification.senderId;

    return (
        <motion.button 
            onClick={action}
            className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-brand-bg transition-colors"
            whileHover={{ x: 2 }}
        >
            <div className="relative shrink-0 mt-0.5">
                <Multiavatar seed={avatarSeed} className="w-10 h-10 rounded-full" />
                {!notification.read && (
                     <span className="absolute -top-0.5 -right-0.5 block h-3 w-3 rounded-full bg-brand-accent ring-2 ring-brand-surface" />
                )}
            </div>
            <div className="flex-1">
                <p className="text-sm text-brand-text leading-tight">{message}</p>
                <p className="text-xs text-brand-text-secondary mt-0.5">{formatDistanceToNow(notification.createdAt)}</p>
            </div>
        </motion.button>
    );
};

export default NotificationItem;