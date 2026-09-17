import fs from 'fs/promises';
import path from 'path';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES, USERS, ALL_CARDS, COLLECTIONS, FEATURED_CATEGORIES } from './mockData';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const REDIS_KEY = 'bingolist:db';
const KV_TABLE = 'kv_store';
const KV_KEY = 'bingolist:db';

// Three possible backends, in priority order. On Vercel (and any other
// serverless host) the filesystem is read-only or gets wiped on every cold
// start, so local-file storage silently loses all data there — one of
// Supabase or Redis is required for a real deployment. Locally, with none
// of these credentials set, we keep using data/db.json exactly as before.
const useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
const useRedis = !useSupabase && !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = useRedis ? Redis.fromEnv() : null;
const supabase = useSupabase ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY) : null;

// Creators can freely edit a fresh card for a short window; after that,
// content edits require a moderation-granted "revision" permission so a
// creator can't silently rewrite a card after the community has already
// generated statistics against it.
export const EDIT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

function emptyStats() {
  return {
    views: 0,
    plays: 0,
    likedBy: [],
    bookmarkedBy: [],
    pinnedBy: [],
    shares: 0,
    remixes: 0,
    uniquePlayers: [],
    cellSelections: {}, // cellId -> count of users who currently have it selected
  };
}

const DEFAULT_CATEGORY_TAGS = {
  gaming: ['retro', 'predictions'],
  food: ['istanbul', 'vegan'],
  travel: ['istanbul', 'kadikoy'],
  music: ['konser', 'albüm'],
  movies: ['oscars', 'klasikler'],
  sports: ['futbol', 'taraftar'],
  books: ['roman', 'klasikler'],
  lifestyle: ['wellness', 'kedi'],
  work: ['ofis', 'mizah'],
  nature: ['milli-park', 'doğa'],
};

function buildInitialDB() {
  const usersWithFollowers = USERS.map((u) => ({
    ...u,
    followers: u.followers || USERS.filter((other) => other.following.includes(u.id)).map((o) => o.id),
  }));

  // mockData cards may already carry real content fields (featured,
  // publicationState, coverImage, …) from a hand-authored seed file — only
  // fall back to generated defaults for whatever isn't already set, rather
  // than blindly overwriting them.
  const cards = ALL_CARDS.map((c, idx) => {
    let stats = c.stats;
    if (!stats) {
      stats = emptyStats();
      const base = 40 + idx * 17;
      stats.views = base * 6;
      stats.plays = Math.round(base * 3.4);
      stats.shares = Math.round(base * 0.6);
      stats.remixes = c.originalCardId ? 0 : Math.random() > 0.85 ? 1 : 0;
      stats.uniquePlayers = USERS.map((u) => u.id).filter(() => Math.random() > 0.15);
      stats.likedBy = USERS.map((u) => u.id).filter(() => Math.random() > 0.4);
      stats.bookmarkedBy = USERS.map((u) => u.id).filter(() => Math.random() > 0.6);
      stats.pinnedBy = USERS.map((u) => u.id).filter(() => Math.random() > 0.8);
      stats.cellSelections = {};
      c.cells.forEach((cell) => {
        stats.cellSelections[cell.id] = Math.floor(Math.random() * (stats.uniquePlayers.length + 1));
      });
    }
    return {
      ...c,
      coverSeed: c.coverSeed ?? idx,
      stats,
      publicationState: c.publicationState ?? 'PUBLISHED',
      featured: c.featured ?? false,
      hiddenFromProfile: c.hiddenFromProfile ?? false,
      pinnedOnProfile: c.pinnedOnProfile ?? false,
      moderationEditGrant: c.moderationEditGrant ?? null,
      isAd: c.isAd ?? false,
      adCategory: c.adCategory ?? null,
    };
  });

  return {
    meta: { updatedAt: new Date().toISOString() },
    categories: CATEGORIES,
    featuredCategories: FEATURED_CATEGORIES || ['food', 'gaming'],
    categoryPopularTags: DEFAULT_CATEGORY_TAGS,
    collections: COLLECTIONS,
    users: usersWithFollowers,
    cards,
    sessions: {}, // key `${userId}:${cardId}` -> { selectedCellIds, saved, savedAt }
    reports: [],
    moderationIssues: [],
    notifications: [],
    heroBanner: { cardId: cards[0]?.id || null, media: null }, // media: { type: 'image'|'video', url }
  };
}

