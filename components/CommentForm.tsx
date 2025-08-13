
import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import type { UserProfile } from '../types';
import { motion } from 'framer-motion';
import Multiavatar from './Multiavatar';
import { useUserProfile } from '../hooks/useFollow';
import { iconUrls } from '../data/icons';

const CommentForm: React.FC<{
    onSubmit: (text: string) => void;
    isSubmitting: boolean;
    currentUserProfile?: UserProfile | null;
    onCancel?: () => void;
    isReply?: boolean;
    inputRef?: React.Ref<HTMLInputElement>;
}> = ({ onSubmit, isSubmitting, currentUserProfile, onCancel, isReply = false, inputRef }) => {
    const [text, setText] = useState('');
    const currentUser = auth.currentUser;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit(text.trim());
        setText('');
    };
    
    const avatarSeed = currentUserProfile?.avatarStyle || currentUser?.uid || 'default';
    const placeholder = isReply ? "Write a reply..." : `Reply as @${currentUserProfile?.username || 'Gensan User'}`;

    if (isReply) {
      // Keep original reply form for nested replies
      return (
        <form onSubmit={handleSubmit} className="flex items-start gap-2.5 py-3">
            <Multiavatar seed={avatarSeed} alt="Your avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5 bg-brand-border" />
            <div className="flex-1">
                 <div className="bg-brand-bg rounded-2xl flex items-end px-3.5 py-1.5 group focus-within:bg-brand-border/50 transition-colors duration-200">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none overflow-hidden text-sm placeholder:text-brand-text-secondary pr-2"
                        rows={1}
                        disabled={!currentUser}
                        autoFocus={isReply}
                    />
                    <motion.button
                        type="submit"
                        disabled={!text.trim() || isSubmitting || !currentUser}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 rounded-full text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent-light disabled:text-brand-border disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors self-end shrink-0"
                        aria-label="Send comment"
                    >
                        <img src={iconUrls.send} alt="Send comment" className="w-5 h-5" />
                    </motion.button>
                </div>
                {isReply && onCancel && (
                    <button onClick={onCancel} className="text-xs font-semibold text-brand-text-secondary hover:underline mt-1 ml-2">Cancel</button>
                )}
            </div>
        </form>
      );
    }
    
    // New top-level reply form design
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full">
        <Multiavatar seed={avatarSeed} alt="Your avatar" className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-brand-border" />
        <div className="flex-1 bg-brand-surface border border-brand-border rounded-lg flex items-center pr-2">
           <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-base placeholder:text-brand-text-secondary px-3 py-2"
              disabled={!currentUser}
            />
            <motion.button
              type="submit"
              disabled={!text.trim() || isSubmitting || !currentUser}
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded-full text-brand-text-secondary hover:text-brand-accent disabled:text-brand-border disabled:cursor-not-allowed"
              aria-label="Send comment"
            >
              <img src={iconUrls.send} alt="Send comment" className="w-6 h-6" />
            </motion.button>
        </div>
      </form>
    );
};

export default CommentForm;
