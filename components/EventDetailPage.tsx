import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase.ts';
import { ref, onValue, runTransaction, set, get } from 'firebase/database';
import type { KaganapanEvent, View } from '../types.ts';
import PostSkeleton from './PostSkeleton.tsx';
import Multiavatar from './Multiavatar.tsx';
import { motion } from 'framer-motion';
import { iconUrls } from '../data/icons.ts';

// Badge Awarding Logic
const checkAndAwardBadge = async (userId: string, badgeId: string) => {
    const badgeRef = ref(db, `users/${userId}/badges/${badgeId}`);
    const snapshot = await get(badgeRef);
    if (!snapshot.exists()) {
        await set(badgeRef, new Date().toISOString());
    }
};

const checkEventBadges = async (userId: string) => {
    const eventsCountRef = ref(db, `users/${userId}/eventsAttendedCount`);
    let newTotalEvents = 0;
    await runTransaction(eventsCountRef, (count) => {
        newTotalEvents = (count || 0) + 1;
        return newTotalEvents;
    });

    if (newTotalEvents >= 5) {
        await checkAndAwardBadge(userId, 'event_enthusiast');
    }
};

interface EventDetailPageProps {
  eventId: string;
  onNavigate: (view: View) => void;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({ eventId, onNavigate }) => {
  const [event, setEvent] = useState<KaganapanEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentUser = auth.currentUser;

  useEffect(() => {
    setLoading(true);
    const eventRef = ref(db, `events/${eventId}`);
    
    const unsubscribe = onValue(eventRef, (snapshot) => {
      if (snapshot.exists()) {
        const eventData = { id: snapshot.key, ...snapshot.val() };
        setEvent(eventData);
        if (currentUser) {
          setIsAttending(!!eventData.attendees?.[currentUser.uid]);
        }
      } else {
        setEvent(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, currentUser]);

  const handleAttendToggle = async () => {
    if (!currentUser || !event || isProcessing) return;

    setIsProcessing(true);
    const eventRef = ref(db, `events/${eventId}`);
    const wasAttending = isAttending;

    try {
        await runTransaction(eventRef, (currentEvent) => {
            if (currentEvent) {
                if (currentEvent.attendees && currentEvent.attendees[currentUser.uid]) {
                    currentEvent.attendeesCount = (currentEvent.attendeesCount || 1) - 1;
                    currentEvent.attendees[currentUser.uid] = null;
                } else {
                    currentEvent.attendeesCount = (currentEvent.attendeesCount || 0) + 1;
                    if (!currentEvent.attendees) {
                        currentEvent.attendees = {};
                    }
                    currentEvent.attendees[currentUser.uid] = true;
                }
            }
            return currentEvent;
        });

        if (!wasAttending) {
            await checkEventBadges(currentUser.uid);
        }
    } catch (error) {
        console.error("Failed to toggle attendance", error);
    } finally {
        setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl">
        <PostSkeleton />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold font-serif text-brand-text">Event not found</h2>
        <p className="text-brand-text-secondary mt-2">This event may have been cancelled or the link is incorrect.</p>
        <button
          onClick={() => onNavigate({ type: 'events' })}
          className="mt-4 px-4 py-2 bg-brand-accent text-brand-surface font-bold rounded-lg text-sm hover:opacity-90 transition-colors"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const eventDate = new Date(event.eventDate);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const avatarSeed = event.creatorAvatarStyle || event.creatorId;

  return (
    <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl">
      <div className="p-6 border-b border-brand-border">
          <p className="text-base font-bold text-brand-accent">{formattedDate}</p>
          <h1 className="text-4xl font-bold text-brand-text font-serif mt-2">{event.title}</h1>
          
          <button onClick={() => onNavigate({ type: 'profile', userId: event.creatorId })} className="flex items-center gap-3 mt-4 group">
            <Multiavatar seed={avatarSeed} className="w-8 h-8 rounded-full" />
            <span className="text-sm text-brand-text-secondary">
              Hosted by <strong className="text-brand-text font-semibold group-hover:underline">{event.creatorUsername}</strong>
            </span>
          </button>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="text-base text-brand-text leading-relaxed">
            {event.description.split('\n').filter(p => p.trim()).map((para, i) => <p key={i}>{para}</p>)}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base text-brand-text-secondary pt-4 border-t border-brand-border">
            <div className="flex items-center gap-2">
              <img src={iconUrls.pin} alt="Location" className="w-5 h-5 opacity-80" />
              <span className="font-semibold">{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={iconUrls.clock} alt="Time" className="w-5 h-5 opacity-80" />
              <span className="font-semibold">{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={iconUrls.group} alt="Attendees" className="w-5 h-5 opacity-80" />
              <span className="font-semibold">{event.attendeesCount} attending</span>
            </div>
        </div>
      </div>
      
      {currentUser && (
        <div className="p-6 border-t border-brand-border">
          <motion.button
            onClick={handleAttendToggle}
            disabled={isProcessing}
            whileTap={{ scale: 0.95 }}
            className={`w-full font-bold py-3 px-4 rounded-lg text-base transition-all disabled:opacity-50 ${
                isAttending
                ? 'bg-brand-border text-brand-text-secondary hover:bg-brand-subtle'
                : 'bg-brand-accent text-brand-surface hover:opacity-90'
            }`}
          >
            {isProcessing ? '...' : (isAttending ? "I can't make it" : 'I will attend!')}
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
