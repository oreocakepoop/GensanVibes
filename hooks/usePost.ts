
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import type { Post } from '../types';

export const usePost = (postId?: string): [Post | null, boolean] => {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!postId) {
            setPost(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const postRef = ref(db, `posts/${postId}`);
        
        const unsubscribe = onValue(postRef, (snapshot) => {
            if (snapshot.exists()) {
                setPost({ id: snapshot.key, ...snapshot.val() });
            } else {
                setPost(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [postId]);

    return [post, loading];
};
