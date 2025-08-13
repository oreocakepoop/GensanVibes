
import React from 'react';
import { UserListItemSkeleton } from './UserListItem.tsx';

const SidebarSkeleton: React.FC = () => {
    return (
        <aside className="hidden md:block animate-pulse space-y-4">
            <div className="bg-brand-surface p-4 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <div className="h-6 w-3/5 bg-brand-border rounded mb-4"></div>
                <div className="flex flex-col gap-2">
                    {[...Array(3)].map((_, i) => <UserListItemSkeleton key={i} />)}
                </div>
            </div>

            <footer className="mt-4 text-xs text-brand-text-secondary flex gap-x-3 gap-y-1 flex-wrap">
                <div className="h-4 w-10 bg-brand-border rounded"></div>
                <div className="h-4 w-8 bg-brand-border rounded"></div>
                <div className="h-4 w-16 bg-brand-border rounded"></div>
                <div className="h-4 w-8 bg-brand-border rounded"></div>
                <div className="h-4 w-8 bg-brand-border rounded"></div>
                <div className="h-4 w-12 bg-brand-border rounded"></div>
                <div className="h-4 w-10 bg-brand-border rounded"></div>
            </footer>
        </aside>
    );
};

export default SidebarSkeleton;