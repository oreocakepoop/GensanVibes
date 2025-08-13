
import React, { useState, useEffect } from 'react';
import { PostType, UserProfile } from '../types.ts';
import { auth } from '../firebase.ts';
import { motion } from 'framer-motion';
import Multiavatar from './Multiavatar.tsx';
import { useUserProfile } from '../hooks/useFollow.ts';
import { iconUrls } from '../data/icons.ts';


const postTypes = [
  { id: PostType.TEXT, name: 'Text', iconName: 'text' as const },
  { id: PostType.PHOTO, name: 'Photo', iconName: 'photo' as const },
  { id: PostType.QUOTE, name: 'Quote', iconName: 'quote' as const },
  { id: PostType.LINK, name: 'Link', iconName: 'link' as const },
  { id: PostType.CHAT, name: 'Chat', iconName: 'chat' as const },
  { id: PostType.AUDIO, name: 'Audio', iconName: 'audio' as const },
  { id: PostType.VIDEO, name: 'Video', iconName: 'video' as const },
];

interface PostCreatorProps {
    onSelectPostType: (postType: PostType) => void;
}

const Avatar: React.FC = () => {
    const currentUser = auth.currentUser;
    const userProfile = useUserProfile(currentUser?.uid);

    const seed = userProfile?.avatarStyle || currentUser?.uid || 'default';

    return (
        <Multiavatar
            seed={seed}
            alt="User Avatar"
            className="w-12 h-12 rounded-full object-cover bg-brand-bg"
        />
    );
};


const PostCreator: React.FC<PostCreatorProps> = ({ onSelectPostType }) => {
  return (
    <div className="bg-brand-surface p-4 flex items-center gap-4 border-b border-brand-border">
      <Avatar />
      <div className="flex-1 flex justify-around items-start">
          {postTypes.map(({ id, name, iconName }) => (
            <motion.button 
              key={name}
              onClick={() => onSelectPostType(id)} 
              className="flex flex-col items-center justify-start gap-1.5 rounded-lg w-16 h-16 transition-colors duration-200 ease-in-out hover:bg-brand-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-accent"
              aria-label={`Create ${name} post`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.9 }}
            >
              <img src={iconUrls[iconName]} alt="" className="w-7 h-7" />
              <span className="text-sm font-bold text-brand-text-secondary">{name}</span>
            </motion.button>
          ))}
      </div>
    </div>
  );
};

export default PostCreator;