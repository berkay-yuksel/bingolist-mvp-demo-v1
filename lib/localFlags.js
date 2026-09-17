'use client';

function key(kind, userId) {
  return `bingolist:${kind}:${userId}`;
}

function readSet(kind, userId) {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(key(kind, userId));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writeSet(kind, userId, set) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key(kind, userId), JSON.stringify(Array.from(set)));
}

export function isCardHidden(userId, cardId) {
  return readSet('hiddenCards', userId).has(cardId);
}

export function setCardHidden(userId, cardId, hidden) {
  const set = readSet('hiddenCards', userId);
  hidden ? set.add(cardId) : set.delete(cardId);
  writeSet('hiddenCards', userId, set);
}

export function isCardPlayed(userId, cardId) {
  return readSet('playedCards', userId).has(cardId);
}

export function markCardPlayed(userId, cardId) {
  const set = readSet('playedCards', userId);
  if (!set.has(cardId)) {
    set.add(cardId);
    writeSet('playedCards', userId, set);
  }
}
