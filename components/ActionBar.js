'use client';

import { Heart, Bookmark, Share2, Shuffle, Flag } from 'lucide-react';

function Btn({ active, activeClass, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-lg border py-2.5 text-[11px] font-medium transition-colors sm:text-xs ${
        active ? `${activeClass} border-transparent` : 'border-ink-500 bg-ink-700 text-paper/70 hover:text-paper'
      }`}
    >
      <Icon size={16} fill={active ? 'currentColor' : 'none'} />
      <span className="truncate">
        {label}
        {typeof count === 'number' ? ` · ${count}` : ''}
      </span>
    </button>
  );
}

// All five actions live in a single row per design request — compact on
// mobile (icon + tiny label), same layout at every breakpoint.
export default function ActionBar({ liked, bookmarked, metrics, onLike, onBookmark, onShare, onRemix, onReport }) {
  return (
    <div className="flex gap-1.5 sm:gap-2">
      <Btn active={liked} activeClass="bg-stamp/20 text-stamp" onClick={onLike} icon={Heart} label="Beğen" count={metrics.likes} />
      <Btn active={bookmarked} activeClass="bg-marker/20 text-marker" onClick={onBookmark} icon={Bookmark} label="Kaydet" count={metrics.bookmarks} />
      <Btn onClick={onShare} icon={Share2} label="Paylaş" />
      <Btn onClick={onRemix} icon={Shuffle} label="Remix" />
      <Btn onClick={onReport} icon={Flag} label="Bildir" />
    </div>
  );
}
