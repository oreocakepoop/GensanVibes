import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { ref, query, onValue, push, set, orderByChild, limitToLast, runTransaction, get } from 'firebase/database';
import type { View, ChatMessage } from '../types';
import { useUserProfile } from '../hooks/useFollow';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessageBubble from './ChatMessageBubble';
import { iconUrls } from '../data/icons';
import PostSkeleton from './PostSkeleton';

// Badge Awarding Logic
const checkAndAwardBadge = async (userId: string, badgeId: string) => {
    const badgeRef = ref(db, `users/${userId}/badges/${badgeId}`);
    const snapshot = await get(badgeRef);
    if (!snapshot.exists()) {
        await set(badgeRef, new Date().toISOString());
    }
};

const checkChatBadges = async (userId: string) => {
    const chatCountRef = ref(db, `users/${userId}/barangayChatMessagesCount`);
    let newTotalMessages = 0;
    await runTransaction(chatCountRef, (count) => {
        newTotalMessages = (count || 0) + 1;
        return newTotalMessages;
    });

    if (newTotalMessages >= 50) {
        await checkAndAwardBadge(userId, 'chika_champion');
    }
};

interface BarangayChatPageProps {
  barangayName: string;
  onNavigate: (view: View) => void;
}

const BarangayChatPage: React.FC<BarangayChatPageProps> = ({ barangayName, onNavigate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUser = auth.currentUser;
  const currentUserProfile = useUserProfile(currentUser?.uid);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setLoading(true);
    const chatRef = query(
        ref(db, `barangayChats/${barangayName}/messages`),
        orderByChild('createdAt'),
        limitToLast(50) // Load last 50 messages
    );

    const unsubscribe = onValue(chatRef, (snapshot) => {
        const data = snapshot.val();
        const messagesArray: ChatMessage[] = data 
            ? Object.keys(data).map(key => ({ id: key, ...data[key] }))
            : [];
        setMessages(messagesArray);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [barangayName]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUserProfile || !newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
        const messagesRef = ref(db, `barangayChats/${barangayName}/messages`);
        const newMessageRef = push(messagesRef);

        const messageData: Omit<ChatMessage, 'id'> = {
            userId: currentUser.uid,
            text: newMessage.trim(),
            createdAt: new Date().toISOString(),
            username: currentUserProfile.username,
            avatarStyle: currentUserProfile.avatarStyle,
        };

        await set(newMessageRef, messageData);
        setNewMessage('');
        await checkChatBadges(currentUser.uid);
    } catch(error) {
        console.error("Error sending message:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl flex flex-col h-[calc(100vh-120px)]">
      <header className="p-4 border-b border-brand-border bg-brand-bg/80 flex items-center shrink-0">
        <button onClick={() => onNavigate({type: 'dashboard', filter: {type: 'barangay', name: barangayName }})} className="p-2 rounded-full hover:bg-brand-border mr-2">
            <img src={iconUrls.arrowLeft} alt="Back" className="w-6 h-6"/>
        </button>
        <div>
            <h1 className="text-lg font-bold text-brand-text font-serif">Chika Corner: {barangayName}</h1>
            <p className="text-sm text-brand-text-secondary">Public chat for residents and friends</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <PostSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-brand-text-secondary">
            <p>No messages yet. Start the chika!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <ChatMessageBubble message={msg} isOwnMessage={msg.userId === currentUser?.uid} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t border-brand-border shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={currentUser ? `Message as ${currentUserProfile?.username}` : "You must be logged in to chat"}
                className="w-full h-11 px-4 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                disabled={!currentUser || isSubmitting}
            />
            <motion.button
                type="submit"
                disabled={!newMessage.trim() || !currentUser || isSubmitting}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-full bg-brand-accent text-brand-surface disabled:bg-brand-border disabled:cursor-not-allowed"
            >
                <img src={iconUrls.send} alt="Send" className="w-6 h-6" />
            </motion.button>
        </form>
      </footer>
    </div>
  );
};

export default BarangayChatPage;