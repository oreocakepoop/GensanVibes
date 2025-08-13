import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue, runTransaction, set, get } from 'firebase/database';
import type { KaganapanEvent, View } from '../types';
import PostSkeleton from './PostSkeleton';
import Multiavatar from './Multiavatar';
import { motion } from 'framer-motion';
import { iconUrls } from '../data/icons';

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

  const toggleAttendance = async () => {
    if (!currentUser || !event || isProcessing) return;
    setIsProcessing(true);
    const wasAttending = isAttending;

    const eventRef = ref(db, `events/${event.id}`);
    
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
    } catch(error) {
        console.error("Failed to update attendance", error);
    } finally {
        setIsProcessing(false);
    }
  };


  if (loading) {
    return <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl"><PostSkeleton /></div>;
  }

  if (!event) {
    return (
      <div className="w-full bg-brand-surface border rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold font-serif text-brand-text">Event not found</h2>
        <p className="text-brand-text-secondary mt-2">This event may have been canceled or the link is incorrect.</p>
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
  const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="w-full bg-brand-surface border-b border-l border-r border-brand-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-brand-border bg-brand-bg/50">
            <p className="text-base font-bold text-brand-accent">{formattedDate}</p>
            <h1 className="text-4xl font-bold text-brand-text font-serif mt-1">{event.title}</h1>
            <div className="flex items-center gap-2 mt-4 cursor-pointer" onClick={() => onNavigate({type: 'profile', userId: event.creatorId })}>
                <Multiavatar seed={event.creatorAvatarStyle || event.creatorId} className="w-8 h-8 rounded-full" />
                <span className="text-sm text-brand-text-secondary">
                Hosted by <strong className="text-brand-text font-semibold hover:underline">{event.creatorUsername}</strong>
                </span>
            </div>
        </div>

        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <img src={iconUrls.clock} alt="Time" className="w-6 h-6 opacity-80" />
                        <span className="text-lg font-semibold text-brand-text">{formattedTime}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <img src={iconUrls.pin} alt="Location" className="w-6 h-6 opacity-80" />
                        <span className="text-lg font-semibold text-brand-text">{event.location}</span>
                    </div>
                </div>
                <button 
                    onClick={toggleAttendance}
                    disabled={!currentUser || isProcessing}
                    className={`px-6 py-3 font-bold rounded-lg text-base w-full sm:w-auto disabled:opacity-50
                        ${isAttending 
                            ? 'bg-brand-subtle text-brand-text hover:bg-brand-border transition-colors' 
                            : 'bg-brand-accent text-brand-surface hover:opacity-90 transition-opacity'}`}
                >
                    {isProcessing ? '...' : (isAttending ? "You're Going!" : "I'm Going")}
                </button>
            </div>

            <div>
                <h3 className="font-bold text-brand-text mb-2">About this Event</h3>
                <p className="text-brand-text leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
            
             <div>
                <div className="flex items-center gap-2 mb-3">
                    <img src={iconUrls.group} alt="Attendees" className="w-5 h-5 opacity-80" />
                    <h3 className="font-bold text-brand-text">
                        {event.attendeesCount.toLocaleString()} {event.attendeesCount === 1 ? 'person' : 'people'} going
                    </h3>
                </div>
                {/* Could map attendee avatars here in the future */}
            </div>

        </div>
    </div>
  );
};

export default EventDetailPage;