// Lightweight migration: fills in fields added after a given snapshot was
// first generated, so an older saved db (file or Redis) never crashes the
// app after a code update — shared by both storage backends.
function migrate(db) {
  if (!db.moderationIssues) db.moderationIssues = [];
  if (!db.featuredCategories) db.featuredCategories = [];
  if (!db.notifications) db.notifications = [];
  if (!db.heroBanner) db.heroBanner = { cardId: db.cards[0]?.id || null, media: null };
  if (!db.categoryPopularTags || Object.keys(db.categoryPopularTags).length === 0) {
    db.categoryPopularTags = DEFAULT_CATEGORY_TAGS;
  }
  db.cards.forEach((c) => {
    if (c.publicationState === undefined) c.publicationState = 'PUBLISHED';
    if (c.featured === undefined) c.featured = false;
    if (c.hiddenFromProfile === undefined) c.hiddenFromProfile = false;
    if (c.pinnedOnProfile === undefined) c.pinnedOnProfile = false;
    if (c.moderationEditGrant === undefined) c.moderationEditGrant = null;
    if (c.isAd === undefined) c.isAd = false;
    if (c.adCategory === undefined) c.adCategory = null;
  });
  db.users.forEach((u) => {
    if (!u.role) u.role = 'player';
    if (u.avatarImage === undefined) u.avatarImage = null;
    if (!u.pinnedBookmarks) u.pinnedBookmarks = [];
  });
  return db;
}

async function ensureDBFile() {
  if (useSupabase) {
    const { data, error } = await supabase.from(KV_TABLE).select('value').eq('key', KV_KEY).maybeSingle();
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    if (data) return;
    const { error: insertError } = await supabase.from(KV_TABLE).insert({ key: KV_KEY, value: buildInitialDB() });
    if (insertError) throw new Error(`Supabase seed insert failed: ${insertError.message}`);
    return;
  }
  if (useRedis) {
    const existing = await redis.get(REDIS_KEY);
    if (existing) return;
    await redis.set(REDIS_KEY, buildInitialDB());
    return;
  }
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await atomicWrite(buildInitialDB());
  }
}

