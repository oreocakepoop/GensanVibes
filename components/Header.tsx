import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase.ts';
import { signOut } from 'firebase/auth';
import type { UserProfile, View } from '../types.ts';
import { motion, AnimatePresence } from 'framer-motion';
import Multiavatar from './Multiavatar.tsx';
import { useUserProfile } from '../hooks/useFollow.ts';
import { useUnreadNotificationsCount } from '../hooks/useNotifications.ts';
import NotificationsPanel from './NotificationsPanel.tsx';
import { iconUrls } from '../data/icons.ts';


interface HeaderProps {
  onMakePost: () => void;
  onNavigate: (view: View) => void;
  currentView: View;
}

const Header: React.FC<HeaderProps> = ({ onMakePost, onNavigate, currentView }) => {
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.currentUser;
  const userProfile = useUserProfile(currentUser?.uid);
  const unreadCount = useUnreadNotificationsCount(currentUser?.uid);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpen(false);
        }
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
            setNotificationsOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef, notificationsRef]);
  
  const avatarSeed = userProfile?.avatarStyle || currentUser?.uid || 'default';

  const handleLogout = () => {
    signOut(auth);
  };

  const isDashboardActive = currentView.type === 'dashboard' && !currentView.filter;
  const isExploreActive = currentView.type === 'dashboard' && currentView.filter?.type === 'explore';
  const isFoodPlannerActive = currentView.type === 'foodTripPlanner';
  const isEventsActive = currentView.type === 'events' || currentView.type === 'eventDetail';
  const isDmsActive = currentView.type === 'dms' || currentView.type === 'dmConversation';
  const isProfileActive = currentView.type === 'profile' && currentView.userId === currentUser?.uid;

  const handleNavigateAndClose = (view: View) => {
    onNavigate(view);
    setMenuOpen(false);
  };

  const handleMakePostAndClose = () => {
    onMakePost();
    setMenuOpen(false);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } }
  };

  return (
    <header className="sticky top-0 z-20 bg-brand-surface/75 backdrop-blur-xl border-b border-brand-border/80">
      <div className="w-full max-w-[990px] mx-auto px-4 h-14 flex items-center justify-between">
        
        {mobileSearchVisible && (
          <div className="flex items-center w-full md:hidden">
            <button onClick={() => setMobileSearchVisible(false)} className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-bg transition-colors" aria-label="Close search">
              <img src={iconUrls.arrowLeft} alt="" className="w-6 h-6" />
            </button>
            <div className="relative flex-grow ml-2">
              <img src={iconUrls.search} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-70" />
              <input type="text" placeholder="Search Gensan Vibes" className="bg-brand-bg placeholder:text-brand-text-secondary text-brand-text rounded-md h-9 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all" autoFocus />
            </div>
          </div>
        )}

        {!mobileSearchVisible && (
          <>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-brand-text font-serif">Gensan Vibes</h1>
              <div className="relative hidden md:block">
                <img src={iconUrls.search} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-70" />
                <input type="text" placeholder="Search Gensan Vibes" className="bg-brand-bg placeholder:text-brand-text-secondary text-brand-text rounded-md h-9 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all" />
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <motion.button onClick={() => setMobileSearchVisible(true)} className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-bg transition-colors md:hidden" aria-label="Open search" title="Search" whileTap={{ scale: 0.9 }}>
                <img src={iconUrls.search} alt="" className="w-6 h-6" />
              </motion.button>
              <motion.button onClick={() => onNavigate({ type: 'dashboard' })} className="p-2 rounded-full transition-colors duration-200 hover:bg-brand-bg" aria-current={isDashboardActive ? "page" : undefined} title="Dashboard" aria-label="Dashboard" whileTap={{ scale: 0.9 }}>
                  <img src={isDashboardActive ? iconUrls.homeActive : iconUrls.home} alt="" className="w-7 h-7" />
              </motion.button>
              <motion.button onClick={() => onNavigate({ type: 'dashboard', filter: { type: 'explore' }})} className="p-2 rounded-full transition-colors duration-200 hover:bg-brand-bg" aria-current={isExploreActive ? "page" : undefined} title="Explore" aria-label="Explore" whileTap={{ scale: 0.9 }}>
                  <img src={isExploreActive ? iconUrls.compassActive : iconUrls.compass} alt="" className="w-7 h-7" />
              </motion.button>
               <motion.button onClick={() => onNavigate({ type: 'foodTripPlanner' })} className="p-2 rounded-full transition-colors duration-200 hover:bg-brand-bg" aria-current={isFoodPlannerActive ? "page" : undefined} title="AI Food Planner" aria-label="AI Food Planner" whileTap={{ scale: 0.9 }}>
                  <img src={isFoodPlannerActive ? iconUrls.foodActive : iconUrls.food} alt="" className="w-7 h-7" />
              </motion.button>
              <motion.button onClick={() => onNavigate({ type: 'events' })} className="p-2 rounded-full transition-colors duration-200 hover:bg-brand-bg" aria-current={isEventsActive ? "page" : undefined} title="Events" aria-label="Events" whileTap={{ scale: 0.9 }}>
                  <img src={isEventsActive ? iconUrls.calendarActive : iconUrls.calendar} alt="" className="w-7 h-7" />
              </motion.button>
              <motion.button onClick={() => onNavigate({ type: 'dms' })} className="p-2 rounded-full transition-colors duration-200 hover:bg-brand-bg" aria-current={isDmsActive ? "page" : undefined} title="Messages" aria-label="Messages" whileTap={{ scale: 0.9 }}>
                  <img src={isDmsActive ? iconUrls.dmActive : iconUrls.dm} alt="" className="w-7 h-7" />
              </motion.button>

              <div className="relative" ref={notificationsRef}>
                  <motion.button onClick={() => setNotificationsOpen(p => !p)} className="p-2 rounded-full transition-colors duration-200 hover:bg-brand-bg" title="Notifications" aria-label="Notifications" whileTap={{ scale: 0.9 }}>
                      <img src={notificationsOpen ? iconUrls.bellActive : iconUrls.bell} alt="" className="w-7 h-7" />
                      {unreadCount > 0 && (
                          <motion.div initial={{scale:0}} animate={{scale:1}} className="absolute top-1 right-1 h-5 min-w-[20px] bg-brand-accent text-white text-xs font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-brand-surface">
                            {unreadCount}
                          </motion.div>
                      )}
                  </motion.button>
                  <AnimatePresence>
                    {notificationsOpen && (
                         <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit">
                           <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} onNavigate={onNavigate} />
                         </motion.div>
                    )}
                  </AnimatePresence>
              </div>
              
              <div className="relative ml-2" ref={menuRef}>
                <motion.button onClick={() => setMenuOpen(prev => !prev)} whileTap={{ scale: 0.9 }} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent">
                  <Multiavatar seed={avatarSeed} alt="User menu" className="w-9 h-9 rounded-full object-cover bg-brand-border"/>
                </motion.button>
                <AnimatePresence>
                  {menuOpen && userProfile && (
                    <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" className="absolute top-full right-0 mt-2 w-64 bg-brand-surface rounded-xl shadow-2xl z-10 ring-1 ring-brand-border/50 transform-origin-top-right overflow-hidden">
                      <div className="p-4 border-b border-brand-border/80">
                        <div className="flex items-center gap-3">
                          <Multiavatar seed={avatarSeed} alt="User avatar" className="w-10 h-10 rounded-full object-cover bg-brand-border" />
                          <div>
                            <p className="font-bold text-brand-text">{userProfile.username}</p>
                            <p className="text-sm text-brand-text-secondary truncate">{currentUser?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <button onClick={handleMakePostAndClose} className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-brand-text font-semibold hover:bg-brand-bg transition-colors rounded-lg">
                          <img src={iconUrls.pencil} alt="" className="w-5 h-5" />
                          <span>Make a Post</span>
                        </button>
                        <button onClick={() => currentUser && handleNavigateAndClose({ type: 'profile', userId: currentUser.uid })} disabled={!currentUser} className={`w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-semibold hover:bg-brand-bg transition-colors rounded-lg ${isProfileActive ? 'text-brand-accent' : 'text-brand-text'}`}>
                          <img src={iconUrls.user} alt="" className="w-5 h-5" />
                          <span>My Profile</span>
                        </button>
                      </div>
                      <div className="p-2 border-t border-brand-border/80">
                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-brand-accent font-semibold hover:bg-brand-accent-light transition-colors rounded-lg">
                          <img src={iconUrls.signOut} alt="" className="w-5 h-5" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;