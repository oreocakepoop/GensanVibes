

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, update } from 'firebase/database';
import type { UserProfile } from '../types';
import { motion, Variants } from 'framer-motion';
import { iconUrls } from '../data/icons';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  userId: string;
}

const backdropVariants: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 }
};

const modalVariants: Variants = {
  hidden: { y: "-50px", scale: 0.95, opacity: 0 },
  visible: { y: "0", scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { y: "50px", scale: 0.95, opacity: 0, transition: { duration: 0.2 } }
};

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, userProfile, userId }) => {
    const [username, setUsername] = useState(userProfile.username);
    const [bio, setBio] = useState(userProfile.bio || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsername(userProfile.username);
            setBio(userProfile.bio || '');
            setError('');
            setLoading(false);
        }
    }, [isOpen, userProfile]);

    const handleSave = async () => {
        if (username.length < 3) {
            setError("Username must be at least 3 characters.");
            return;
        }
        if (bio.length > 160) {
            setError("Bio cannot exceed 160 characters.");
            return;
        }

        setLoading(true);
        setError('');
        try {
            const userRef = ref(db, `users/${userId}`);
            const updates = {
                username: username.trim(),
                bio: bio.trim(),
            };
            await update(userRef, updates);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" 
            onClick={onClose}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
        >
            <motion.div 
                className="bg-brand-surface rounded-xl shadow-2xl w-full max-w-lg flex flex-col" 
                onClick={e => e.stopPropagation()}
                variants={modalVariants}
            >
                <header className="p-4 flex items-center border-b border-brand-border shrink-0">
                    <h2 className="text-lg font-bold text-brand-text">Edit Your Profile</h2>
                    <button onClick={onClose} className="ml-auto text-brand-text-secondary hover:text-brand-text p-2 rounded-full transition-colors">
                        <img src={iconUrls.close} alt="Close" className="w-6 h-6" />
                    </button>
                </header>

                <main className="p-6 space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-semibold text-brand-text-secondary mb-1">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full h-11 px-4 py-2 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
                        />
                    </div>
                     <div>
                        <label htmlFor="bio" className="block text-sm font-semibold text-brand-text-secondary mb-1">Bio</label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={160}
                            rows={3}
                            className="w-full px-4 py-2 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition resize-none"
                            placeholder="Tell us a little about yourself"
                        />
                        <p className="text-xs text-right text-brand-text-secondary mt-1">{bio.length}/160</p>
                    </div>
                </main>

                <footer className="p-4 border-t border-brand-border shrink-0 flex justify-end items-center gap-4">
                    {error && <p className="text-brand-accent text-sm mr-auto">{error}</p>}
                    <button 
                        onClick={onClose}
                        className="bg-brand-surface hover:bg-brand-bg border border-brand-border text-brand-text font-bold py-2 px-5 rounded-lg text-base transition-all">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-brand-accent hover:opacity-90 text-brand-surface font-bold py-2 px-5 rounded-lg text-base transition-all disabled:bg-brand-border disabled:text-brand-text-secondary disabled:cursor-not-allowed">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default EditProfileModal;