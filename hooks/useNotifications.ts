
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import type { Notification } from '../types';

export const useNotifications = (userId?: string): [Notification[], boolean] => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const notificationsRef = query(ref(db, `notifications/${userId}`), orderByChild('createdAt'));
        
        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            const data = snapshot.val();
            const loadedNotifications: Notification[] = data
                ? Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse()
                : [];
            setNotifications(loadedNotifications);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return [notifications, loading];
};


export const useUnreadNotificationsCount = (userId?: string): number => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!userId) {
            setCount(0);
            return;
        }

        const unreadNotifsQuery = query(
            ref(db, `notifications/${userId}`),
            orderByChild('read'),
            equalTo(false)
        );

        const unsubscribe = onValue(unreadNotifsQuery, (snapshot) => {
            setCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [userId]);

    return count;
};
