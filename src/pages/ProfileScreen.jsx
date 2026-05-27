import { db } from '@/lib/db';

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Eye, Users, Pencil, ChevronRight, LogOut, Bookmark, Share2, Check, Star, TrendingUp, Folder, X, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useFork } from '../context/ForkContext';
import EditProfileSheet from '../components/fork/EditProfileSheet';
import ActivityFeed from '../components/fork/ActivityFeed';
import { LoadingSpinner } from '../components/fork/LoadingState';
import { NotificationsSheet, PrivacySheet, HelpSheet } from '../components/fork/SettingsSheet';

import CollectionsSheet from '../components/fork/CollectionsSheet';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { places, friends, profile, profileLoading, updateProfile } = useFork();
  const [editOpen, setEditOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [profileCopied, setProfileCopied] = useState(false);
  const [exported, setExported] = useState(false);
  const [quickList, setQuickList] = useState(null); // null | 'visited' | 'wishlist' | 'all'

  const { myPlaces, visitedCount, wishlistCount, avgRating, topCuisine } = useMemo(() => {
    const mine = places.filter(p => p.savedBy === 'me');
    const visited = mine.filter(p => p.visited);
    const rated = mine.filter(p => p.rating);
    const avg = rated.length > 0
      ? (rated.reduce((s, p) => s + p.rating, 0) / rated.length).toFixed(1)
      : null;
    const counts = {};
    mine.forEach(p => { if (p.cuisine) counts[p.cuisine] = (counts[p.cuisine] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return {
      myPlaces: mine,
      visitedCount: visited.length,
      wishlistCount: mine.length - visited.length,
      avgRating: avg,
      topCuisine: top,
    };
  }, [places]);

  if (profileLoading) {
    return <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center"><LoadingSpinner message="Loading profile..." /></div>;
  }

  const handleShareProfile = () => {
    const url = `${window.location.origin}/friend/${encodeURIComponent(profile.name)}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setProfileCopied(true);
    setTimeout(() => setProfileCopied(false), 2000);
  };

  const handleExportList = () => {
    const lines = myPlaces.map((p, i) =>
      `${i + 1}. ${p.name}${p.cuisine ? ` (${p.cuisine})` : ''}${p.address ? ` — ${p.address}` : ''}${p.visited ? ' ✓' : ''}`
    ).join('\n');
    const text = `🍴 My Fork List\n\n${lines}\n\nShared from Fork`;
    navigator.clipboard.writeText(text).catch(() => {});
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="min-h-[calc(100dvh-56px)] bg-background pb-24 overflow-y-auto no-scrollbar">

      {/* Cover gradient */}
      <div className="h-28 bg-gradient-to-br from-primary/40 via-primary/20 to-friend-pin/20 relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={handleShareProfile}
            className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full px-3 py-1.5 text-xs font-semibold"
          >
            {profileCopied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
            {profileCopied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full px-3 py-1.5 text-xs font-semibold"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>
      </div>

      {/* Avatar + name */}
      <div className="px-4 -mt-10 relative z-10 mb-4">
        <div className="flex items-end justify-between">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-20 h-20 rounded-full border-4 border-card object-cover shadow-lg"
          />
        </div>
        <div className="mt-3">
          <h1 className="text-xl font-extrabold leading-tight">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.username}</p>
          {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
          {profile.location && (
            <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs">{profile.location}</span>
            </div>
          )}
        </div>

        {/* Cuisine prefs */}
        {profile.cuisinePrefs?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.cuisinePrefs.map(c => (
              <span key={c} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'all', icon: <MapPin className="w-4 h-4 text-primary mx-auto mb-1" />, count: myPlaces.length, label: 'Pins' },
            { key: 'visited', icon: <Eye className="w-4 h-4 text-green-500 mx-auto mb-1" />, count: visitedCount, label: 'Visited' },
            { key: 'wishlist', icon: <Bookmark className="w-4 h-4 text-yellow-500 mx-auto mb-1" />, count: wishlistCount, label: 'Wishlist' },
            { key: null, icon: <Users className="w-4 h-4 text-friend-pin mx-auto mb-1" />, count: friends.length, label: 'Friends' },
          ].map(({ key, icon, count, label }) => (
            <div
              key={label}
              onClick={() => key && setQuickList(quickList === key ? null : key)}
              className={`bg-card rounded-xl p-3 text-center border transition-all ${key ? 'cursor-pointer active:scale-95' : ''} ${quickList === key && key ? 'border-primary ring-1 ring-primary' : 'border-border/50'}`}
            >
              {icon}
              <p className="text-lg font-bold">{count}</p>
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick list panel */}
        {quickList && (
          <div className="mt-3 bg-card border border-border/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                {quickList === 'visited' ? 'Visited' : quickList === 'wishlist' ? 'Wishlist' : 'All Pins'}
              </p>
              <button onClick={() => setQuickList(null)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
            <div className="max-h-52 overflow-y-auto no-scrollbar divide-y divide-border/30">
              {(() => {
                const list = quickList === 'visited' ? myPlaces.filter(p => p.visited)
                  : quickList === 'wishlist' ? myPlaces.filter(p => !p.visited)
                  : myPlaces;
                return list.length === 0 ? null : list.map(p => (
                  <div key={p.id} onClick={() => navigate(`/place/${p.id}`)} className="flex items-center gap-3 px-3 py-2.5 active:bg-muted transition-colors cursor-pointer">
                    <img src={p.image || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop'} alt={p.name} className="w-9 h-9 rounded-lg object-cover shrink-0" onError={e => { e.target.src = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop'; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.cuisine}{p.rating ? ` · ★${p.rating}` : ''}</p>
                    </div>
                    {p.visited && <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                  </div>
                ));
              })()}
              {(quickList === 'visited' ? visitedCount : quickList === 'wishlist' ? wishlistCount : myPlaces.length) === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6">Nothing here yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Insight strip */}
      {myPlaces.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex gap-2">
            {avgRating && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/10 rounded-xl">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold text-yellow-700">{avgRating} avg</span>
              </div>
            )}
            {topCuisine && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 rounded-xl">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">#{topCuisine}</span>
              </div>
            )}
            <button
              onClick={() => setCollectionsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-muted rounded-xl ml-auto"
            >
              <Folder className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Lists</span>
            </button>
            <button
              onClick={handleExportList}
              className="flex items-center gap-1.5 px-3 py-2 bg-muted rounded-xl"
            >
              {exported ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className="text-xs font-semibold text-muted-foreground">{exported ? 'Copied!' : 'Export'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <ActivityFeed places={places} friends={friends} />

      {/* Settings */}
      <div className="px-4 mt-5 space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Settings</h2>

        {/* Dark mode toggle */}
        <DarkModeRow />

        {[
          { label: 'Notifications', desc: 'Push & in-app alerts', action: () => setNotifOpen(true) },
          { label: 'Privacy', desc: 'Who can see your pins', action: () => setPrivacyOpen(true) },
          { label: 'Help & feedback', desc: 'Get support', action: () => setHelpOpen(true) },
        ].map(item => (
          <div
            key={item.label}
            onClick={item.action}
            className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div>
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        ))}

        <div
          onClick={() => db.auth.logout()}
          className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div>
            <p className="font-semibold text-sm text-destructive">Sign out</p>
            <p className="text-xs text-muted-foreground mt-0.5">Log out of Fork</p>
          </div>
          <LogOut className="w-4 h-4 text-destructive" />
        </div>
      </div>

      <CollectionsSheet open={collectionsOpen} onClose={() => setCollectionsOpen(false)} />
      <p className="text-center text-[10px] text-muted-foreground mt-8 mb-2">Fork v1.0 — Made with 🍴</p>

      <EditProfileSheet
        open={editOpen}
        profile={profile}
        onSave={updateProfile}
        onClose={() => setEditOpen(false)}
      />
      <NotificationsSheet
        open={notifOpen}
        profile={profile}
        onSave={updateProfile}
        onClose={() => setNotifOpen(false)}
      />
      <PrivacySheet
        open={privacyOpen}
        profile={profile}
        onSave={updateProfile}
        onClose={() => setPrivacyOpen(false)}
      />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

function DarkModeRow() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <div
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div>
        <p className="font-semibold text-sm">Appearance</p>
        <p className="text-xs text-muted-foreground mt-0.5">{isDark ? 'Dark mode' : 'Light mode'}</p>
      </div>
      <div className="w-12 h-6 rounded-full relative transition-colors duration-200" style={{ background: isDark ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 flex items-center justify-center ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`}>
          {isDark ? <Moon className="w-3 h-3 text-primary" /> : <Sun className="w-3 h-3 text-yellow-500" />}
        </div>
      </div>
    </div>
  );
}