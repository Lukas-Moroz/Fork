import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Check, UserPlus } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const ICON_MAP = {
  pin: { Icon: MapPin, color: 'text-primary bg-primary/10' },
  visited: { Icon: Check, color: 'text-green-600 bg-green-100' },
  friend: { Icon: UserPlus, color: 'text-friend-pin bg-friend-pin/10' },
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop';

export default function ActivityFeed({ places, friends }) {
  const navigate = useNavigate();
  const activities = [
    ...places.filter(p => p.savedBy === 'me').map(p => ({
      id: `pin-${p.id}`,
      type: 'pin',
      text: `You pinned ${p.name}`,
      date: p.savedDate,
      image: p.image,
      placeId: p.id,
    })),
    ...places.filter(p => p.visited && p.savedBy === 'me').map(p => ({
      id: `visit-${p.id}`,
      type: 'visited',
      text: `Visited ${p.name}`,
      date: p.updated_date || p.savedDate,
      image: p.image,
      placeId: p.id,
    })),
    ...places.filter(p => p.savedBy !== 'me').map(p => ({
      id: `friend-pin-${p.id}`,
      type: 'friend',
      text: `${p.savedBy} pinned ${p.name}`,
      date: p.savedDate,
      image: p.image,
      placeId: p.id,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);

  if (activities.length === 0) return null;

  return (
    <div className="px-4 mt-5">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent activity</h2>
      <div className="space-y-2">
        {activities.map(a => {
          const { Icon, color } = ICON_MAP[a.type];
          return (
            <div key={a.id} onClick={() => a.placeId && navigate(`/place/${a.placeId}`)} className={`flex items-center gap-3 py-2 ${a.placeId ? 'cursor-pointer active:bg-muted rounded-lg px-1 -mx-1 transition-colors' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.text}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(a.date)}</p>
              </div>
              <img
                src={a.image || FALLBACK_IMAGE}
                alt=""
                className="w-9 h-9 rounded-lg object-cover shrink-0"
                onError={e => { e.target.src = FALLBACK_IMAGE; }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}