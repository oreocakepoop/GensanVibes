
import React from 'react';
import type { KaganapanEvent, View } from '../types';
import Multiavatar from './Multiavatar';
import { motion } from 'framer-motion';
import { iconUrls } from '../data/icons';

interface EventListItemProps {
  event: KaganapanEvent;
  onNavigate: (view: View) => void;
}

const EventListItem: React.FC<EventListItemProps> = ({ event, onNavigate }) => {
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

  return (
    <motion.article
      onClick={() => onNavigate({ type: 'eventDetail', eventId: event.id })}
      className="block w-full text-left p-4 border-b border-brand-border hover:bg-brand-bg/50 cursor-pointer transition-colors"
      whileHover={{ x: 2 }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-brand-accent">{formattedDate}</p>
          <h2 className="text-xl font-bold text-brand-text font-serif mt-1">{event.title}</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-text-secondary mt-2">
            <div className="flex items-center gap-1.5">
              <img src={iconUrls.pin} alt="Location" className="w-4 h-4 opacity-80" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <img src={iconUrls.clock} alt="Time" className="w-4 h-4 opacity-80" />
              <span>{formattedTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-brand-border/50">
            <Multiavatar seed={event.creatorAvatarStyle || event.creatorId} className="w-6 h-6 rounded-full" />
            <span className="text-xs text-brand-text-secondary">
              Hosted by <strong className="text-brand-text font-semibold">{event.creatorUsername}</strong>
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center bg-brand-bg px-4 py-2 rounded-lg text-center">
            <span className="text-2xl font-bold text-brand-text">{eventDate.getDate()}</span>
            <span className="text-sm font-semibold text-brand-accent -mt-1">{eventDate.toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
        </div>
      </div>
    </motion.article>
  );
};

export default EventListItem;
