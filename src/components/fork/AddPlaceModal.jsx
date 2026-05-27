import { db } from '@/lib/db';

import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Loader2, Check, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useFork } from '../../context/ForkContext';
import PlatformBadge from './PlatformBadge';
import RestaurantSearch from './RestaurantSearch';
import { placeSchema } from '@/lib/schemas';

const NOMINATIM_HEADERS = { 'User-Agent': 'ForkApp/1.0 (food discovery app)' };

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop';

function detectPlatform(url) {
  if (!url) return 'instagram';
  if (url.includes('tiktok')) return 'tiktok';
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('x.com') || url.includes('twitter')) return 'x';
  return 'instagram';
}

export default function AddPlaceModal({ open, onClose }) {
  const { addPlace, places } = useFork();
  const [tab, setTab] = useState('search'); // 'search' | 'link' | 'manual'
  const [step, setStep] = useState(1);
  const [linkValue, setLinkValue] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset: resetManual } = useForm({
    resolver: zodResolver(placeSchema),
    defaultValues: { name: '', cuisine: '', address: '', notes: '' },
  });

  const handleAnalyze = async () => {
    if (!linkValue.trim()) return;
    try { new URL(linkValue); } catch { setLinkError('Please enter a valid URL'); return; }
    setLinkError('');
    const safeUrl = linkValue.trim().replace(/[\r\n]/g, '');
    setStep(2);
    setAnalyzing(true);
    try {
      const platform = detectPlatform(safeUrl);
      const res = await db.integrations.Core.InvokeLLM({
        prompt: `Extract restaurant information from this social media URL: ${safeUrl}. If you can't access the URL, infer a plausible restaurant based on the URL structure. Return a restaurant with a real-sounding name, cuisine, address (city-level is fine), and coordinates. Use New York, NY as default location if unknown.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            cuisine: { type: 'string' },
            address: { type: 'string' },
            lat: { type: 'number' },
            lng: { type: 'number' },
            description: { type: 'string' },
            image_keyword: { type: 'string' },
          },
        },
      });

      const imageKeywordMap = {
        ramen: '1569718212165-3a8278d5f624', sushi: '1579871494447-9811cf80d66c',
        pizza: '1513104890138-7c749659a591', tacos: '1565299585323-38d6b0865b47',
        burger: '1568901346375-23c9450c58cd', thai: '1562802378-063ec186a863',
        korean: '1498654896293-37aacf113fd9', brunch: '1533089860892-a7c6f0a88666',
        pasta: '1551183053-bf91798d0e28', seafood: '1559339352-11d035aa65de',
        default: '1414235077428-338989a2e8c0',
      };
      const key = (res.image_keyword || '').toLowerCase();
      const photoId = imageKeywordMap[key] || imageKeywordMap.default;

      setResult({
        name: res.name || 'Restaurant',
        cuisine: res.cuisine || 'Restaurant',
        address: res.address || 'Address unknown',
        coords: (res.lat && res.lng) ? [res.lat, res.lng] : null,
        link: safeUrl,
        platform,
        image: `https://images.unsplash.com/photo-${photoId}?w=400&h=300&fit=crop`,
        description: res.description || '',
        rating: null,
      });
      setStep(3);
    } catch (e) {
      // Fallback to a generic result
      setResult({
        name: 'Restaurant from link',
        cuisine: 'Restaurant',
        address: '',
        coords: null,
        link: safeUrl,
        platform: detectPlatform(safeUrl),
        image: FALLBACK_IMAGE,
        rating: null,
      });
      setStep(3);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualConfirm = async (data) => {
    setGeocoding(true);
    let coords = null;
    if (data.address?.trim()) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.address)}&format=json&limit=1`, { headers: NOMINATIM_HEADERS });
        const json = await res.json();
        if (json[0]) coords = [parseFloat(json[0].lat), parseFloat(json[0].lon)];
      } catch {}
    }
    setGeocoding(false);
    addPlace({
      name: data.name,
      cuisine: data.cuisine || 'Restaurant',
      address: data.address || '',
      coords,
      link: '',
      platform: 'instagram',
      image: FALLBACK_IMAGE,
      rating: null,
      notes: data.notes || '',
    });
    setStep(4);
    setTimeout(() => { handleReset(); onClose(); }, 2000);
  };

  const handleConfirm = (placeToAdd = result) => {
    addPlace(placeToAdd);
    setStep(4);
    setTimeout(() => { handleReset(); onClose(); }, 2000);
  };

  const handleReset = () => {
    setStep(1);
    setLinkValue('');
    setLinkError('');
    setResult(null);
    resetManual({ name: '', cuisine: '', address: '', notes: '' });
  };

  const handleSearchSelect = (restaurant) => {
    setResult({ ...restaurant });
    setStep(3);
  };

  // Reset state when modal opens fresh (only on open, not close)
  const prevOpen = React.useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) { handleReset(); }
    prevOpen.current = open;
  }, [open]);

  if (!open) return null;

  const TABS = [
    { id: 'search', label: '🔍 Search' },
    { id: 'link', label: '🔗 Link' },
    { id: 'manual', label: '✏️ Manual' },
  ];

  const MANUAL_FIELDS = [
    { key: 'name', label: 'Name *', placeholder: 'Restaurant name', max: 120 },
    { key: 'cuisine', label: 'Cuisine', placeholder: 'Japanese, Italian...', max: 60 },
    { key: 'address', label: 'Address', placeholder: '123 Main St, City', max: 200 },
    { key: 'notes', label: 'Notes', placeholder: 'Why you want to try it...', max: 1000 },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card w-full max-w-[390px] rounded-t-2xl p-5 sheet-safe-pb max-h-[90vh] overflow-y-auto no-scrollbar"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Add a place</h2>
            <button onClick={() => { handleReset(); onClose(); }} className="p-1 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs — only show on step 1 */}
          {step === 1 && (
            <div className="flex bg-muted rounded-xl p-1 mb-5">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    tab === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* STEP 1 — Search tab */}
          {step === 1 && tab === 'search' && (
            <RestaurantSearch onSelect={handleSearchSelect} />
          )}

          {/* STEP 1 — Link tab */}
          {step === 1 && tab === 'link' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste a link from Instagram, TikTok, YouTube, or X — we'll extract the restaurant automatically.
              </p>
              <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
                <div className="pl-3"><LinkIcon className="w-4 h-4 text-muted-foreground" /></div>
                <input
                  type="url"
                  placeholder="Paste link here..."
                  value={linkValue}
                  onChange={e => { setLinkValue(e.target.value); setLinkError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  className="flex-1 bg-transparent text-sm py-3 outline-none placeholder:text-muted-foreground/60"
                  maxLength={2048}
                  autoFocus
                />
              </div>
              {linkError && <p className="text-xs text-destructive px-1">{linkError}</p>}
              <button
                onClick={handleAnalyze}
                disabled={!linkValue.trim()}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                Analyze
              </button>
            </div>
          )}

          {/* STEP 1 — Manual tab */}
          {step === 1 && tab === 'manual' && (
            <form onSubmit={handleSubmit(handleManualConfirm)} className="space-y-3">
              <p className="text-sm text-muted-foreground">Add a restaurant manually.</p>
              {MANUAL_FIELDS.map(({ key, label, placeholder, max }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
                  <input
                    {...register(key)}
                    placeholder={placeholder}
                    maxLength={max}
                    className="w-full mt-1 bg-muted rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50"
                  />
                  {errors[key] && (
                    <p className="text-[10px] text-destructive mt-0.5">{errors[key].message}</p>
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={geocoding}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all mt-2 flex items-center justify-center gap-2"
              >
                {geocoding ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Looking up address...</> : 'Drop pin 📍'}
              </button>
            </form>
          )}

          {/* STEP 2 — Loading */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Extracting location...</p>
            </div>
          )}

          {/* STEP 3 — Preview */}
          {step === 3 && result && (
            <div className="space-y-4">
              {/* Duplicate warning */}
              {places.some(p => p.name.toLowerCase() === result.name.toLowerCase()) && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs text-yellow-700 font-medium">
                  ⚠️ You already have a pin called "{result.name}" — adding anyway will create a duplicate.
                </div>
              )}
              <div className="rounded-xl overflow-hidden border border-border/50">
                <img
                  src={result.image || FALLBACK_IMAGE}
                  alt={result.name}
                  className="w-full h-40 object-cover"
                  onError={e => { e.target.src = FALLBACK_IMAGE; }}
                />
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base">{result.name}</h3>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{result.cuisine}</span>
                  </div>
                  {result.address && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs">{result.address}</span>
                    </div>
                  )}
                  {result.platform && <PlatformBadge platform={result.platform} size="md" />}
                  {result.description && (
                    <p className="text-xs text-muted-foreground">{result.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleConfirm()}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-all"
              >
                Confirm & drop pin 📍
              </button>
              <button
                onClick={() => { setStep(1); setResult(null); }}
                className="w-full py-2.5 text-sm text-muted-foreground font-medium"
              >
                ← Back
              </button>
            </div>
          )}

          {/* STEP 4 — Success */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <Check className="w-8 h-8 text-primary" />
              </motion.div>
              <h3 className="text-xl font-bold">Pin dropped!</h3>
              <p className="text-primary font-semibold text-lg">Fork'd. 🍴</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
