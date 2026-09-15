'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { USERS } from '@/lib/mockData';

const STORAGE_KEY = 'bingolist:currentUserId';
const DEV_SWITCHER_KEY = 'bingolist:devSwitcherEnabled';
// Visiting the site once with ?dev=<this> unlocks the demo persona
// switcher on that browser from then on (stored in localStorage) — anyone
// else just sees the normal login/signup flow. Change this to your own
// secret before sharing the link around.
const DEV_SWITCHER_SECRET = 'bingoadmin2026';
const UserCtx = createContext(null);

// Two identity sources, in priority order:
// 1. A real logged-in session (cookie-based, from /api/auth) — this is
//    what a person using the public deployment actually has.
// 2. The old localStorage "switch persona" dev tool, using the static
//    seed USERS — kept only as a hidden admin/dev tool. It's invisible to
//    everyone by default; visiting once with ?dev=<secret> reveals it on
//    that browser going forward, and it's always available on localhost.
export function UserProvider({ children }) {
  const [userId, setUserIdState] = useState(USERS[0].id);
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

    const params = new URLSearchParams(window.location.search);
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (params.get('dev') === DEV_SWITCHER_SECRET) {
      window.localStorage.setItem(DEV_SWITCHER_KEY, '1');
    }
    const unlocked = window.localStorage.getItem(DEV_SWITCHER_KEY) === '1';
    setDevSwitcherEnabled(isLocalhost || unlocked);

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
  const user = isRealSession ? realUser : USERS.find((u) => u.id === userId) || USERS[0];

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