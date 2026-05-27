import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Check, BookmarkPlus } from 'lucide-react';
import { useFork } from '../context/ForkContext';
import PlaceCard from '../components/fork/PlaceCard';

export default function FriendProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { friends, places } = useFork();

  const [shared, setShared] = useState(false);
  const [savedPin, setSavedPin] = useState(null);
  const { addPlace } = useFork();
  const decodedName = decodeURIComponent(name);
  const friend = friends.find(f => f.name.toLowerCase() === decodedName.toLowerCase());
  const friendName = friend?.name || decodedName;
  const friendPlaces = places.filter(p =>
    p.savedBy !== 'me' && (
      p.savedBy?.toLowerCase() === friendName.toLowerCase() ||
      p.saved_by_name?.toLowerCase() === friendName.toLowerCase()
    )
  );
  // Names already in my list to avoid duplicates
  const myPlaceNames = new Set(places.filter(p => p.savedBy === 'me').map(p => p.name.toLowerCase()));
  const sharedCount = friendPlaces.filter(p => myPlaceNames.has(p.name.toLowerCase())).length;
  const visitedCount = friendPlaces.filter(p => p.visited).length;

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/friend/${encodeURIComponent(friendName)}`).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleSavePin = (place) => {
    addPlace({ ...place, visited: false, notes: '' });
    setSavedPin(place.id);
    setTimeout(() => setSavedPin(null), 2000);
  };

  if (!friend) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <p className="text-muted-foreground">Friend not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-primary/30 to-friend-pin/30" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        {/* Avatar overlapping */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div className="relative">
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-20 h-20 rounded-full border-4 border-card object-cover"
            />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center mt-12 mb-5 px-4">
        <h1 className="text-xl font-extrabold">{friend.name}</h1>

        {/* Stats */}
        <div className="flex gap-5 mt-4">
          <div className="text-center">
            <p className="text-lg font-bold">{friendPlaces.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Pins</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold">{visitedCount}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Visited</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold">{friendPlaces.length - visitedCount}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Wishlist</p>
          </div>
          {sharedCount > 0 && (
            <>
              <div className="w-px bg-border" />
              <div className="text-center">
                <p className="text-lg font-bold">{sharedCount}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Shared</p>
              </div>
            </>
          )}
        </div>

        {/* Action */}
        <button
          onClick={handleShare}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold active:scale-[0.97] transition-all"
        >
          {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {shared ? 'Copied!' : 'Share profile'}
        </button>
      </div>

      {/* Their pins */}
      <div className="px-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {friend.name}'s pins
        </h2>
        {friendPlaces.length > 0 ? (
          <div className="space-y-2">
            {friendPlaces.map(p => (
              <div key={p.id} className="relative">
                <PlaceCard place={p} />
                {!myPlaceNames.has(p.name.toLowerCase()) && (
                  <button
                    onClick={() => handleSavePin(p)}
                    className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${savedPin === p.id ? 'bg-green-500 text-white' : 'bg-card border border-border shadow-sm text-muted-foreground hover:text-primary'}`}
                  >
                    {savedPin === p.id ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                    {savedPin === p.id ? 'Saved!' : 'Save'}
                  </button>
                )}
                {myPlaceNames.has(p.name.toLowerCase()) && savedPin !== p.id && (
                  <span className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-bold bg-muted text-muted-foreground">In list</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-sm text-muted-foreground">
            No shared pins yet
          </div>
        )}
      </div>
    </div>
  );
}