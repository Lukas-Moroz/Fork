import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, X, Crosshair, MapPin } from 'lucide-react';
import { useFork } from '../context/ForkContext';
import { createPinIcon } from '../components/fork/MapPinIcon';
import { matchesFilter } from '../utils/placeFilters';
import { useDebounce } from '../hooks/useDebounce';

const NOMINATIM_HEADERS = { 'User-Agent': 'ForkApp/1.0 (food discovery app)' };
import BottomSheet from '../components/fork/BottomSheet';
import AddPlaceModal from '../components/fork/AddPlaceModal';
import NotificationBell from '../components/fork/NotificationBell';
import 'leaflet/dist/leaflet.css';

const FILTER_OPTIONS = ['All', 'Mine', 'Friends', 'Visited', 'Wishlist'];

function MapPins({ filter }) {
  const { places } = useFork();
  const navigate = useNavigate();

  const visible = useMemo(() => places.filter(p => matchesFilter(p, filter)), [places, filter]);

  return (
    <>
      {visible.map(place => {
        const isMine = place.savedBy === 'me';
        const icon = createPinIcon(place.image, isMine, place.visited);
        return (
          <Marker
            key={place.id}
            position={place.coords}
            icon={icon}
            eventHandlers={{ click: () => navigate(`/place/${place.id}`) }}
          >
            <Popup>
              <div className="text-center p-1 min-w-[100px]">
                <p className="font-semibold text-sm leading-tight">{place.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{place.cuisine}</p>
                {place.visited && <span className="text-[10px] text-green-600 font-semibold">✓ Visited</span>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function MapSearchControl({ query }) {
  const map = useMap();
  const debouncedQuery = useDebounce(query, 500);
  React.useEffect(() => {
    if (!debouncedQuery.trim()) return;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=1`, { headers: NOMINATIM_HEADERS })
      .then(r => r.json())
      .then(data => {
        if (data[0]) map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 13, { duration: 1.2 });
      })
      .catch(() => {});
  }, [debouncedQuery]);
  return null;
}

function LocateButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const handleLocate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.2 });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };
  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-[285px] right-4 z-[40] w-10 h-10 bg-card/95 backdrop-blur-sm text-foreground rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform border border-border/50"
    >
      <Crosshair className={`w-4 h-4 ${locating ? 'text-primary animate-spin' : 'text-muted-foreground'}`} />
    </button>
  );
}

export default function MapScreen() {
  const { profile, places, placesLoading, placesError } = useFork();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const center = useMemo(() => {
    const pin = places.find(p => p.coords && p.savedBy === 'me') || places.find(p => p.coords);
    return pin?.coords || [40.7128, -74.0060];
  }, [places]);

  const visibleCount = useMemo(() => places.filter(p => matchesFilter(p, filter)).length, [places, filter]);

  return (
    <div className="relative h-[calc(100dvh-56px)] w-full">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />
        <MapPins filter={filter} />
        <MapSearchControl query={searchQuery} />
        <LocateButton />
      </MapContainer>

      {/* Fork logo (top-left) */}
      {!searchOpen && (
        <div className="absolute top-4 left-4 z-[20]">
          <div className="bg-card/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg">
            <span className="text-lg font-extrabold tracking-tight">
              <span className="text-primary">Fork</span>
              <span className="text-xs ml-0.5">🍴</span>
            </span>
          </div>
        </div>
      )}

      {/* Map search */}
      {searchOpen ? (
        <div className="absolute top-4 left-4 right-4 z-[20] flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearchQuery(searchInput); setSearchOpen(false); } }}
            placeholder="Search city or neighbourhood..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button onClick={() => { setSearchOpen(false); setSearchInput(''); }}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setSearchOpen(true)}
          className="absolute top-4 left-[110px] z-[20] w-9 h-9 bg-card/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center"
        >
          <Search className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-[20] flex items-center gap-2">
        <NotificationBell />
        <Link to="/profile">
          <div className="w-10 h-10 rounded-full bg-card shadow-lg border-2 border-primary/30 overflow-hidden">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'; }}
            />
          </div>
        </Link>
      </div>

      {/* Filter pills */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[20] flex gap-1.5 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-lg">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
        {visibleCount > 0 && (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold text-muted-foreground">
            {visibleCount}
          </span>
        )}
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="absolute bottom-[230px] right-4 z-[40] w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all hover:bg-primary/90"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>

      {/* Places error banner */}
      {placesError && (
        <div className="absolute top-[72px] left-1/2 -translate-x-1/2 z-[20] bg-destructive/90 text-white text-xs px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
          Failed to load pins — check your connection
        </div>
      )}

      {/* Empty state nudge */}
      {!placesLoading && !placesError && places.filter(p => p.coords).length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[20] pointer-events-none">
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-xl text-center max-w-[220px]">
            <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-bold text-sm">No pins yet</p>
            <p className="text-xs text-muted-foreground mt-1">Tap <strong>+</strong> to drop your first pin</p>
          </div>
        </div>
      )}

      <BottomSheet />
      <AddPlaceModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}