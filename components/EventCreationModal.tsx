
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { ref, set, push } from 'firebase/database';
import type { KaganapanEvent, View } from '../types';
import { useUserProfile } from '../hooks/useFollow';
import { motion, Variants } from 'framer-motion';
import { iconUrls } from '../data/icons';

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
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

const EventCreationModal: React.FC<EventCreationModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const user = auth.currentUser;
  const userProfile = useUserProfile(user?.uid);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      setError("You must be logged in to create an event.");
      return;
    }
    if (!title || !description || !date || !time || !location) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const eventDateISO = new Date(`${date}T${time}`).toISOString();
      const eventsRef = ref(db, 'events');
      const newEventRef = push(eventsRef);
      
      const newEventData: Omit<KaganapanEvent, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        eventDate: eventDateISO,
        location: location.trim(),
        creatorId: user.uid,
        creatorUsername: userProfile.username,
        creatorAvatarStyle: userProfile.avatarStyle,
        createdAt: new Date().toISOString(),
        attendeesCount: 0,
        attendees: {},
      };

      await set(newEventRef, newEventData);
      onClose();
      // Optionally navigate to the new event page
      onNavigate({ type: 'eventDetail', eventId: newEventRef.key! });
    } catch (err: any) {
      setError(err.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  const isSubmittable = !loading && title && description && date && time && location;

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
          <h2 className="text-lg font-bold text-brand-text">Create a New Event</h2>
          <button onClick={onClose} className="ml-auto text-brand-text-secondary hover:text-brand-text p-2 rounded-full transition-colors">
            <img src={iconUrls.close} alt="Close" className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleCreateEvent}>
          <main className="p-6 space-y-4">
            <input
              type="text"
              placeholder="Event Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full h-11 px-4 py-2 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
            />
            <textarea
              placeholder="Event Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent transition resize-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-11 px-4 py-2 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                />
                <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full h-11 px-4 py-2 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                />
            </div>
             <input
              type="text"
              placeholder="Location (e.g., Plaza Heneral Santos)"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full h-11 px-4 py-2 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
            />
          </main>

          <footer className="p-4 border-t border-brand-border shrink-0 flex justify-end items-center gap-4">
            {error && <p className="text-brand-accent text-sm mr-auto">{error}</p>}
            <button
              type="button"
              onClick={onClose}
              className="bg-brand-surface hover:bg-brand-bg border border-brand-border text-brand-text font-bold py-2 px-5 rounded-lg text-base transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isSubmittable}
              className="bg-brand-accent hover:opacity-90 text-brand-surface font-bold py-2 px-5 rounded-lg text-base transition-all disabled:bg-brand-border disabled:text-brand-text-secondary disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </footer>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EventCreationModal;
