import { db } from '@/lib/db';

import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useFork } from '../../context/ForkContext';
import { useNavigate } from 'react-router-dom';

const EMOJIS = ['📌', '🍜', '🍕', '💑', '🥩', '🌮', '🍣', '☕', '🥂', '🏆'];

export default function CollectionsSheet({ open, onClose, addToPlaceId = null }) {
  const { currentUser, places } = useFork();
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📌');
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);
  const [expandedCol, setExpandedCol] = useState(null);

  useEffect(() => {
    if (open && currentUser?.email) loadCollections();
  }, [open, currentUser?.email]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await db.entities.Collection.filter({ owner_email: currentUser.email });
      setCollections(data);
    } catch {
      // Leave collections empty; user can retry by reopening
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const created = await db.entities.Collection.create({
      name: newName.trim(),
      emoji: newEmoji,
      place_ids: addToPlaceId ? [addToPlaceId] : [],
      owner_email: currentUser.email,
    });
    setCollections(prev => [created, ...prev]);
    setNewName('');
    setCreating(false);
    if (addToPlaceId) { setSaved(created.id); setTimeout(() => onClose(), 1000); }
  };

  const handleTogglePlace = async (col) => {
    if (!addToPlaceId) return;
    const ids = col.place_ids || [];
    const already = ids.includes(addToPlaceId);
    const newIds = already ? ids.filter(i => i !== addToPlaceId) : [...ids, addToPlaceId];
    setSaving(col.id);
    const updated = await db.entities.Collection.update(col.id, { place_ids: newIds });
    setCollections(prev => prev.map(c => c.id === col.id ? updated : c));
    setSaving(null);
    if (!already) { setSaved(col.id); setTimeout(() => onClose(), 1000); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await db.entities.Collection.delete(id);
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const myPlaceCount = (col) => (col.place_ids || []).filter(id => places.find(p => p.id === id)).length;

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
            className="bg-card w-full max-w-[390px] rounded-t-2xl p-5 sheet-safe-pb max-h-[80vh] overflow-y-auto no-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{addToPlaceId ? 'Save to Collection' : 'My Collections'}</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-2">
                {collections.map(col => {
                  const inCollection = addToPlaceId && (col.place_ids || []).includes(addToPlaceId);
                  const isSaved = saved === col.id;
                  return (
                    <div key={col.id} className={`rounded-xl border-2 transition-all overflow-hidden ${inCollection ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                      <button
                        onClick={() => addToPlaceId ? handleTogglePlace(col) : setExpandedCol(expandedCol === col.id ? null : col.id)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        <span className="text-2xl">{col.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{col.name}</p>
                          <p className="text-xs text-muted-foreground">{myPlaceCount(col)} places</p>
                        </div>
                        {saving === col.id && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                        {isSaved && <Check className="w-4 h-4 text-primary" />}
                        {inCollection && !saving && !isSaved && <Check className="w-4 h-4 text-primary" />}
                        {!addToPlaceId && (
                          <>
                            {expandedCol === col.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            <button onClick={(e) => handleDelete(col.id, e)} className="p-1 text-destructive/60 hover:text-destructive ml-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </button>
                      {!addToPlaceId && expandedCol === col.id && (
                        <div className="border-t border-border divide-y divide-border/50">
                          {(col.place_ids || []).map(pid => {
                            const p = places.find(pl => pl.id === pid);
                            if (!p) return null;
                            return (
                              <div key={pid} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors">
                                <button onClick={() => { onClose(); navigate(`/place/${pid}`); }} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                                  <img src={p.image || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop'} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" onError={e => { e.target.src = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop'; }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate">{p.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{p.cuisine}</p>
                                  </div>
                                  {p.visited && <Check className="w-3 h-3 text-green-500 shrink-0" />}
                                </button>
                                <button
                                  onClick={async () => {
                                    const newIds = (col.place_ids || []).filter(i => i !== pid);
                                    const updated = await db.entities.Collection.update(col.id, { place_ids: newIds });
                                    setCollections(prev => prev.map(c => c.id === col.id ? updated : c));
                                  }}
                                  className="p-1 text-destructive/40 hover:text-destructive shrink-0"
                                  title="Remove from collection"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                          {(col.place_ids || []).filter(pid => places.find(pl => pl.id === pid)).length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-3">No places yet</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {creating ? (
                  <div className="p-3 bg-muted rounded-xl space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => setNewEmoji(e)}
                          className={`text-xl p-1 rounded-lg ${newEmoji === e ? 'bg-primary/20 ring-2 ring-primary' : ''}`}>{e}</button>
                      ))}
                    </div>
                    <input
                      autoFocus
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      placeholder="Collection name..."
                      maxLength={60}
                      className="w-full bg-card rounded-lg px-3 py-2 text-sm outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleCreate} disabled={!newName.trim()}
                        className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-40">
                        Create
                      </button>
                      <button onClick={() => setCreating(false)} className="px-4 py-2 bg-border rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreating(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-sm font-semibold">New collection</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}