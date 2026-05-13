import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, ExternalLink, Check, Star, Navigation, Share2, Trash2, Pencil, Folder } from 'lucide-react';
import { useFork } from '../context/ForkContext';
import PlatformBadge from '../components/fork/PlatformBadge';
import PlaceCard from '../components/fork/PlaceCard';
import CollectionsSheet from '../components/fork/CollectionsSheet';

export default function PlaceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { places, updatePlace, deletePlace } = useFork();

  const place = places.find(p => p.id === id);

  // All hooks must be declared before any early return
  const [notes, setNotes] = useState('');
  const [shared, setShared] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [visitedAnim, setVisitedAnim] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [editingCuisine, setEditingCuisine] = useState(false);
  const [editCuisine, setEditCuisine] = useState('');

  // Sync notes when place loads async
  useEffect(() => {
    if (place?.notes !== undefined) setNotes(place.notes);
  }, [place?.id]);

  if (!place) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <div className="w-7 h-7 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Loading place...</p>
      </div>
    );
  }

  const isMine = place.savedBy === 'me';
  const sameCuisine = places.filter(p => p.id !== place.id && p.cuisine === place.cuisine).slice(0, 3);
  const otherNeeded = Math.max(0, 3 - sameCuisine.length);
  const sameCuisineIds = new Set(sameCuisine.map(p => p.id));
  const otherPlaces = otherNeeded > 0
    ? places.filter(p => p.id !== place.id && !sameCuisineIds.has(p.id)).slice(0, otherNeeded)
    : [];
  const nearbyPlaces = [...sameCuisine, ...otherPlaces];
  const hasCoords = place.coords && place.coords.length === 2 && place.coords[0] && place.coords[1];

  const handleVisitedToggle = () => {
    updatePlace(place.id, { visited: !place.visited });
    if (!place.visited) { setVisitedAnim(true); setTimeout(() => setVisitedAnim(false), 600); }
  };
  const handleNotesSave = () => {
    updatePlace(place.id, { notes });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1500);
  };

  const handleShare = () => {
    const deepLink = `${window.location.origin}/place/${place.id}`;
    const text = `Check out ${place.name} on Fork! 🍴`;
    if (navigator.share) {
      navigator.share({ title: place.name, text, url: deepLink }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${deepLink}`).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleDelete = () => {
    deletePlace(place.id);
    navigate(-1);
  };

  const handleNameSave = () => {
    if (editName.trim()) updatePlace(place.id, { name: editName.trim() });
    setEditingName(false);
  };

  const handleCuisineSave = () => {
    if (editCuisine.trim()) updatePlace(place.id, { cuisine: editCuisine.trim() });
    setEditingCuisine(false);
  };

  const platformAction = {
    instagram: 'View on Instagram',
    tiktok: 'Watch on TikTok',
    youtube: 'Watch on YouTube',
    x: 'View on X',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative">
        <img
          src={imgError || !place.image ? 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop' : place.image}
          alt={place.name}
          className="w-full h-56 object-cover"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setCollectionsOpen(true)}
            className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center"
          >
            <Folder className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleShare}
            className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center"
          >
            {shared ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-6 relative z-10">
        {/* Main Card */}
        <div className="bg-card rounded-2xl p-5 shadow-lg border border-border/50 space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-start gap-2 mb-1">
              {editingName ? (
                <div className="flex-1 flex gap-2">
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }}
                    className="flex-1 text-xl font-extrabold bg-muted rounded-lg px-2 py-0.5 outline-none"
                  />
                  <button onClick={handleNameSave} className="text-primary text-xs font-semibold">Save</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <h1 className="text-xl font-extrabold">{place.name}</h1>
                  {isMine && (
                    <button onClick={() => { setEditName(place.name); setEditingName(true); }} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5 shrink-0 mt-1">
                {editingCuisine ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={editCuisine}
                      onChange={e => setEditCuisine(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCuisineSave(); if (e.key === 'Escape') setEditingCuisine(false); }}
                      className="text-xs bg-muted rounded-lg px-2 py-0.5 outline-none w-24"
                    />
                    <button onClick={handleCuisineSave} className="text-primary text-[10px] font-semibold">Save</button>
                  </div>
                ) : (
                  <span
                    onClick={() => isMine && (setEditCuisine(place.cuisine || ''), setEditingCuisine(true))}
                    className={`text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium ${isMine ? 'cursor-pointer hover:bg-muted' : ''}`}
                  >
                    {place.cuisine}
                  </span>
                )}
                {place.price_range && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">{place.price_range}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PlatformBadge platform={place.platform} />
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${hasCoords ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <p className="text-sm">{place.address || 'Address not available'}</p>
              {hasCoords ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.coords[0]},${place.coords[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-1"
                >
                  <Navigation className="w-3 h-3" />
                  Get directions
                </a>
              ) : (
                <span className="text-[10px] text-muted-foreground mt-0.5 block">No map coordinates — won't appear on map</span>
              )}
            </div>
          </div>

          {/* Watch original — only show if there's a link */}
          {place.link && (
            <a
              href={place.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-foreground text-background rounded-xl font-semibold text-sm active:scale-[0.98] transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              {platformAction[place.platform] || 'Watch original video'}
            </a>
          )}

          {/* Saved by */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isMine ? 'bg-primary' : 'bg-friend-pin'}`} />
              <span className="text-xs text-muted-foreground">
                {isMine ? 'Saved by you' : `Saved by ${place.savedBy}`} · {place.savedDate}
              </span>
            </div>
            {/* Rating */}
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => updatePlace(place.id, { rating: star === place.rating ? null : star })}
                  className="p-0.5"
                >
                  <Star className={`w-4 h-4 transition-colors ${place.rating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                </button>
              ))}
              {place.rating && <span className="text-xs text-muted-foreground ml-1">{place.rating}/5</span>}
            </div>
          </div>

          {/* Emoji Reactions */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your reaction</label>
            <div className="flex gap-2 mt-2">
              {[
                { emoji: '🔥', label: 'Fire' },
                { emoji: '😍', label: 'Love' },
                { emoji: '👌', label: 'Solid' },
                { emoji: '😐', label: 'Meh' },
                { emoji: '🤔', label: 'Unsure' },
              ].map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={() => updatePlace(place.id, { reaction: place.reaction === emoji ? null : emoji })}
                  title={label}
                  className={`flex-1 py-2.5 rounded-xl text-xl transition-all ${
                    place.reaction === emoji
                      ? 'bg-primary/15 ring-2 ring-primary scale-110'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Visited Toggle */}
          <button
            onClick={handleVisitedToggle}
            className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
              place.visited ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
            } ${visitedAnim ? 'scale-105' : 'scale-100'}`}
          >
            <Check className="w-4 h-4" />
            {place.visited ? '✓ Been here!' : 'Mark as visited'}
          </button>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
              {notes !== (place.notes || '') && (
                <button
                  onClick={handleNotesSave}
                  className="text-xs text-primary font-semibold flex items-center gap-1"
                >
                  {notesSaved ? <><Check className="w-3 h-3" /> Saved</> : 'Save'}
                </button>
              )}
              {notesSaved && notes === (place.notes || '') && (
                <span className="text-xs text-green-500 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => { if (notes.trim() !== (place.notes || '').trim()) handleNotesSave(); }}
              placeholder="Add your thoughts..."
              rows={3}
              className="w-full mt-0.5 bg-muted rounded-xl p-3 text-sm outline-none resize-none placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Delete — only for own pins */}
          {isMine && (
            <div>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 text-xs text-destructive font-semibold py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove pin
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Sure?</span>
                  <button
                    onClick={handleDelete}
                    className="text-xs text-destructive font-bold"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-muted-foreground font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      <CollectionsSheet open={collectionsOpen} onClose={() => setCollectionsOpen(false)} addToPlaceId={place.id} />

        {/* Nearby */}
        {nearbyPlaces.length > 0 && (
          <div className="mt-5">
            <h2 className="text-sm font-bold mb-3 text-muted-foreground">More pins</h2>
            <div className="space-y-2">
              {nearbyPlaces.map(p => (
                <PlaceCard key={p.id} place={p} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}