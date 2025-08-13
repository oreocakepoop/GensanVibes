

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import UserListItem from './UserListItem';
import { iconUrls } from '../data/icons';

const backdropVariants: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 }
};

const modalVariants: Variants = {
  hidden: { y: "-50px", scale: 0.95, opacity: 0 },
  visible: { y: "0", scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { y: "50px", scale: 0.95, opacity: 0, transition: { duration: 0.2 } }
};

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  userIds: string[];
}

const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, title, userIds }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
        >
          <motion.div
            className="bg-brand-surface rounded-xl shadow-2xl w-full max-w-md flex flex-col h-auto max-h-[80vh]"
            onClick={e => e.stopPropagation()}
            variants={modalVariants}
          >
            <header className="p-4 flex items-center border-b border-brand-border shrink-0 relative">
              <h2 className="text-lg font-bold text-brand-text mx-auto">{title}</h2>
              <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text p-2 rounded-full transition-colors">
                <img src={iconUrls.close} alt="Close" className="w-6 h-6" />
              </button>
            </header>

            <main className="p-2 overflow-y-auto">
              {userIds.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {userIds.map(id => <UserListItem key={id} userId={id} />)}
                </div>
              ) : (
                <div className="text-center text-brand-text-secondary py-12">
                  <p>No users to show.</p>
                </div>
              )}
            </main>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FollowListModal;