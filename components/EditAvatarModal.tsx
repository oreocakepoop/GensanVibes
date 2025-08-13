

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { ref, update } from 'firebase/database';
import { motion, Variants } from 'framer-motion';
import Multiavatar from './Multiavatar';
import { iconUrls } from '../data/icons';

interface EditAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSeed: string;
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

const NUMBER_OF_AVATARS_TO_SHOW = 15;

const generateRandomSeed = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const AvatarOption: React.FC<{
  seed: string;
  isDefault: boolean;
  isSelected: boolean;
  onClick: () => void;
}> = ({ seed, isDefault, isSelected, onClick }) => {

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      className={`relative flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${
        isSelected ? 'border-brand-accent bg-brand-accent-light' : 'border-transparent hover:bg-brand-bg'
      }`}
    >
      <div className="w-24 h-24 rounded-full bg-brand-border overflow-hidden">
        <Multiavatar
          seed={seed}
          alt={`Avatar for ${seed}`}
          className="w-full h-full object-cover"
        />
      </div>
      {isDefault && <span className="text-xs font-semibold text-brand-text-secondary">Default</span>}
    </motion.button>
  );
};


const EditAvatarModal: React.FC<EditAvatarModalProps> = ({ isOpen, onClose, currentSeed, userId }) => {
    const [selectedSeed, setSelectedSeed] = useState(currentSeed);
    const [displayedAvatars, setDisplayedAvatars] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateAndSetAvatars = useCallback((seedToKeep: string) => {
        const newAvatars = new Set<string>([seedToKeep, userId]); // Keep current and default
        while (newAvatars.size < NUMBER_OF_AVATARS_TO_SHOW) {
            newAvatars.add(generateRandomSeed());
        }
        setDisplayedAvatars(shuffleArray(Array.from(newAvatars)));
    }, [userId]);

    useEffect(() => {
        if (isOpen) {
            setSelectedSeed(currentSeed);
            setError('');
            setLoading(false);
            generateAndSetAvatars(currentSeed);
        }
    }, [isOpen, currentSeed, generateAndSetAvatars]);

    const handleSave = async () => {
        setLoading(true);
        setError('');
        try {
            const userRef = ref(db, `users/${userId}`);
            // If the user selects their default avatar (seeded by userId), save an empty string
            const styleToSave = selectedSeed === userId ? '' : selectedSeed;
            await update(userRef, { avatarStyle: styleToSave });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update avatar.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleRegenerate = () => {
        generateAndSetAvatars(selectedSeed);
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
                className="bg-brand-surface rounded-xl shadow-2xl w-full max-w-2xl flex flex-col h-auto max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
                variants={modalVariants}
            >
                <header className="p-4 flex items-center border-b border-brand-border shrink-0">
                    <h2 className="text-lg font-bold text-brand-text">Choose Your Avatar</h2>
                    <button onClick={onClose} className="ml-auto text-brand-text-secondary hover:text-brand-text p-2 rounded-full transition-colors">
                        <img src={iconUrls.close} alt="Close" className="w-6 h-6" />
                    </button>
                </header>

                <main className="p-6 flex flex-col min-h-[400px] max-h-[60vh] overflow-y-auto">
                    <div className="flex justify-center mb-6">
                        <motion.button 
                            onClick={handleRegenerate} 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 bg-brand-text hover:opacity-90 text-brand-surface font-bold py-2.5 px-5 rounded-lg text-base transition-all"
                        >
                            <img src={iconUrls.refresh} alt="" className="w-5 h-5"/>
                            Generate New Avatars
                        </motion.button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {displayedAvatars.map(seed => (
                           <AvatarOption
                                key={seed}
                                seed={seed}
                                isSelected={selectedSeed === seed}
                                isDefault={seed === userId}
                                onClick={() => setSelectedSeed(seed)}
                            />
                        ))}
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
                        disabled={loading || selectedSeed === currentSeed}
                        className="bg-brand-accent hover:opacity-90 text-brand-surface font-bold py-2 px-5 rounded-lg text-base transition-all disabled:bg-brand-border disabled:text-brand-text-secondary disabled:cursor-not-allowed">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default EditAvatarModal;