// All file access is funneled through this in-process queue so concurrent
// requests (very common in Next.js — several API calls can fire in
// parallel from one page) never call fs.writeFile at the same time on the
// same path. Without this, two overlapping writes can interleave/truncate
// each other and corrupt the JSON file. This only serializes writes within
// a single running process — on serverless (Redis mode), each invocation
// is its own process, so this doesn't protect against cross-instance
// races. For a small-scale demo that's an acceptable, known trade-off; a
// production deployment would want a real distributed lock.
let queue = Promise.resolve();
function serialize(task) {
  const result = queue.then(task, task);
  queue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function atomicWrite(db) {
  if (useSupabase) {
    const { error } = await supabase.from(KV_TABLE).upsert({ key: KV_KEY, value: db });
    if (error) throw new Error(`Supabase write failed: ${error.message}`);
    return;
  }
  if (useRedis) {
    await redis.set(REDIS_KEY, db);
    return;
  }
  const json = JSON.stringify(db, null, 2);
  const tmpPath = `${DB_PATH}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, json, 'utf-8');
  // rename is atomic on the same filesystem (and overwrites the target on
  // both POSIX and Windows), so readers never see a half-written file.
  await fs.rename(tmpPath, DB_PATH);
}

async function readAndParse() {
  if (useSupabase) {
    const { data, error } = await supabase.from(KV_TABLE).select('value').eq('key', KV_KEY).maybeSingle();
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    if (!data) {
      const fresh = buildInitialDB();
      await atomicWrite(fresh);
      return fresh;
    }
    return migrate(data.value);
  }

  if (useRedis) {
    const db = await redis.get(REDIS_KEY);
    if (!db) {
      const fresh = buildInitialDB();
      await redis.set(REDIS_KEY, fresh);
      return fresh;
    }
    return migrate(db);
  }

  const raw = await fs.readFile(DB_PATH, 'utf-8');
  try {
    return migrate(JSON.parse(raw));
  } catch (err) {
    // The file is corrupted (e.g. from a crash mid-write on an older
    // version of this code, before writes were serialized/atomic).
    // Back up whatever is there and self-heal instead of crashing the app.
    const backupPath = `${DB_PATH}.corrupted.${Date.now()}.bak`;
    try {
      await fs.rename(DB_PATH, backupPath);
    } catch {
      // ignore — best effort backup
    }
    console.warn(
      `[bingolist] data/db.json was corrupted and could not be parsed. ` +
        `Backed up to ${path.basename(backupPath)} and regenerated fresh seed data. ` +
        `Original error: ${err.message}`
    );
    const fresh = buildInitialDB();
    await atomicWrite(fresh);
    return fresh;
  }
}

export async function readDB() {
  await ensureDBFile();
  return serialize(readAndParse);
}

export async function writeDB(db) {
  db.meta = { ...(db.meta || {}), updatedAt: new Date().toISOString() };
  await serialize(() => atomicWrite(db));
  return db;
}

// Preferred way to make changes: runs `mutator(db)` and persists the result
// as a single queued unit, so no other request's read or write can happen
// in between (which would otherwise silently lose one side's changes).
// `mutator` may mutate `db` in place and/or return a value to hand back.
export async function updateDB(mutator) {
  await ensureDBFile();
  return serialize(async () => {
    const db = await readAndParse();
    const result = await mutator(db);
    db.meta = { ...(db.meta || {}), updatedAt: new Date().toISOString() };
    await atomicWrite(db);
    return result !== undefined ? result : db;
  });
}

export async function resetDB() {
  const fresh = buildInitialDB();
  if (!useSupabase && !useRedis) await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await serialize(() => atomicWrite(fresh));
  return fresh;
}

// ---- Roles & permissions ----------------------------------------------

// ---- Notifications ------------------------------------------------------

// Appends a notification for `userId` — call this from inside an
// updateDB() mutator so it's persisted atomically with whatever triggered
// it (issue created, revision requested, resolved, submitted, etc).
export function addNotification(db, { userId, type, title, body, link }) {
  db.notifications.push({
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    type,
    title,
    body: body || '',
    link: link || null,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export function hasRole(user, roles) {
  if (!user) return false;
  const list = Array.isArray(roles) ? roles : [roles];
  return list.includes(user.role);
}

// A card is editable by its creator when either the 30-minute free-edit
// window is still open, or a moderator has granted a temporary "revision"
// permission tied to a specific moderation issue. Editorial/profile-display
// preference fields (featured, hiddenFromProfile, pinnedOnProfile) are
// intentionally NOT covered by this gate — see the PATCH /api/cards/[id]
// route for the field split.
export function canEditCardContent(card, requesterId) {
  if (!card || card.creatorId !== requesterId) return false;
  if (card.moderationEditGrant) return true;
  const createdAt = new Date(card.createdAt).getTime();
  return Date.now() - createdAt <= EDIT_WINDOW_MS;
}

export function editableUntil(card) {
  return new Date(new Date(card.createdAt).getTime() + EDIT_WINDOW_MS).toISOString();
}

// ---- Derived helpers -------------------------------------------------

export function sessionKey(userId, cardId) {
  return `${userId}:${cardId}`;
}

// A card only shows up in public discovery/search/category/tag/collection
// surfaces when it is both marked public AND currently in good standing
// with moderation. A card under review or unpublished by a moderator
// disappears from these surfaces even if its `visibility` is still 'public'.
export function isPubliclyListed(card) {
  return card.visibility === 'public' && card.publicationState === 'PUBLISHED';
}

export function publicCardSummary(card) {
  const { stats } = card;
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    category: card.category,
    tags: card.tags,
    columns: card.columns,
    cellCount: card.cells.length,
    theme: card.theme,
    cellShape: card.cellShape,
    checkStyle: card.checkStyle,
    hideCellText: !!card.hideCellText,
    visibility: card.visibility,
    creatorId: card.creatorId,
    originalCardId: card.originalCardId,
    createdAt: card.createdAt,
    coverSeed: card.coverSeed,
    coverImage: card.coverImage || null,
    publicationState: card.publicationState,
    featured: !!card.featured,
    hiddenFromProfile: !!card.hiddenFromProfile,
    pinnedOnProfile: !!card.pinnedOnProfile,
    editableUntil: editableUntil(card),
    hasModerationEditGrant: !!card.moderationEditGrant,
    isAd: !!card.isAd,
    adCategory: card.adCategory || null,
    metrics: {
      views: stats.views,
      plays: stats.plays,
      likes: stats.likedBy.length,
      bookmarks: stats.bookmarkedBy.length,
      pins: stats.pinnedBy.length,
      shares: stats.shares,
      remixes: stats.remixes,
      uniquePlayers: stats.uniquePlayers.length,
    },
  };
}

function ageInDays(iso) {
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

// Puts any editor-designated ad card for this category at the front of an
// already-sorted list (e.g. trending order), without disturbing the order
// of the rest.
// Automatically derives a category's "popular tags" from how often each
// tag actually appears on that category's cards — no manual editor
// configuration needed. Excludes the category's own slug (redundant) and
// caps at 2 tags, matching the site's "subcategory" pill treatment.
// All content tags across public cards, ranked by how many cards use each
// one — the actual "trending" order, not an arbitrary/manual list.
export function mostUsedTags(db, limit = 12) {
  // Ranked by the combined trending score of the cards carrying each tag —
  // a tag on a few red-hot cards should outrank one spread across many
  // stale ones. Raw usage count is just a fallback for tag purposes below.
  const scores = {};
  db.cards
    .filter((c) => isPubliclyListed(c))
    .forEach((c) => {
      const score = trendingScore(c);
      c.tags.forEach((tag) => {
        if (db.categories.some((cat) => cat.slug === tag)) return; // skip category-as-tag noise
        scores[tag] = (scores[tag] || 0) + score;
      });
    });
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function autoPopularTagsForCategory(db, categorySlug, limit = 2) {
  const counts = {};
  db.cards
    .filter((c) => isPubliclyListed(c) && c.category === categorySlug)
    .forEach((c) => {
      c.tags.forEach((tag) => {
        if (tag === categorySlug) return;
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function withAdsFirst(cards, categorySlug) {
  const ads = cards.filter((c) => c.isAd && c.adCategory === categorySlug);
  const rest = cards.filter((c) => !(c.isAd && c.adCategory === categorySlug));
  return [...ads, ...rest];
}

export function trendingScore(card) {
  const { stats } = card;
  const raw = stats.plays * 3 + stats.views * 1 + stats.likedBy.length * 2 + stats.shares * 4;
  const decay = 1 / Math.pow(1 + ageInDays(card.createdAt), 0.65);
  return raw * decay;
}

export function popularScore(card) {
  const { stats } = card;
  return stats.plays * 2 + stats.views * 1 + stats.likedBy.length * 3 + stats.shares * 3 + stats.remixes * 5;
}

export function publicUserSummary(user, db, viewerId) {
  const isSelf = viewerId === user.id;
  const authoredCards = db.cards.filter((c) => c.creatorId === user.id && c.visibility === 'public');
  // Owners see all their own public cards (including ones under moderation
  // review, with a status indicator, and ones hidden from the profile);
  // everyone else only sees cards that are both listed and not hidden.
  const visibleCards = isSelf ? authoredCards : authoredCards.filter((c) => isPubliclyListed(c) && !c.hiddenFromProfile);
  const sorted = [...visibleCards].sort((a, b) => {
    if (!!b.pinnedOnProfile !== !!a.pinnedOnProfile) return b.pinnedOnProfile ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const uniquePlayerSet = new Set();
  let cardViews = 0;
  let shares = 0;
  authoredCards.forEach((c) => {
    c.stats.uniquePlayers.forEach((p) => uniquePlayerSet.add(p));
    cardViews += c.stats.views;
    shares += c.stats.shares;
  });

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarColor: user.avatarColor,
    avatarImage: user.avatarImage || null,
    isCreator: user.isCreator,
    role: user.role,
    social: user.social,
    followerCount: user.followers.length,
    followingCount: user.following.length,
    publicMetrics: {
      followers: user.followers.length,
      uniquePlayers: uniquePlayerSet.size,
      cardViews,
      shares,
    },
    cards: sorted.map((c) => ({ ...publicCardSummary(c), hidden: !!c.hiddenFromProfile })),
  };
}

export function recentlyPlayedFor(db, userId, limit = 8) {
  return Object.entries(db.sessions)
    .filter(([key]) => key.startsWith(`${userId}:`))
    .map(([key, session]) => {
      const cardId = key.split(':')[1];
      const card = db.cards.find((c) => c.id === cardId);
      return card ? { card, session } : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.session.savedAt || 0) - new Date(a.session.savedAt || 0))
    .slice(0, limit)
    .map(({ card, session }) => ({
      ...publicCardSummary(card),
      completed: session.selectedCellIds.length === card.cells.length,
      progress: `${session.selectedCellIds.length}/${card.cells.length}`,
    }));
}

export function bookmarkedCardsFor(db, userId, limit = 12) {
  const user = db.users.find((u) => u.id === userId);
  const pinned = new Set(user?.pinnedBookmarks || []);
  return db.cards
    .filter((c) => c.stats.bookmarkedBy.includes(userId) && isPubliclyListed(c))
    .sort((a, b) => {
      const aPinned = pinned.has(a.id);
      const bPinned = pinned.has(b.id);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .slice(0, limit)
    .map((c) => ({ ...publicCardSummary(c), pinnedBookmark: pinned.has(c.id) }));
}

export function getProfileBundle(db, username, viewerId) {
  const user = db.users.find((u) => u.username === username);
  if (!user) return null;
  const isSelf = viewerId === user.id;
  return {
    profile: publicUserSummary(user, db, viewerId),
    isFollowing: viewerId ? user.followers.includes(viewerId) : false,
    isSelf,
    recentlyPlayed: recentlyPlayedFor(db, user.id),
    bookmarkedCards: isSelf ? bookmarkedCardsFor(db, user.id) : [],
  };
}

// ---- Moderation ---------------------------------------------------------

export function issueSummary(issue, db) {
  const card = db.cards.find((c) => c.id === issue.cardId);
  const moderator = issue.assignedModeratorId ? db.users.find((u) => u.id === issue.assignedModeratorId) : null;
  const creator = card ? db.users.find((u) => u.id === card.creatorId) : null;
  return {
    ...issue,
    cardTitle: card?.title || '(silinmiş kart)',
    cardCategory: card?.category || null,
    cardPublicationState: card?.publicationState || null,
    creatorId: card?.creatorId || null,
    moderatorName: moderator?.displayName || null,
    moderatorUsername: moderator?.username || null,
    creatorName: creator?.displayName || null,
    creatorUsername: creator?.username || null,
  };
}

// Detailed per-card breakdown for the creator-only analytics view — more
// than what's exposed on the public profile (views/plays/likes/bookmarks/
// shares/remixes/unique players/completion rate for every card, including
// private or under-moderation ones).
export function creatorAnalytics(db, userId) {
  const cards = db.cards.filter((c) => c.creatorId === userId);
  return cards
    .map((card) => {
      const sessions = Object.entries(db.sessions).filter(([key]) => key.endsWith(`:${card.id}`));
      const completedCount = sessions.filter(([, s]) => s.selectedCellIds.length === card.cells.length).length;
      const totalPlayers = Math.max(1, card.stats.uniquePlayers.length);
      return {
        id: card.id,
        title: card.title,
        category: card.category,
        visibility: card.visibility,
        publicationState: card.publicationState,
        createdAt: card.createdAt,
        views: card.stats.views,
        plays: card.stats.plays,
        uniquePlayers: card.stats.uniquePlayers.length,
        likes: card.stats.likedBy.length,
        bookmarks: card.stats.bookmarkedBy.length,
        shares: card.stats.shares,
        remixes: card.stats.remixes,
        completionRate: Math.round((completedCount / totalPlayers) * 100),
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
