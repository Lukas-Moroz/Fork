const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { useFork } from '../../context/ForkContext';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { currentUser } = useFork();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) return;
    loadNotifs();
    const unsub = db.entities.Notification.subscribe(event => {
      if (event.type === 'create' && event.data.recipient_email === currentUser.email) {
        setNotifs(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setNotifs(prev => prev.map(n => n.id === event.id ? event.data : n));
      } else if (event.type === 'delete') {
        setNotifs(prev => prev.filter(n => n.id !== event.id));
      }
    });
    return unsub;
  }, [currentUser?.email]);

  const loadNotifs = async () => {
    const data = await db.entities.Notification.filter(
      { recipient_email: currentUser.email },
      '-created_date', 20
    );
    setNotifs(data);
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = async () => {
    const unread = notifs.filter(n => !n.read);
    await Promise.all(unread.map(n => db.entities.Notification.update(n.id, { read: true })));
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismiss = async (id, e) => {
    e.stopPropagation();
    await db.entities.Notification.delete(id);
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(v => !v); if (!open && unreadCount > 0) markAllRead(); }}
        className="relative w-9 h-9 bg-card/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center border border-border/50"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[50]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -8 }}
              className="absolute right-0 top-11 w-72 bg-card rounded-2xl shadow-2xl border border-border z-[51] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-bold text-sm">Notifications</h3>
                {notifs.length > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-primary font-semibold">Mark all read</button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto no-scrollbar">
                {notifs.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">All caught up! 🎉</p>
                ) : notifs.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { if (n.link) { setOpen(false); navigate(n.link); } }}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 ${!n.read ? 'bg-primary/5' : ''} ${n.link ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                  >
                    {n.actor_avatar ? (
                      <img src={n.actor_avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-snug">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_date)}</p>
                    </div>
                    <button onClick={(e) => dismiss(n.id, e)} className="text-muted-foreground/40 hover:text-muted-foreground shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}