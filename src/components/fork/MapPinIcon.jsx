import React from 'react';
import L from 'leaflet';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=60&h=60&fit=crop';

export function createPinIcon(imageUrl, isMine, visited = false) {
  const color = isMine ? '#D2735C' : '#4A90D9';
  const src = imageUrl || FALLBACK_IMG;
  const visitedRing = visited ? `<div style="position:absolute;top:3px;left:50%;transform:translateX(-50%);width:36px;height:36px;border-radius:50%;border:2.5px solid #22c55e;pointer-events:none;"></div>` : '';
  const html = `
    <div style="position:relative;width:44px;height:52px;">
      <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 50C22 50 40 32 40 20C40 10.059 31.9411 2 22 2C12.0589 2 4 10.059 4 20C4 32 22 50 22 50Z" fill="${color}" stroke="white" stroke-width="2"/>
      </svg>
      <div style="position:absolute;top:5px;left:50%;transform:translateX(-50%);width:30px;height:30px;border-radius:50%;overflow:hidden;border:2px solid white;">
        <img src="${src}" onerror="this.src='${FALLBACK_IMG}'" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      ${visitedRing}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-pin',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  });
}