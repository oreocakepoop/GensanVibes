
import React, { useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { ref, update } from 'firebase/database';
import { useNotifications } from '../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import type { View } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { iconUrls } from '../data/icons';

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: View) => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose, onNavigate }) => {
    const currentUser = auth.currentUser;
    const [notifications, loading] = useNotifications(currentUser?.uid);

    useEffect(() => {
        // Mark notifications as read when panel is opened
        if (isOpen && currentUser && notifications.length > 0) {
            const updates: {[key: string]: boolean} = {};
            notifications.forEach(notif => {
                if (!notif.read) {
                    updates[`notifications/${currentUser.uid}/${notif.id}/read`] = true;
                }
            });

            if (Object.keys(updates).length > 0) {
                update(ref(db), updates).catch(err => console.error("Failed to mark notifications as read", err));
            }
        }
    }, [isOpen, currentUser, notifications]);
    
    const handleNavigate = (view: View) => {
        onNavigate(view);
        onClose();
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-brand-surface rounded-xl shadow-2xl z-10 ring-1 ring-brand-border/50 transform-origin-top-right overflow-hidden flex flex-col max-h-[70vh]">
            <header className="p-4 border-b border-brand-border/80 shrink-0">
                <h3 className="font-bold text-brand-text text-lg">Notifications</h3>
            </header>
            
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-brand-text-secondary">Loading...</div>
                ) : notifications.length > 0 ? (
                     <div className="divide-y divide-brand-border/50">
                        {notifications.map(notif => (
                            <NotificationItem key={notif.id} notification={notif} onNavigate={handleNavigate} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                        <img src={iconUrls.bellLarge} alt="" className="w-16 h-16"/>
                        <p className="font-bold text-brand-text mt-4">No notifications yet</p>
                        <p className="text-sm text-brand-text-secondary mt-1">When you get likes, comments, or new followers, they'll show up here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPanel;
