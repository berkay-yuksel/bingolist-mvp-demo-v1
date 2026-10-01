'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const UserCtx = createContext(null);

// What `user` looks like before/without a login. It has an empty id on
// purpose: every API call that needs a person (play, like, bookmark,
// follow, ...) rejects an empty userId, so a visitor who isn't signed in
// can never silently act as somebody else.
const GUEST_USER = {
  id: '',
  username: '',
  displayName: 'Ziyaretçi',
  avatarColor: '#4FA3FF',
  avatarImage: null,
  role: 'player',
  isCreator: false,
};

// Identity comes from exactly one place: the real session cookie
// (/api/auth/me). There are no demo accounts anymore.
export function UserProvider({ children }) {
  const router = useRouter();
  const [realUser, setRealUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      setRealUser(json.user || null);
    } catch {
      setRealUser(null);
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setReady(true));
  }, [refreshSession]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setRealUser(null);
  }

  const isRealSession = !!realUser;
  const user = realUser || GUEST_USER;

  // Call this at the top of anything that needs an account (marking a
  // cell, liking, saving, following ...). Returns true when it's fine to
  // go ahead; otherwise sends the visitor to the login page and comes
  // back to the same spot afterwards, and returns false.
  const requireLogin = useCallback(() => {
    if (realUser) return true;
    if (!ready) return false; // session check still running — don't misfire
    const next = window.location.pathname + window.location.search;
    router.push(`/login?next=${encodeURIComponent(next)}`);
    return false;
  }, [realUser, ready, router]);

  return (
    <UserCtx.Provider
      value={{
        userId: user.id,
        user,
        ready,
        isRealSession,
        refreshSession,
        requireLogin,
        logout,
      }}
    >
      {children}
    </UserCtx.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error('useCurrentUser must be used within UserProvider');
  return ctx;
}
