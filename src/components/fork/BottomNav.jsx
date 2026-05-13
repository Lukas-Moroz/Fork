import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, Bookmark, Users, User } from 'lucide-react';
import { useFork } from '../../context/ForkContext';

const tabs = [
  { path: '/', icon: Map, label: 'Map' },
  { path: '/saved', icon: Bookmark, label: 'Saved' },
  { path: '/friends', icon: Users, label: 'Friends' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const { pendingRequests } = useFork();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-nav border-t border-white/10 z-50">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          const isFriends = path === '/friends';
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center gap-0.5 py-1.5 px-3 transition-colors ${
                active ? 'text-primary' : 'text-nav-foreground/50'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
                {isFriends && pendingRequests.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}