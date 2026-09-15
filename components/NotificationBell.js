'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Trash2 } from 'lucide-react';
import { useCurrentUser } from './UserContext';

const TYPE_ICON = {
  issue_opened: '🔍',
  revision_requested: '✏️',
  issue_resolved: '✅',
  revision_approved: '✅',
  submitted_for_review: '📨',
  creator_reply: '💬',
  moderator_reply: '💬',
  new_follower: '➕',
  card_liked: '❤️',
};

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins}dk önce`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}sa önce`;
  return `${Math.round(hours / 24)}g önce`;
}

export default function NotificationBell() {
  const { userId, user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/notifications?userId=${userId}`);
    const json = await res.json();
    setNotifications(json.notifications || []);
    setUnreadCount(json.unreadCount || 0);
  }, [userId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  async function handleClear(e) {
    e.stopPropagation();
    await fetch(`/api/notifications?userId=${userId}`, { method: 'DELETE' });
    setNotifications([]);
    setUnreadCount(0);
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={handleOpen}
        aria-label="Bildirimler"
        className="relative grid h-9 w-9 place-items-center rounded-full border border-ink-500 bg-ink-700 text-paper/70 hover:text-paper"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-stamp px-1 text-[10px] font-bold text-ink">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 max-h-96 w-80 overflow-y-auto rounded-xl border border-ink-500 bg-ink-700 p-2 shadow-ticket">
          <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Bildirimler</p>
            {notifications.length > 0 && (
              <button onClick={handleClear} className="flex items-center gap-1 text-[11px] text-paper/40 hover:text-stamp">
                <Trash2 size={11} /> Temizle
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-paper/40">Henüz bildirim yok.</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link || '#'}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-2 py-2 text-sm hover:bg-ink-600 ${!n.read ? 'bg-ink-600/50' : ''}`}
              >
                <span className="flex items-start gap-2">
                  <span className="shrink-0">{TYPE_ICON[n.type] || '🔔'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-paper">{n.title}</span>
                    {n.body && <span className="block text-xs text-paper/55">{n.body}</span>}
                    <span className="mt-0.5 block text-[10px] text-paper/35">{timeAgo(n.createdAt)}</span>
                  </span>
                </span>
              </Link>
            ))
          )}
          <Link
            href={`/profile/${user.username}/settings?tab=notifications`}
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg px-2 py-1.5 text-center text-xs text-mint hover:bg-ink-600"
          >
            Tümünü gör →
          </Link>
        </div>
      )}
    </div>
  );
}
