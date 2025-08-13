import React, { useState } from 'react';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import Sidebar from './components/Sidebar.tsx';
import PostCreationModal from './components/PostCreationModal.tsx';
import ProfilePage from './components/ProfilePage.tsx';
import SinglePostPage from './components/SinglePostPage.tsx';
import EventsPage from './components/EventsPage.tsx';
import EventDetailPage from './components/EventDetailPage.tsx';
import BarangayChatPage from './components/BarangayChatPage.tsx';
import BarangayHubPage from './components/BarangayHubPage.tsx';
import EventCreationModal from './components/EventCreationModal.tsx';
import FoodTripPlannerPage from './components/FoodTripPlannerPage.tsx';
import DMPage from './components/DMPage.tsx';
import DMConversationPage from './components/DMConversationPage.tsx';
import { Post, PostType, View } from './types.ts';
import { AnimatePresence, motion } from 'framer-motion';

const MainApp: React.FC = () => {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<PostType>(PostType.TEXT);
  const [postToRepost, setPostToRepost] = useState<Post | null>(null);
  const [view, setView] = useState<View>({ type: 'dashboard' });

  const handleOpenPostModal = (postType: PostType) => {
    setPostToRepost(null);
    setSelectedPostType(postType);
    setIsPostModalOpen(true);
  };

  const handleRepost = (post: Post) => {
    setPostToRepost(post);
    setSelectedPostType(PostType.REPOST);
    setIsPostModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsPostModalOpen(false);
    setIsEventModalOpen(false);
    setPostToRepost(null);
  };

  const handleNavigate = (newView: View) => {
    setView(newView);
    window.scrollTo(0, 0); // Scroll to top on navigation change
  };

  const renderContent = () => {
    let key;
    switch(view.type) {
        case 'dashboard':
            const filter = view.filter;
            if (filter) {
                if (filter.type === 'tag') key = `dashboard-tag-${filter.value}`;
                else if (filter.type === 'barangay') key = `dashboard-barangay-${filter.name}`;
                else key = `dashboard-explore`;
            } else {
                key = `dashboard-home`;
            }
            break;
        case 'profile':
            key = `profile-${view.userId}`;
            break;
        case 'post':
            key = `post-${view.postId}`;
            break;
        case 'events':
            key = 'events-page';
            break;
        case 'eventDetail':
            key = `event-detail-${view.eventId}`;
            break;
        case 'barangayChat':
            key = `barangay-chat-${view.barangayName}`;
            break;
        case 'barangayHub':
            key = `barangay-hub-${view.barangayName}`;
            break;
        case 'foodTripPlanner':
            key = 'food-trip-planner';
            break;
        case 'dms':
            key = 'dms-page';
            break;
        case 'dmConversation':
            key = `dm-conversation-${view.conversationId}`;
            break;
    }
    
    const pageVariants = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3 }
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ duration: 0.2 }}
        >
          {view.type === 'profile' ? (
            <ProfilePage userId={view.userId} onNavigate={handleNavigate} onRepost={handleRepost}/>
          ) : view.type === 'post' ? (
            <SinglePostPage postId={view.postId} onNavigate={handleNavigate} onRepost={handleRepost} />
          ) : view.type === 'events' ? (
            <EventsPage onNavigate={handleNavigate} onCreateEvent={() => setIsEventModalOpen(true)} />
          ) : view.type === 'eventDetail' ? (
            <EventDetailPage eventId={view.eventId} onNavigate={handleNavigate} />
          ) : view.type === 'barangayChat' ? (
            <BarangayChatPage barangayName={view.barangayName} onNavigate={handleNavigate} />
          ) : view.type === 'barangayHub' ? (
            <BarangayHubPage barangayName={view.barangayName} onNavigate={handleNavigate} onRepost={handleRepost} />
          ) : view.type === 'foodTripPlanner' ? (
            <FoodTripPlannerPage onNavigate={handleNavigate} />
          ) : view.type === 'dms' ? (
            <DMPage onNavigate={handleNavigate} />
          ) : view.type === 'dmConversation' ? (
            <DMConversationPage conversationId={view.conversationId} onNavigate={handleNavigate} />
          ) : (
            <Dashboard onSelectPostType={handleOpenPostModal} onNavigate={handleNavigate} filter={view.filter} onRepost={handleRepost} />
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen text-brand-text">
      <Header
        onMakePost={() => handleOpenPostModal(PostType.TEXT)}
        onNavigate={handleNavigate}
        currentView={view}
      />
      <main className="w-full max-w-[990px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-8">
          {renderContent()}
          <Sidebar />
        </div>
      </main>
      <AnimatePresence>
        {isPostModalOpen && (
            <PostCreationModal
                isOpen={isPostModalOpen}
                onClose={handleCloseModals}
                postType={selectedPostType}
                postToRepost={postToRepost}
                onNavigate={handleNavigate}
            />
        )}
        {isEventModalOpen && (
            <EventCreationModal 
                isOpen={isEventModalOpen}
                onClose={handleCloseModals}
                onNavigate={handleNavigate}
            />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainApp;