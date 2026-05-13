const API_KEY = '3FTV4WRHKHADLrAwf0q254wRsw0cy8avuixTIfEGjEO2im28ZrV0JQQJ99CEACYeBjFd1B6JAAAgAZMP1WqP';
const BASE_URL = 'https://places.googleapis.com/v1';

const SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.businessStatus',
  'places.photos',
].join(',');

const DETAIL_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'priceLevel',
  'businessStatus',
  'photos',
  'websiteUri',
  'internationalPhoneNumber',
  'currentOpeningHours',
  'editorialSummary',
  'reviews',
].join(',');

export function getPhotoUrl(photoName, maxWidth = 400) {
  return `${BASE_URL}/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}

export function priceLevelToSymbol(priceLevel) {
  const map = {
    PRICE_LEVEL_FREE: 'Free',
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
  };
  return map[priceLevel] || '';
}

export async function searchNearby({ lat, lng, textQuery, radius = 1500 }) {
  const body = {
    textQuery: textQuery ? `${textQuery} restaurant` : 'restaurant',
    includedType: 'restaurant',
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    },
    maxResultCount: 10,
  };

  const res = await fetch(`${BASE_URL}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': SEARCH_FIELDS,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Places API error: ${res.status}`);
  const data = await res.json();
  return (data.places || []).map(normalizePlaceResult);
}

export async function getPlaceDetails(placeId) {
  const res = await fetch(`${BASE_URL}/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': DETAIL_FIELDS,
    },
  });
  if (!res.ok) throw new Error(`Places Details error: ${res.status}`);
  return await res.json();
}

function normalizePlaceResult(p) {
  return {
    googlePlaceId: p.id,
    name: p.displayName?.text || 'Unknown',
    address: p.formattedAddress || '',
    coords: p.location ? [p.location.latitude, p.location.longitude] : null,
    rating: p.rating || null,
    userRatingCount: p.userRatingCount || 0,
    price_range: priceLevelToSymbol(p.priceLevel),
    businessStatus: p.businessStatus,
    photoName: p.photos?.[0]?.name || null,
    platform: 'instagram',
    cuisine: 'Restaurant',
  };
}