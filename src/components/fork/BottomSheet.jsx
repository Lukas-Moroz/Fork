import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFork } from '../../context/ForkContext';
import PlaceCard from './PlaceCard';
import { LoadingSpinner } from './LoadingState';

export default function BottomSheet() {
  const { places, placesLoading } = useFork();
  const [expanded, setExpanded] = useState(false);
  const visiblePlaces = expanded ? places : places.slice(0, 3);

  return (
    <motion.div
      className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-30 pointer-events-none"
      initial={false}
    >
      <div className="pointer-events-auto">
        <div
          className={`bg-card/95 backdrop-blur-md rounded-t-2xl shadow-lg border border-border/50 transition-all duration-300 ${
            expanded ? 'max-h-[60vh]' : 'max-h-[180px]'
          } overflow-hidden`}
        >
          {/* Handle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex flex-col items-center pt-2 pb-1 px-4"
          >
            <div className="w-8 h-1 bg-muted-foreground/30 rounded-full mb-2" />
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold text-muted-foreground">
                Recently saved {places.length > 0 && <span className="text-primary">· {places.length}</span>}
              </span>
              <div className="flex items-center gap-2">
                {expanded && places.length > 3 && (
                  <Link to="/saved" className="text-[10px] text-primary font-semibold">See all</Link>
                )}
                {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          </button>

          {/* Cards */}
          <div className={`px-3 pb-3 space-y-2 ${expanded ? 'overflow-y-auto max-h-[50vh]' : ''}`}>
            {placesLoading ? (
              <LoadingSpinner message="Loading pins..." />
            ) : visiblePlaces.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">No pins saved yet — tap + to add one!</p>
            ) : (
              visiblePlaces.map(place => (
                <PlaceCard key={place.id} place={place} compact />
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}