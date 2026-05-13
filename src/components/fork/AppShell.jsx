import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const HIDE_NAV_PATTERNS = ['/place/', '/friend/'];

export default function AppShell() {
  const location = useLocation();
  const hideNav = HIDE_NAV_PATTERNS.some(p => location.pathname.startsWith(p));

  return (
    <div className="mx-auto max-w-[390px] min-h-screen bg-background relative shadow-2xl">
      <Outlet />
      {!hideNav && <BottomNav />}
    </div>
  );
}