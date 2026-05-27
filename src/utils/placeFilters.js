export function matchesFilter(place, filter) {
  if (!place.coords) return false;
  if (filter === 'Mine') return place.savedBy === 'me';
  if (filter === 'Friends') return place.savedBy !== 'me';
  if (filter === 'Visited') return place.visited;
  if (filter === 'Wishlist') return !place.visited;
  return true;
}
