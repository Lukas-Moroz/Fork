import { db } from '@/lib/db';

import React, { useState, useEffect } from 'react';
import { Folder, ChevronRight } from 'lucide-react';

import { useFork } from '../../context/ForkContext';
import { useNavigate } from 'react-router-dom';

export default function CollectionsTab() {
  const { currentUser, places } = useFork();
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!currentUser?.email) return;
    db.entities.Collection.filter({ owner_email: currentUser.email })
      .then(data => { setCollections(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentUser?.email]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Folder className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-semibold text-sm">No collections yet</p>
        <p className="text-xs mt-1">Save a place to a collection to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-4">
      {collections.map(col => {
        const colPlaces = (col.place_ids || [])
          .map(id => places.find(p => p.id === id))
          .filter(Boolean);
        const isOpen = expanded === col.id;
        return (
          <div key={col.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : col.id)}
              className="w-full flex items-center gap-3 p-3 text-left"
            >
              <span className="text-2xl">{col.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm">{col.name}</p>
                <p className="text-xs text-muted-foreground">{colPlaces.length} places</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && colPlaces.length > 0 && (
              <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
                {colPlaces.map(p => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/place/${p.id}`)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&h=100&fit=crop'}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&h=100&fit=crop'; }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.cuisine}</p>
                    </div>
                    {p.visited && <span className="ml-auto text-[10px] text-green-600 font-semibold shrink-0">✓ Visited</span>}
                  </button>
                ))}
              </div>
            )}
            {isOpen && colPlaces.length === 0 && (
              <div className="px-3 pb-3 pt-2 border-t border-border/50 text-xs text-muted-foreground text-center">
                No places in this collection yet
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}