

import React, { useState, useEffect } from 'react';
import { db } from '../firebase.ts';
import { ref, query, orderByChild, onValue } from 'firebase/database';
import type { KaganapanEvent, View } from '../types.ts';
import EventListItem from './EventListItem.tsx';
import PostSkeleton from './PostSkeleton.tsx';
import { motion } from 'framer-motion';
import { iconUrls } from '../data/icons.ts';

interface EventsPageProps {
  onNavigate: (view: View) => void;
  onCreateEvent: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const EventsPage: React.FC<EventsPageProps> = ({ onNavigate, onCreateEvent }) => {
  const [events, setEvents] = useState<KaganapanEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const eventsQuery = query(ref(db, 'events'), orderByChild('eventDate'));

    const unsubscribe = onValue(eventsQuery, (snapshot) => {
      const data = snapshot.val();
      const now = new Date();
      const eventsArray: KaganapanEvent[] = data
        ? Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .filter(event => new Date(event.eventDate) >= now) // Filter out past events
            .reverse() // Show newest first
        : [];
      setEvents(eventsArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl">
      <header className="p-6 border-b border-brand-border bg-brand-bg/50 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-brand-text font-serif">Kaganapan Board</h1>
          <p className="text-base text-brand-text-secondary mt-1">Discover what's happening in Gensan.</p>
        </div>
        <button
            onClick={onCreateEvent}
            className="flex items-center gap-2 bg-brand-accent text-brand-surface font-bold py-2 px-4 rounded-lg text-sm transition-opacity hover:opacity-90"
        >
            <img src={iconUrls.addEvent} alt="" className="w-5 h-5"/>
            <span>Create Event</span>
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col">
          {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center text-brand-text-secondary flex flex-col items-center">
             <img src={iconUrls.calendarLarge} alt="" className="w-24 h-24 mb-4"/>
          <h3 className="text-xl font-bold text-brand-text font-serif">No Upcoming Events</h3>
          <p className="mt-2">Check back later or create a new event to get the vibes going!</p>
        </div>
      ) : (
        <motion.div
          className="flex flex-col"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {events.map((event) => (
            <motion.div key={event.id} variants={itemVariants}>
              <EventListItem event={event} onNavigate={onNavigate} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default EventsPage;