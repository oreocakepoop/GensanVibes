
import React from 'react';
import UserSuggestions from './UserSuggestions.tsx';

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:block space-y-4">
      <div className="bg-brand-surface p-4 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <h3 className="text-brand-text font-bold mb-4 text-base">Suggestions For You</h3>
        <UserSuggestions />
      </div>

      <footer className="mt-4 text-xs text-brand-text-secondary flex gap-x-3 gap-y-1 flex-wrap">
          <a href="#" className="hover:underline hover:text-brand-text transition-colors">About</a>
          <a href="#" className="hover:underline hover:text-brand-text transition-colors">Apps</a>
          <a href="#" className="hover:underline hover:text-brand-text transition-colors">Developers</a>
          <a href="#" className="hover:underline hover:text-brand-text transition-colors">Help</a>
          <a href="#" className="hover:underline hover:text-brand-text transition-colors">Jobs</a>
          <a href="#" className="hover:underline hover:text-brand-text transition-colors">Privacy</a>
          <a href="#" className="hover:underline hover:text-brand-text transition-colors">Terms</a>
      </footer>
    </aside>
  );
};

export default Sidebar;