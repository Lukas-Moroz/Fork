const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef } from 'react';
import { X, Camera, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop&crop=face',
];

const CUISINE_PREFS = ['Japanese', 'Italian', 'Mexican', 'Thai', 'Korean', 'American', 'Chinese', 'Indian', 'Mediterranean', 'French'];

export default function EditProfileSheet({ open, profile, onSave, onClose }) {
  const [form, setForm] = useState({ ...profile });
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (open && profile) setForm({ ...profile });
  }, [open]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, avatar: file_url }));
    setPickingAvatar(false);
    setUploading(false);
  };

  const toggleCuisine = (c) => {
    const prefs = form.cuisinePrefs || [];
    setForm(f => ({
      ...f,
      cuisinePrefs: prefs.includes(c) ? prefs.filter(p => p !== c) : [...prefs, c],
    }));
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="bg-card w-full max-w-[390px] rounded-t-2xl p-5 pb-10 max-h-[90vh] overflow-y-auto no-scrollbar"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Edit Profile</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Avatar picker */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img src={form.avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover border-4 border-primary/20" />
              <button
                onClick={() => setPickingAvatar(!pickingAvatar)}
                className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
            </div>
            {pickingAvatar && (
              <div className="w-full space-y-3 mt-3">
                {/* Upload own photo */}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-primary/10 text-primary rounded-xl text-xs font-semibold"
                >
                  Upload a photo
                </button>
                <div className="flex gap-2 flex-wrap justify-center">
                  {AVATAR_OPTIONS.map(url => (
                    <button key={url} onClick={() => { setForm(f => ({ ...f, avatar: url })); setPickingAvatar(false); }}>
                      <img
                        src={url}
                        alt=""
                        className={`w-12 h-12 rounded-full object-cover border-2 transition-all ${form.avatar === url ? 'border-primary scale-110' : 'border-transparent'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-3 mb-5">
            {[
              { label: 'Name', key: 'name', placeholder: 'Your name' },
              { label: 'Username', key: 'username', placeholder: '@handle' },
              { label: 'Bio', key: 'bio', placeholder: 'Food explorer 🍜' },
              { label: 'Location', key: 'location', placeholder: 'City, State' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
                <input
                  value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full mt-1 bg-muted rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            ))}
          </div>

          {/* Cuisine prefs */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Favorite cuisines</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CUISINE_PREFS.map(c => {
                const active = (form.cuisinePrefs || []).includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCuisine(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {active && <Check className="inline w-3 h-3 mr-1" />}{c}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-[0.98] transition-all"
          >
            Save changes
          </button>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}