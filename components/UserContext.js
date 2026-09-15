'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { USERS } from '@/lib/mockData';

const STORAGE_KEY = 'bingolist:currentUserId';
const UserCtx = createContext(null);

// Two identity sources, in priority order:
// 1. A real logged-in session (cookie-based, from /api/auth) — this is
//    what a person using the public deployment actually has.
// 2. The old localStorage "switch persona" dev tool, using the static
//    seed USERS — kept only as a fallback for local development/testing
//    when no real session exists, and hidden from the UI once a real
//    session is active.
export function UserProvider({ children }) {
  const [userId, setUserIdState] = useState(USERS[0].id);
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
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored && USERS.some((u) => u.id === stored)) {
      setUserIdState(stored);
    }
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
