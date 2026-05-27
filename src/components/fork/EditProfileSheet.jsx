import { db } from '@/lib/db';

import React, { useState, useRef } from 'react';
import { X, Camera, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { profileSchema } from '@/lib/schemas';

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
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [cuisinePrefs, setCuisinePrefs] = useState(profile?.cuisinePrefs || []);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
    },
  });

  const bioValue = watch('bio', '');

  React.useEffect(() => {
    if (open && profile) {
      reset({
        name: profile.name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        location: profile.location || '',
      });
      setAvatar(profile.avatar || '');
      setCuisinePrefs(profile.cuisinePrefs || []);
      setPickingAvatar(false);
    }
  }, [open]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      alert('Only JPEG, PNG, WebP, or GIF images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB.');
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      setAvatar(file_url);
      setPickingAvatar(false);
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleCuisine = (c) => {
    setCuisinePrefs(prev =>
      prev.includes(c) ? prev.filter(p => p !== c) : [...prev, c]
    );
  };

  const onSubmit = (data) => {
    onSave({ ...data, avatar, cuisinePrefs });
    onClose();
  };

  const FIELDS = [
    { label: 'Name', key: 'name', placeholder: 'Your name', max: 60 },
    { label: 'Username', key: 'username', placeholder: '@handle', max: 30 },
    { label: 'Bio', key: 'bio', placeholder: 'Food explorer 🍜', max: 200 },
    { label: 'Location', key: 'location', placeholder: 'City, State', max: 100 },
  ];

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
          className="bg-card w-full max-w-[390px] rounded-t-2xl p-5 sheet-safe-pb max-h-[90vh] overflow-y-auto no-scrollbar"
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
              <img src={avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover border-4 border-primary/20" />
              <button
                type="button"
                onClick={() => setPickingAvatar(!pickingAvatar)}
                className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
            </div>
            {pickingAvatar && (
              <div className="w-full space-y-3 mt-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-primary/10 text-primary rounded-xl text-xs font-semibold"
                >
                  Upload a photo
                </button>
                <div className="flex gap-2 flex-wrap justify-center">
                  {AVATAR_OPTIONS.map(url => (
                    <button type="button" key={url} onClick={() => { setAvatar(url); setPickingAvatar(false); }}>
                      <img
                        src={url}
                        alt=""
                        className={`w-12 h-12 rounded-full object-cover border-2 transition-all ${avatar === url ? 'border-primary scale-110' : 'border-transparent'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fields */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3 mb-5">
              {FIELDS.map(({ label, key, placeholder, max }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
                  <input
                    {...register(key)}
                    placeholder={placeholder}
                    maxLength={max}
                    className="w-full mt-1 bg-muted rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50"
                  />
                  {errors[key] && (
                    <p className="text-[10px] text-destructive mt-0.5">{errors[key].message}</p>
                  )}
                  {key === 'bio' && (
                    <p className="text-[10px] text-muted-foreground/60 text-right mt-0.5">{(bioValue || '').length}/{max}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Cuisine prefs */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Favorite cuisines</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CUISINE_PREFS.map(c => {
                  const active = cuisinePrefs.includes(c);
                  return (
                    <button
                      type="button"
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
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-[0.98] transition-all"
            >
              Save changes
            </button>
          </form>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}
