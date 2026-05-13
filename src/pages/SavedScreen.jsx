import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, CheckSquare, Square, Trash2, Folder } from 'lucide-react';
import { useFork } from '../context/ForkContext';
import PlaceCard from '../components/fork/PlaceCard';
import { LoadingSpinner, ErrorState } from '../components/fork/LoadingState';
import CollectionsTab from '../components/fork/CollectionsTab';

const FILTERS = ['All', 'Mine', 'Friends', 'Visited', 'Wishlist'];
const PRICE_FILTERS = ['Any', '$', '$$', '$$$', '$$$$'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'A–Z' },
];

export default function SavedScreen() {
  const { places, placesLoading, placesError, reloadPlaces, updatePlace, deletePlace } = useFork();
  const [mainTab, setMainTab] = useState('places'); // 'places' | 'collections'
  const [activeFilter, setActiveFilter] = useState('All');
  const [cuisineFilter, setCuisineFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [showSort, setShowSort] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [priceFilter, setPriceFilter] = useState('Any');

  const cuisines = useMemo(() => {
    const set = new Set(places.map(p => p.cuisine).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [places]);

  const filteredPlaces = useMemo(() => {
    let list = places.filter(p => {
      const ownerMatch = activeFilter === 'All'
        || (activeFilter === 'Mine' && p.savedBy === 'me')
        || (activeFilter === 'Friends' && p.savedBy !== 'me')
        || (activeFilter === 'Visited' && p.visited)
        || (activeFilter === 'Wishlist' && !p.visited);
      const cuisineMatch = cuisineFilter === 'All' || p.cuisine === cuisineFilter;
      const priceMatch = priceFilter === 'Any' || p.price_range === priceFilter;
      const searchMatch = !search || p.name.toLowerCase().includes(search.toLowerCase())
        || p.address?.toLowerCase().includes(search.toLowerCase())
        || p.cuisine?.toLowerCase().includes(search.toLowerCase());
      return ownerMatch && cuisineMatch && priceMatch && searchMatch;
    });
    if (sort === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => new Date(b.created_date || b.savedDate) - new Date(a.created_date || a.savedDate));
    return list;
  }, [places, activeFilter, cuisineFilter, search, sort]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkVisited = () => {
    selected.forEach(id => updatePlace(id, { visited: true }));
    setSelected(new Set());
    setSelectMode(false);
  };

  const handleBulkUnvisited = () => {
    selected.forEach(id => updatePlace(id, { visited: false }));
    setSelected(new Set());
    setSelectMode(false);
  };

  const handleSelectAll = () => {
    if (selected.size === filteredPlaces.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredPlaces.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
    selected.forEach(id => deletePlace(id));
    setSelected(new Set());
    setSelectMode(false);
  };

  return (
    <div className="min-h-[calc(100dvh-56px)] bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Saved</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filteredPlaces.length} of {places.length} places</p>

          {places.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1.5 w-28 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(places.filter(p => p.visited).length / places.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                {places.filter(p => p.visited).length}/{places.length} visited
              </span>
            </div>
          )}
        </div>
        <div className="flex items-start gap-2">
          {mainTab === 'places' && (
            <button
              onClick={() => { setSelectMode(v => !v); setSelected(new Set()); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${selectMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          )}
        <div className="relative">
          <button
            onClick={() => setShowSort(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${showSort ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {SORT_OPTIONS.find(s => s.value === sort)?.label}
          </button>
          {showSort && (
            <div className="absolute right-0 top-10 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden">
              {SORT_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => { setSort(s.value); setShowSort(false); }}
                  className={`block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${sort === s.value ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 mb-3">
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => setMainTab('places')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${mainTab === 'places' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            📍 Places
          </button>
          <button
            onClick={() => setMainTab('collections')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${mainTab === 'collections' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            <Folder className="w-3.5 h-3.5" />
            Collections
          </button>
        </div>
      </div>

      {mainTab === 'collections' && <CollectionsTab />}
      {mainTab !== 'places' ? null : <>

      {/* Bulk action bar */}
      {selectMode && (
        <div className="mx-4 mb-3 flex items-center gap-2 p-3 bg-card border border-border rounded-xl shadow-sm flex-wrap">
          <button onClick={handleSelectAll} className="text-xs text-primary font-semibold">
            {selected.size === filteredPlaces.length ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-xs text-muted-foreground flex-1">{selected.size > 0 ? `${selected.size} selected` : 'Tap to select'}</span>
          {selected.size > 0 && <>
            <button
              onClick={handleBulkVisited}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Visited
            </button>
            <button
              onClick={handleBulkUnvisited}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-semibold"
            >
              <Square className="w-3.5 h-3.5" />
              Unvisit
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>}
        </div>
      )}

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search places..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-2 space-y-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="w-px bg-border mx-1 self-stretch" />
          {cuisines.map(c => (
            <button
              key={c}
              onClick={() => setCuisineFilter(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                cuisineFilter === c
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {PRICE_FILTERS.map(p => (
            <button
              key={p}
              onClick={() => setPriceFilter(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                priceFilter === p
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-2">
        {placesLoading ? (
          <LoadingSpinner message="Loading places..." />
        ) : placesError ? (
          <ErrorState message={placesError} onRetry={reloadPlaces} />
        ) : (
          <>
            {filteredPlaces.map(place => (
              <div key={place.id} className="relative flex items-center gap-2">
                {selectMode && (
                  <button
                    onClick={() => toggleSelect(place.id)}
                    className="shrink-0 w-6 h-6 flex items-center justify-center"
                  >
                    {selected.has(place.id)
                      ? <CheckSquare className="w-5 h-5 text-primary" />
                      : <Square className="w-5 h-5 text-muted-foreground" />
                    }
                  </button>
                )}
                <div className={`flex-1 ${selectMode ? 'pointer-events-none' : ''}`}>
                  <PlaceCard place={place} />
                </div>
              </div>
            ))}
            {filteredPlaces.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm space-y-3">
                <p>No places match your filters</p>
                {(activeFilter !== 'All' || cuisineFilter !== 'All' || search) && (
                  <button
                    onClick={() => { setActiveFilter('All'); setCuisineFilter('All'); setSearch(''); setPriceFilter('Any'); }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      </> }
    </div>
  );
}