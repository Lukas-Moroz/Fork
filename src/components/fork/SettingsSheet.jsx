import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BellOff, Globe, Users, Lock, Mail, ExternalLink } from 'lucide-react';

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', desc: 'Everyone can see your pins', icon: Globe },
  { value: 'friends', label: 'Friends only', desc: 'Only your friends can see your pins', icon: Users },
  { value: 'private', label: 'Private', desc: 'Only you can see your pins', icon: Lock },
];

export function NotificationsSheet({ open, profile, onSave, onClose }) {
  const [enabled, setEnabled] = useState(profile?.notifications_enabled ?? true);

  useEffect(() => {
    if (open) setEnabled(profile?.notifications_enabled ?? true);
  }, [open]);

  const handleSave = () => {
    onSave({ notifications_enabled: enabled });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card w-full max-w-[390px] rounded-t-2xl p-5 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Notifications</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setEnabled(true)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${enabled ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
              >
                <Bell className={`w-5 h-5 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className="font-semibold text-sm">Enabled</p>
                  <p className="text-xs text-muted-foreground">Get notified when friends pin new places</p>
                </div>
              </button>
              <button
                onClick={() => setEnabled(false)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${!enabled ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
              >
                <BellOff className={`w-5 h-5 ${!enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className="font-semibold text-sm">Disabled</p>
                  <p className="text-xs text-muted-foreground">No push or in-app notifications</p>
                </div>
              </button>
            </div>

            <button
              onClick={handleSave}
              className="w-full mt-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-all"
            >
              Save
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PrivacySheet({ open, profile, onSave, onClose }) {
  const [mode, setMode] = useState(profile?.privacy_mode || 'friends');

  useEffect(() => {
    if (open) setMode(profile?.privacy_mode || 'friends');
  }, [open]);

  const handleSave = () => {
    onSave({ privacy_mode: mode });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card w-full max-w-[390px] rounded-t-2xl p-5 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Privacy</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">Choose who can see your saved pins</p>

            <div className="space-y-3">
              {PRIVACY_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${active ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-left">
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSave}
              className="w-full mt-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-all"
            >
              Save
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function HelpSheet({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card w-full max-w-[390px] rounded-t-2xl p-5 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Help & Feedback</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <a
                href="mailto:hello@fork.app"
                className="flex items-center gap-4 p-4 bg-muted rounded-xl active:scale-[0.98] transition-all"
              >
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Email us</p>
                  <p className="text-xs text-muted-foreground">hello@fork.app</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </a>

              <div className="p-4 bg-muted rounded-xl">
                <p className="font-semibold text-sm mb-1">About Fork</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fork helps you save and discover restaurants from social media. Pin places from Instagram, TikTok, YouTube and more — and share them with friends.
                </p>
              </div>

              <div className="p-4 bg-muted rounded-xl">
                <p className="font-semibold text-sm mb-1">Version</p>
                <p className="text-xs text-muted-foreground">Fork v1.0.0</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}