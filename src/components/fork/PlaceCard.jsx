import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import PlatformBadge from './PlatformBadge';

export default function PlaceCard({ place, compact = false }) {
  const navigate = useNavigate();
  const isMine = place.savedBy === 'me';

  return (
    <div
      onClick={() => navigate(`/place/${place.id}`)}
      className="flex items-center gap-3 p-3 bg-card rounded-xl cursor-pointer active:scale-[0.98] transition-transform border border-border/50"
    >
      <div className="relative shrink-0">
        <img
          src={place.image || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop'}
          alt={place.name}
          className="w-14 h-14 rounded-lg object-cover"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop'; }}
        />
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${isMine ? 'bg-primary' : 'bg-friend-pin'}`} />
        {place.visited && (
          <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">✓</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{place.name}</h3>
          {place.reaction && <span className="text-sm leading-none">{place.reaction}</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
        <p className="text-xs text-muted-foreground truncate">{place.cuisine}</p>
        {place.rating && (
          <>
            <span className="text-muted-foreground text-[10px]">·</span>
            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
            <span className="text-[10px] font-semibold">{place.rating}</span>
          </>
        )}
        {place.price_range && (
          <>
            <span className="text-muted-foreground text-[10px]">·</span>
            <span className="text-[10px] font-medium text-muted-foreground">{place.price_range}</span>
          </>
        )}
        {!compact && <PlatformBadge platform={place.platform} />}
        </div>
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">
              {isMine ? 'Saved by you' : `Saved by ${place.savedBy}`}
            </span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">{place.savedDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}