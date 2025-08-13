import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, query, onValue, orderByChild } from 'firebase/database';
import type { View, Conversation } from '../types';
import { useUserProfile } from '../hooks/useFollow';
import Multiavatar from './Multiavatar';
import { motion } from 'framer-motion';
import { iconUrls } from '../data/icons';

const formatDistanceToNowShort = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
};

const ConversationListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-4 animate-pulse">
    <div className="w-12 h-12 rounded-full bg-brand-border shrink-0"></div>
    <div className="flex-1 space-y-2">
      <div className="h-5 bg-brand-border rounded w-1/3"></div>
      <div className="h-4 bg-brand-border rounded w-2/3"></div>
    </div>
  </div>
);

const ConversationListItem: React.FC<{ conversation: Conversation; onNavigate: (view: View) => void; currentUserId: string; }> = ({ conversation, onNavigate, currentUserId }) => {
    const otherParticipantId = Object.keys(conversation.participants).find(id => id !== currentUserId);

    if (!otherParticipantId) return null;

    const otherUserDetails = conversation.participantDetails?.[otherParticipantId];

    if (!otherUserDetails) return <ConversationListItemSkeleton />;

    const avatarSeed = otherUserDetails.avatarStyle || otherParticipantId;

    return (
        <motion.button
            onClick={() => onNavigate({ type: 'dmConversation', conversationId: conversation.id })}
            className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-brand-bg/50 transition-colors border-b border-brand-border"
            whileHover={{ x: 2 }}
        >
            <Multiavatar seed={avatarSeed} className="w-14 h-14 rounded-full" />
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-brand-text truncate">{otherUserDetails.username}</h3>
                    {conversation.lastMessage && (
                        <p className="text-xs text-brand-text-secondary font-medium shrink-0 ml-2">
                            {formatDistanceToNowShort(conversation.lastMessage.createdAt)}
                        </p>
                    )}
                </div>
                {conversation.lastMessage && (
                    <p className="text-sm text-brand-text-secondary truncate mt-0.5">
                        {conversation.lastMessage.senderId === currentUserId && 'You: '}
                        {conversation.lastMessage.text}
                    </p>
                )}
            </div>
        </motion.button>
    );
};


interface DMPageProps {
  onNavigate: (view: View) => void;
}

const DMPage: React.FC<DMPageProps> = ({ onNavigate }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const userConvosRef = ref(db, `user_conversations/${currentUser.uid}`);
    const unsubscribeUserConvos = onValue(userConvosRef, (snapshot) => {
      if (snapshot.exists()) {
        const convoIds = Object.keys(snapshot.val());
        const convoQuery = query(ref(db, 'conversations'), orderByChild('updatedAt'));

        const unsubscribeConvos = onValue(convoQuery, (convoSnapshot) => {
            const allConvos: Conversation[] = [];
            convoSnapshot.forEach(childSnapshot => {
                if (convoIds.includes(childSnapshot.key!)) {
                    allConvos.push({ id: childSnapshot.key, ...childSnapshot.val() });
                }
            });
            setConversations(allConvos.reverse());
            setLoading(false);
        });
        return () => unsubscribeConvos();

      } else {
        setConversations([]);
        setLoading(false);
      }
    });

    return () => unsubscribeUserConvos();
  }, [currentUser]);

  return (
    <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl">
      <header className="p-6 border-b border-brand-border bg-brand-bg/50">
        <h1 className="text-3xl font-bold text-brand-text font-serif">Direct Messages</h1>
        <p className="text-base text-brand-text-secondary mt-1">Your private conversations.</p>
      </header>

      {loading ? (
        <div>
          {[...Array(3)].map((_, i) => <ConversationListItemSkeleton key={i} />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-12 text-center text-brand-text-secondary flex flex-col items-center">
          <img src={iconUrls.dmLarge} alt="Messages" className="w-24 h-24 mb-4" />
          <h3 className="text-xl font-bold text-brand-text font-serif">No Messages Yet</h3>
          <p className="mt-2 max-w-sm">Start a conversation by visiting someone's profile and clicking the 'Message' button.</p>
        </div>
      ) : (
        <div>
          {conversations.map(convo => (
            <ConversationListItem key={convo.id} conversation={convo} onNavigate={onNavigate} currentUserId={currentUser!.uid} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DMPage;