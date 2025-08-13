import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { ref, query, onValue, push, update, get, limitToLast, orderByChild } from 'firebase/database';
import type { View, DirectMessage, Conversation, UserProfile, ChatMessage } from '../types';
import { useUserProfile } from '../hooks/useFollow';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessageBubble from './ChatMessageBubble';
import { iconUrls } from '../data/icons';
import Multiavatar from './Multiavatar';

interface DMConversationPageProps {
  conversationId: string;
  onNavigate: (view: View) => void;
}

const DMConversationPage: React.FC<DMConversationPageProps> = ({ conversationId, onNavigate }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUser = auth.currentUser;
  const otherUserId = currentUser ? conversationId.replace(currentUser.uid, '').replace('_', '') : '';
  const otherUserProfile = useUserProfile(otherUserId);
  const currentUserProfile = useUserProfile(currentUser?.uid);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentUser || !currentUserProfile || !otherUserProfile) return;
    
    const ensureConversationExists = async () => {
      const convRef = ref(db, `conversations/${conversationId}`);
      const snapshot = await get(convRef);

      if (!snapshot.exists()) {
        const now = new Date().toISOString();
        const newConversation: Omit<Conversation, 'id'> = {
          participants: {
            [currentUser.uid]: true,
            [otherUserId]: true,
          },
          participantDetails: {
            [currentUser.uid]: {
              username: currentUserProfile.username,
              avatarStyle: currentUserProfile.avatarStyle || '',
            },
            [otherUserId]: {
              username: otherUserProfile.username,
              avatarStyle: otherUserProfile.avatarStyle || '',
            }
          },
          createdAt: now,
          updatedAt: now,
        };

        const updates: any = {};
        updates[`/conversations/${conversationId}`] = newConversation;
        updates[`/user_conversations/${currentUser.uid}/${conversationId}`] = true;
        updates[`/user_conversations/${otherUserId}/${conversationId}`] = true;

        await update(ref(db), updates);
      }
    };
    
    ensureConversationExists();

  }, [conversationId, currentUser, currentUserProfile, otherUserProfile, otherUserId]);

  useEffect(() => {
    setLoading(true);
    const messagesRef = query(
        ref(db, `dm_messages/${conversationId}`),
        orderByChild('createdAt'),
        limitToLast(50)
    );

    const unsubscribe = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const messagesArray: DirectMessage[] = data 
            ? Object.keys(data).map(key => ({ id: key, ...data[key] }))
            : [];
        setMessages(messagesArray);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const messageData: Omit<DirectMessage, 'id'> = {
        senderId: currentUser.uid,
        text: newMessage.trim(),
        createdAt: now,
      };

      const newMessageRef = push(ref(db, `dm_messages/${conversationId}`));
      
      const updates: any = {};
      updates[`/dm_messages/${conversationId}/${newMessageRef.key}`] = messageData;
      updates[`/conversations/${conversationId}/lastMessage`] = {
          text: messageData.text,
          createdAt: now,
          senderId: currentUser.uid
      };
      updates[`/conversations/${conversationId}/updatedAt`] = now;
      
      await update(ref(db), updates);
      setNewMessage('');
    } catch(error) {
        console.error("Error sending message:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!otherUserProfile) {
      return (
        <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl flex flex-col h-[calc(100vh-120px)] animate-pulse">
            <header className="p-4 border-b border-brand-border bg-brand-bg/80 flex items-center shrink-0">
                 <div className="h-9 w-9 bg-brand-border rounded-full mr-2"></div>
                <div>
                    <div className="h-6 w-48 bg-brand-border rounded"></div>
                </div>
            </header>
        </div>
      );
  }

  return (
    <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl flex flex-col h-[calc(100vh-120px)]">
      <header className="p-4 border-b border-brand-border bg-brand-bg/80 flex items-center shrink-0">
        <button onClick={() => onNavigate({type: 'dms'})} className="p-2 rounded-full hover:bg-brand-border mr-2">
            <img src={iconUrls.arrowLeft} alt="Back" className="w-6 h-6"/>
        </button>
        <Multiavatar seed={otherUserProfile.avatarStyle || otherUserId} className="w-10 h-10 rounded-full" />
        <div className="ml-3">
            <h1 className="text-lg font-bold text-brand-text font-serif">{otherUserProfile.username}</h1>
            <p className="text-sm text-brand-text-secondary">{otherUserProfile.barangay}, {otherUserProfile.city}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full"><p className="text-brand-text-secondary">Loading messages...</p></div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-brand-text-secondary">
            <p>This is the beginning of your conversation with {otherUserProfile.username}.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => {
              const isOwnMessage = msg.senderId === currentUser?.uid;
              const senderProfile = isOwnMessage ? currentUserProfile : otherUserProfile;
              const chatMessage: ChatMessage = {
                id: msg.id,
                userId: msg.senderId,
                text: msg.text,
                createdAt: msg.createdAt,
                username: senderProfile?.username ?? '',
                avatarStyle: senderProfile?.avatarStyle ?? ''
              };

              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <ChatMessageBubble message={chatMessage} isOwnMessage={isOwnMessage} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t border-brand-border shrink-0 bg-brand-surface">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={currentUser ? `Message ${otherUserProfile.username}` : "You must be logged in to chat"}
                className="w-full h-11 px-4 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                disabled={!currentUser || isSubmitting}
            />
            <motion.button
                type="submit"
                disabled={!newMessage.trim() || !currentUser || isSubmitting}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-full bg-brand-accent text-brand-surface disabled:bg-brand-border disabled:cursor-not-allowed"
                aria-label="Send Message"
            >
                <img src={iconUrls.send} alt="" className="w-6 h-6" />
            </motion.button>
        </form>
      </footer>
    </div>
  );
};

export default DMConversationPage;