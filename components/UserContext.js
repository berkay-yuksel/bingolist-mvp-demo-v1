'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { USERS } from '@/lib/mockData';

const STORAGE_KEY = 'bingolist:currentUserId';
const UserCtx = createContext(null);

// Used only when there's no real session AND the static demo USERS list is
// empty (e.g. once all the placeholder seed accounts are deleted from
// mockData.js) — keeps anonymous browsing from crashing instead of relying
// on USERS[0] always existing.
const GUEST_USER = {
  id: 'guest',
  username: 'guest',
  displayName: 'Ziyaretçi',
  avatarColor: '#4FA3FF',
  avatarImage: null,
  role: 'player',
  isCreator: false,
};

// Identity source: a real logged-in session (cookie-based, from
// /api/auth). The old localStorage "switch persona" dev tool is fully
// retired now that the site has real accounts — devSwitcherEnabled always
// stays false, kept only so nothing else in the app has to change.
export function UserProvider({ children }) {
  const [userId, setUserIdState] = useState(USERS[0]?.id || GUEST_USER.id);
  const [realUser, setRealUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [devSwitcherEnabled, setDevSwitcherEnabled] = useState(false);

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
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && USERS.some((u) => u.id === stored)) {
      setUserIdState(stored);
    }

    // Demo persona switcher retired now that the site has real accounts.
    setDevSwitcherEnabled(false);

    refreshSession().finally(() => setReady(true));
  }, [refreshSession]);

  function setUserId(id) {
    setUserIdState(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setRealUser(null);
  }

  const isRealSession = !!realUser;
  const user = isRealSession ? realUser : USERS.find((u) => u.id === userId) || USERS[0] || GUEST_USER;

  return (
    <UserCtx.Provider
      value={{
        userId: user.id,
        user,
        setUserId,
        users: USERS,
        ready,
        isRealSession,
        devSwitcherEnabled,
        refreshSession,
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