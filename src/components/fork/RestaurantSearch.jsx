import React, { useState, useEffect } from 'react';
import { Search, Loader2, MapPin, Star, Plus, Crosshair, ExternalLink, Phone, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchNearby, getPlaceDetails, getPhotoUrl } from '@/lib/googlePlaces';

const CUISINE_SUGGESTIONS = ['Ramen', 'Sushi', 'Pizza', 'Tacos', 'Burgers', 'Thai', 'Korean BBQ', 'Brunch'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop';

const NOMINATIM_HEADERS = { 'User-Agent': 'ForkApp/1.0 (food discovery app)' };

// Geocode a location string to lat/lng using Nominatim
async function geocodeLocation(locationStr) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationStr)}&format=json&limit=1`, { headers: NOMINATIM_HEADERS });
  const data = await res.json();
  if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  return null;
}

export default function RestaurantSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(() => localStorage.getItem('fork_last_location') || '');
  const [coords, setCoords] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fork_last_coords') || 'null'); } catch { return null; }
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(null);
  const [details, setDetails] = useState({});
  const [searchHistory, setSearchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fork_search_history') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('fork_last_location', location);
  }, [location]);

  const addToHistory = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const next = [trimmed, ...searchHistory.filter(h => h !== trimmed)].slice(0, 6);
    setSearchHistory(next);
    localStorage.setItem('fork_search_history', JSON.stringify(next));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        localStorage.setItem('fork_last_coords', JSON.stringify({ lat, lng }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: NOMINATIM_HEADERS });
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const state = data.address?.state || '';
          if (city) setLocation(`${city}${state ? ', ' + state : ''}`);
        } catch {}
        setDetectingLocation(false);
      },
      () => setDetectingLocation(false),
      { timeout: 6000 }
    );
  };

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    addToHistory(q);
    setLoading(true);
    setSearched(true);
    setResults([]);
    setError(null);
    setExpandedId(null);
    try {

    let searchCoords = coords;
    if (!searchCoords) {
      searchCoords = await geocodeLocation(location);
      if (searchCoords) {
        setCoords(searchCoords);
        localStorage.setItem('fork_last_coords', JSON.stringify(searchCoords));
      }
    }

    if (!searchCoords) {
      setError('Could not determine location. Please enter a city or use GPS.');
      setLoading(false);
      return;
    }

    const places = await searchNearby({ ...searchCoords, textQuery: q });
    setResults(places);
    } catch (err) {
      setError('Search failed. Check your API key or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (place) => {
    if (expandedId === place.googlePlaceId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(place.googlePlaceId);
    if (details[place.googlePlaceId]) return;
    setDetailLoading(place.googlePlaceId);
    const detail = await getPlaceDetails(place.googlePlaceId);
    setDetails(prev => ({ ...prev, [place.googlePlaceId]: detail }));
    setDetailLoading(null);
  };

  const handleSelect = (place) => {
    const detail = details[place.googlePlaceId] || {};
    const image = place.photoName
      ? getPhotoUrl(place.photoName, 400)
      : FALLBACK_IMAGE;
    onSelect({
      ...place,
      image,
      cuisine: detail.editorialSummary?.text || place.cuisine || 'Restaurant',
      link: detail.websiteUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.googlePlaceId}`,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Search for any restaurant using Google Places</p>

      {/* Location */}
      <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <input
          type="text"
          value={location}
          onChange={e => { setLocation(e.target.value); setCoords(null); }}
          className="flex-1 bg-transparent text-sm outline-none"
          placeholder="Your location..."
        />
        <button onClick={detectLocation} title="Use my location">
          <Crosshair className={`w-4 h-4 ${detectingLocation ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Ramen, sushi, brunch..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            autoFocus
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={!query.trim() || loading}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-40 shrink-0"
        >
          Go
        </button>
      </div>

      {/* Suggestion chips + history */}
      {!searched && (
        <div className="space-y-3">
          {searchHistory.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1.5">Recent</p>
              <div className="flex flex-wrap gap-1.5">
                {searchHistory.map(h => (
                  <button
                    key={h}
                    onClick={() => { setQuery(h); handleSearch(h); }}
                    className="px-3 py-1.5 bg-muted text-foreground rounded-full text-xs font-medium flex items-center gap-1"
                  >
                    🕐 {h}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {CUISINE_SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); handleSearch(s); }}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-xs font-semibold"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Finding restaurants...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-6 px-4 bg-destructive/5 rounded-xl">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.map((r, i) => {
          const isExpanded = expandedId === r.googlePlaceId;
          const detail = details[r.googlePlaceId];
          const isLoadingDetail = detailLoading === r.googlePlaceId;
          const photoUrl = r.photoName ? getPhotoUrl(r.photoName, 400) : FALLBACK_IMAGE;
          const isOpen = r.businessStatus === 'OPERATIONAL';

          return (
            <motion.div
              key={r.googlePlaceId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-muted rounded-xl overflow-hidden"
            >
              {/* Main row */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => handleExpand(r)}
              >
                <img
                  src={photoUrl}
                  alt={r.name}
                  loading="lazy"
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                  onError={e => { e.target.src = FALLBACK_IMAGE; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-sm truncate">{r.name}</p>
                    {r.businessStatus && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {isOpen ? 'Open' : 'Closed'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{r.price_range || ''}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {r.rating && (
                      <>
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-semibold">{r.rating}</span>
                        {r.userRatingCount > 0 && (
                          <span className="text-xs text-muted-foreground">({r.userRatingCount.toLocaleString()})</span>
                        )}
                        <span className="text-muted-foreground text-xs">·</span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground truncate">{r.address}</span>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleSelect(r); }}
                  className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-border/30">
                  {isLoadingDetail ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                  ) : detail ? (
                    <div className="pt-3 space-y-2">
                      {detail.editorialSummary?.text && (
                        <p className="text-xs text-muted-foreground">{detail.editorialSummary.text}</p>
                      )}
                      {detail.currentOpeningHours?.weekdayDescriptions && (
                        <div className="flex items-start gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            {detail.currentOpeningHours.weekdayDescriptions[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]}
                          </p>
                        </div>
                      )}
                      {detail.internationalPhoneNumber && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <a href={`tel:${detail.internationalPhoneNumber}`} className="text-xs text-primary">{detail.internationalPhoneNumber}</a>
                        </div>
                      )}
                      {detail.websiteUri && (
                        <div className="flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <a href={detail.websiteUri} target="_blank" rel="noopener noreferrer" className="text-xs text-primary truncate">{detail.websiteUri.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>
                        </div>
                      )}
                      {detail.reviews?.slice(0, 2).map((rev, idx) => (
                        <div key={idx} className="bg-card rounded-lg p-2.5">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-semibold">{rev.rating}</span>
                            <span className="text-xs text-muted-foreground ml-1">{rev.authorAttribution?.displayName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{rev.text?.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {searched && !loading && !error && results.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No restaurants found nearby — try expanding your search radius or changing your query.
        </p>
      )}
    </div>
  );
}