
import React from 'react';
import type { ChatMessage } from '../types';
import Multiavatar from './Multiavatar';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, isOwnMessage }) => {
  const avatarSeed = message.avatarStyle || message.userId;

  return (
    <div className={`flex items-end gap-2 my-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwnMessage && (
        <Multiavatar seed={avatarSeed} alt={message.username} className="w-8 h-8 rounded-full self-start shrink-0" />
      )}
      <div className={`max-w-xs md:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && (
          <p className="text-xs text-brand-text-secondary font-semibold ml-3 mb-0.5">{message.username}</p>
        )}
        <div
          className={`px-4 py-2 rounded-2xl text-base ${
            isOwnMessage
              ? 'bg-brand-accent text-brand-surface rounded-br-lg'
              : 'bg-brand-bg text-brand-text rounded-bl-lg'
          }`}
        >
          <p className="break-words">{message.text}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageBubble;
