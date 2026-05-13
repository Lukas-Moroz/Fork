import React from 'react';

const platformStyles = {
  instagram: {
    label: 'Instagram',
    bg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400',
    text: 'text-white',
  },
  tiktok: {
    label: 'TikTok',
    bg: 'bg-black',
    text: 'text-white',
  },
  youtube: {
    label: 'YouTube',
    bg: 'bg-red-600',
    text: 'text-white',
  },
  x: {
    label: 'X',
    bg: 'bg-black',
    text: 'text-white',
  },
};

export default function PlatformBadge({ platform, size = 'sm' }) {
  const style = platformStyles[platform] || platformStyles.instagram;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${style.bg} ${style.text} ${sizeClasses}`}>
      {style.label}
    </span>
  );
}