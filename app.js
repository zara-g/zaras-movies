/* ============================================================
   Zara's Movies — app.js

   1. Config & constants        8. Grids (random, genre, top 100,
   2. Helpers                      discover, person, collection)
   3. Storage & profiles data   9. Player (sources, resume, progress,
   4. TMDB / OMDb                  next episode, TV picker, similar)
   5. Cards & rows             10. Settings
   6. Hover card               11. Profiles UI
   7. Home & search            12. Header, router & boot
   ============================================================ */
'use strict';

/* ============================================================
   1. CONFIG & CONSTANTS
   ============================================================ */
const APP_NAME = "Zara's Movies";
const ORIGIN   = 'https://cinesrc.st';
const TMDB_KEY = '29582cf7448083efc74052a8ee4864fa';
const OMDB_KEY = 'f0691d6c';

/* Cross-device sync (Supabase). Fill these in from your Supabase project:
   Project Settings → API → "Project URL" and the "anon public" key.
   The anon key is meant to be public; the database rules (see SYNC-SETUP.md)
   make sure each account can only read and write its own data. */
const SUPABASE_URL = 'https://ewhyutluwewbbeapowqf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3aHl1dGx1d2V3YmJlYXBvd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTUzNTYsImV4cCI6MjEwNzI5MTM1Nn0.FyYpSdowFIfFIAZSFQkjooVb2GtABgh9E_-LadUlQBk';
const IMG_BASE = 'https://image.tmdb.org/t/p/';

const GENRES = [
  { id: 28, name: 'Action' },      { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },   { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },       { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },       { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },     { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },      { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },   { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },     { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },      { id: 37, name: 'Western' },
];

const SERVICES = [
  { id: 8, label: 'Netflix' },     { id: 9, label: 'Amazon Prime' },
  { id: 337, label: 'Disney+' },   { id: 15, label: 'Hulu' },
  { id: 1899, label: 'Max' },      { id: 350, label: 'Apple TV+' },
  { id: 531, label: 'Paramount+' },{ id: 386, label: 'Peacock' },
  { id: 283, label: 'Crunchyroll' },
];

const DISCOVER_FILTERS = [
  { key: 'new',       label: '🎬 New Releases' },
  { key: 'upcoming',  label: '📅 Upcoming' },
  { key: 'trending',  label: '🔥 Trending' },
  { key: 'service',   label: '📡 By Service' },
  { key: 'top-genre', label: '🏆 Top 100 by Genre' },
];

/* TV uses different genre ids from movies */
const TV_GENRES = {
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};
const genreName = (id) => GENRES.find(g => g.id === id)?.name || TV_GENRES[id] || '';

const A24_COMPANY_ID = 41077;

/* Palme d'Or winners (Cannes). Looked up on TMDB by title + year.
   Add new winners to the top of this list each May. */
const PALME_DOR = [
  { year: 2025, title: 'It Was Just an Accident' },
  { year: 2024, title: 'Anora' },
  { year: 2023, title: 'Anatomy of a Fall' },
  { year: 2022, title: 'Triangle of Sadness' },
  { year: 2021, title: 'Titane' },
  { year: 2019, title: 'Parasite' },
  { year: 2018, title: 'Shoplifters' },
  { year: 2017, title: 'The Square' },
  { year: 2016, title: 'I, Daniel Blake' },
  { year: 2015, title: 'Dheepan' },
  { year: 2014, title: 'Winter Sleep' },
  { year: 2013, title: 'Blue Is the Warmest Color' },
  { year: 2012, title: 'Amour' },
  { year: 2011, title: 'The Tree of Life' },
  { year: 2010, title: 'Uncle Boonmee Who Can Recall His Past Lives' },
  { year: 2009, title: 'The White Ribbon' },
  { year: 2008, title: 'The Class' },
  { year: 2007, title: '4 Months, 3 Weeks and 2 Days' },
  { year: 2006, title: 'The Wind That Shakes the Barley' },
  { year: 2005, title: "L'Enfant" },
  { year: 2004, title: 'Fahrenheit 9/11' },
  { year: 2003, title: 'Elephant' },
  { year: 2002, title: 'The Pianist' },
  { year: 2001, title: "The Son's Room" },
  { year: 2000, title: 'Dancer in the Dark' },
];

/* Home page sections, top to bottom. `eager` ones load straight away,
   the rest load as you scroll near them. */
const HOME_SECTIONS = [
  { title: 'Top 10 Today', subtitle: 'The most watched titles right now', variant: 'top10', eager: true, load: () => loadTop10() },
  { title: 'Trending This Week', subtitle: 'What everyone is watching this week', path: '/trending/all/week', href: '#/discover?f=trending', eager: true, hero: true },
  { custom: (ph) => buildServicesSection(ph), eager: true },
  { title: 'Popular Movies', subtitle: 'The films everyone is watching', path: '/movie/popular', eager: true },
  { title: 'Popular TV Shows', subtitle: 'Series everyone is talking about', path: '/tv/popular' },
  { title: 'A24', subtitle: 'From the studio behind Moonlight, Hereditary and Everything Everywhere All at Once',
    path: `/discover/movie?with_companies=${A24_COMPANY_ID}&sort_by=popularity.desc&vote_count.gte=50`, variant: 'portrait' },
  { title: 'Cannes Film Festival', subtitle: "Palme d'Or winners, 2000–2025", variant: 'portrait', load: () => loadPalmeDor(), hideForKids: true },
  { title: 'Top Rated Movies', subtitle: 'The highest rated films of all time', path: '/movie/top_rated', href: '#/top100' },
  { custom: (ph) => buildGenresSection(ph) },
  { title: 'New Releases', subtitle: 'Now playing in cinemas', path: '/movie/now_playing', href: '#/discover?f=new' },
  { title: 'Coming Soon', subtitle: 'Upcoming movies to look out for', path: '/movie/upcoming', href: '#/discover?f=upcoming' },
];

/* Line icons (Lucide, MIT) */
const ICONS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  play: '<path d="M6 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L7.5 3.64A1 1 0 0 0 6 4.5z" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};
const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const ACCENTS = {
  pink:     { label: 'Pink',     base: '#ffb6d9', light: '#ffd1e6', deep: '#ff8fc7' },
  lavender: { label: 'Lavender', base: '#c9b6ff', light: '#e0d1ff', deep: '#a88fff' },
  mint:     { label: 'Mint',     base: '#a8e6cf', light: '#c9f0e0', deep: '#7fd4b5' },
  sky:      { label: 'Sky',      base: '#a8d8ff', light: '#c9e5ff', deep: '#7fbcff' },
  peach:    { label: 'Peach',    base: '#ffc9a8', light: '#ffddc9', deep: '#ffab7f' },
  coral:    { label: 'Coral',    base: '#ffa8b8', light: '#ffc9d3', deep: '#ff7f95' },
  ruby:     { label: 'Ruby',     base: '#ef4444', light: '#f87171', deep: '#dc2626', on: '#ffffff' },
};

const AVATARS = ['🌸','🦊','🐼','🌊','🎬','🌙','🦋','🍭','⭐','🎨','🐙','🌻','🍿','🎧','🚀','🐳'];

const SOURCES = [
  { key: 'cinesrc', label: 'CineSrc' },
  { key: 'vidsrc',  label: 'VidSrc' },
  { key: '2embed',  label: '2Embed' },
  { key: 'multi',   label: 'MultiEmbed' },
];
const SOURCE_READY_TIMEOUT = 15000;
// Sources other than CineSrc don't report playback time; after this many
// seconds of the player being on screen the title counts as "started".
const STARTED_AFTER_SECONDS = 60;

const KIDS_MOVIE_OK = new Set(['G', 'PG', 'PG-13']);
const KIDS_TV_OK    = new Set(['TV-Y', 'TV-Y7', 'TV-Y7-FV', 'TV-G', 'TV-PG']);
const HORROR = 27;

/* ============================================================
   2. HELPERS
   ============================================================ */
const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

function typeOf(item) {
  if (item.media_type === 'tv') return 'tv';
  if (item.media_type === 'movie') return 'movie';
  return item.first_air_date ? 'tv' : 'movie';
}
const titleOf = (item) => item.title || item.name || 'Untitled';
const yearOf  = (item) => (item.release_date || item.first_air_date || '').slice(0, 4);
const imgUrl  = (path, size = 'w342') => (path ? `${IMG_BASE}${size}${path}` : null);

function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function setDocTitle(title) {
  document.title = title ? `${title} — ${APP_NAME}` : APP_NAME;
}

function toast(msg) {
  const node = el('div', 'zs-toast');
  node.textContent = msg;
  document.body.appendChild(node);
  requestAnimationFrame(() => node.classList.add('show'));
  setTimeout(() => {
    node.classList.remove('show');
    setTimeout(() => node.remove(), 300);
  }, 2200);
}

function showSkeletons(container, count = 12, variant = 'landscape') {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) container.appendChild(el('div', `skeleton skeleton--${variant}`));
}

function showEmpty(container, msg) {
  container.innerHTML = `<div class="random-empty">${esc(msg)}</div>`;
}

function errorPanel(title, message, onRetry) {
  const panel = el('div', 'error-panel', `
    <div class="error-icon">⚠️</div>
    <h3 class="error-title">${esc(title)}</h3>
    <p class="error-desc">${esc(message || 'Something went wrong.')}</p>
    ${onRetry ? '<button class="error-retry">↻ Try again</button>' : ''}
  `);
  if (onRetry) panel.querySelector('.error-retry').onclick = onRetry;
  return panel;
}

function genreOptions(placeholder) {
  return `<option value="">${esc(placeholder)}</option>`
    + GENRES.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('');
}

function renderPager(container, current, total, onPage) {
  container.innerHTML = '';
  if (total <= 1) return;
  const mk = (label, target, { active = false, disabled = false } = {}) => {
    const b = el('button', 'page-btn' + (active ? ' active' : ''));
    b.textContent = label;
    b.disabled = disabled;
    b.onclick = () => { if (!disabled && !active) onPage(target); };
    return b;
  };
  container.appendChild(mk('‹', current - 1, { disabled: current <= 1 }));
  for (let i = 1; i <= total; i++) container.appendChild(mk(i, i, { active: i === current }));
  container.appendChild(mk('›', current + 1, { disabled: current >= total }));
}

/* ============================================================
   3. STORAGE & PROFILES DATA
   Per-profile keys are stored as `${key}::${profileId}`.
   ============================================================ */
const NAMESPACED = new Set(['zs_favourites', 'zs_progress', 'zs_accent', 'zs_settings', 'zs_search_history']);
let activeProfileId = null;
let profilesCache = null;

function rawGet(k)    { try { return localStorage.getItem(k); } catch { return null; } }
function rawSet(k, v) { try { localStorage.setItem(k, v); } catch {} noteLocalChange(k); }
function rawRemove(k) { try { localStorage.removeItem(k); } catch {} noteLocalChange(k); }

const nsKey = (k) => (activeProfileId && NAMESPACED.has(k) ? `${k}::${activeProfileId}` : k);

const store = {
  get(k, fallback) {
    try { const r = rawGet(nsKey(k)); return r ? JSON.parse(r) : fallback; }
    catch { return fallback; }
  },
  set(k, v) { rawSet(nsKey(k), JSON.stringify(v)); },
  remove(k) { rawRemove(nsKey(k)); },
};

function loadProfiles() {
  if (!profilesCache) {
    try { profilesCache = JSON.parse(rawGet('zs_profiles') || '[]'); }
    catch { profilesCache = []; }
  }
  return profilesCache;
}
function saveProfiles(list) {
  profilesCache = list;
  rawSet('zs_profiles', JSON.stringify(list));
}
const activeProfile = () => loadProfiles().find(p => p.id === activeProfileId) || null;
const isKids = () => !!activeProfile()?.kids;

function purgeProfileData(profileId) {
  NAMESPACED.forEach(k => rawRemove(`${k}::${profileId}`));
}
function purgeOrphanedProfileKeys() {
  const valid = new Set(loadProfiles().map(p => p.id));
  const doomed = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const m = (localStorage.key(i) || '').match(/^zs_[a-z_]+::(p_[a-z0-9]+)$/i);
      if (m && !valid.has(m[1])) doomed.push(localStorage.key(i));
    }
  } catch {}
  doomed.forEach(rawRemove);
}

/* ---------- Settings ---------- */
function getSettings() {
  return { autonext: true, autoskip: true, autoplay: true, ...store.get('zs_settings', {}) };
}

/* ---------- Watchlist ---------- */
const getFavourites = () => store.get('zs_favourites', []);
const isFavourite = (type, id) => getFavourites().some(f => f.type === type && f.id === id);

function toggleFavourite(item, type) {
  const favs = getFavourites();
  const idx = favs.findIndex(f => f.type === type && f.id === item.id);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.unshift({
    id: item.id, type,
    title: titleOf(item),
    poster_path: item.poster_path || null,
    year: yearOf(item),
    addedAt: Date.now(),
  });
  store.set('zs_favourites', favs);
  return idx < 0;
}

/* ---------- Playback progress ---------- */
const getProgressStore = () => store.get('zs_progress', {});
const progressKey = (type, id, season, episode) =>
  (type === 'tv' ? `tv:${id}:${season}:${episode}` : `${type}:${id}`);

function getProgressFor(type, id, season, episode) {
  return getProgressStore()[progressKey(type, id, season, episode)] || null;
}

function removeProgressForTitle(type, id) {
  const s = getProgressStore();
  Object.keys(s).forEach(k => { if (s[k].type === type && s[k].id === id) delete s[k]; });
  store.set('zs_progress', s);
}

/* ---------- Accent ---------- */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}`;
}
const hexToRgba = (hex, alpha) => `rgba(${hexToRgb(hex)}, ${alpha})`;

const currentAccentKey = () => activeProfile()?.color || store.get('zs_accent', 'pink');

function applyAccent(key, { persist = true } = {}) {
  const a = ACCENTS[key] || ACCENTS.pink;
  const root = document.documentElement.style;
  root.setProperty('--accent', a.base);
  root.setProperty('--accent-2', a.light);
  root.setProperty('--accent-deep', a.deep);
  root.setProperty('--accent-rgb', hexToRgb(a.base));
  root.setProperty('--accent-deep-rgb', hexToRgb(a.deep));
  root.setProperty('--on-accent', a.on || '#1a0e15');
  root.setProperty('--accent-glow', hexToRgba(a.base, 0.25));
  root.setProperty('--accent-glow-strong', hexToRgba(a.base, 0.45));
  document.documentElement.dataset.accentHex = a.base.slice(1);
  if (!persist) return;
  store.set('zs_accent', key);
  const list = loadProfiles();
  const p = list.find(x => x.id === activeProfileId);
  if (p && p.color !== key) { p.color = key; saveProfiles(list); }
}

/* ============================================================
   4. TMDB / OMDb
   Every TMDB call goes through tmdb(): queued (rate-limited),
   retried on 429, cached for 10 minutes, and filtered in kids mode.
   ============================================================ */
const TMDB_MAX_CONCURRENT = 4;
const TMDB_MIN_GAP = 100;
const TMDB_CACHE_TTL = 10 * 60 * 1000;
const tmdbQueue = [];
const tmdbCache = new Map();
let tmdbActive = 0;
let tmdbLastStart = 0;
let tmdbPumpScheduled = false;

function friendlyTmdbError(status) {
  if (status === 401) return 'TMDB rejected the API key';
  if (status === 404) return 'Not found on TMDB';
  if (status === 429) return 'Rate limited — slow down a moment';
  if (status >= 500) return 'TMDB is having trouble right now';
  return `TMDB error (${status})`;
}

function tmdbPump() {
  while (tmdbActive < TMDB_MAX_CONCURRENT && tmdbQueue.length) {
    const wait = TMDB_MIN_GAP - (Date.now() - tmdbLastStart);
    if (wait > 0) {
      if (!tmdbPumpScheduled) {
        tmdbPumpScheduled = true;
        setTimeout(() => { tmdbPumpScheduled = false; tmdbPump(); }, wait);
      }
      return;
    }
    tmdbLastStart = Date.now();
    tmdbActive++;
    tmdbRun(tmdbQueue.shift());
  }
}

async function tmdbRun(job) {
  try {
    const sep = job.path.includes('?') ? '&' : '?';
    const res = await fetch(`https://api.themoviedb.org/3${job.path}${sep}api_key=${TMDB_KEY}`);
    if (res.status === 429 && job.tries < 3) {
      job.tries++;
      setTimeout(() => { tmdbQueue.unshift(job); tmdbPump(); }, 800 * job.tries);
      return;
    }
    if (!res.ok) {
      const err = new Error(friendlyTmdbError(res.status));
      err.status = res.status;
      throw err;
    }
    job.resolve(await res.json());
  } catch (err) {
    job.reject(err);
  } finally {
    tmdbActive--;
    tmdbPump();
  }
}

/* Kids mode: list endpoints become /discover queries capped by certification */
const KIDS_SWAPS = {
  '/trending/all/week': { base: '/discover/movie', extra: { sort_by: 'popularity.desc', 'vote_count.gte': '200' } },
  '/movie/popular':     { base: '/discover/movie', extra: { sort_by: 'popularity.desc', 'vote_count.gte': '500' } },
  '/movie/top_rated':   { base: '/discover/movie', extra: { sort_by: 'vote_average.desc', 'vote_count.gte': '2000' } },
  '/movie/upcoming':    { base: '/discover/movie', extra: { sort_by: 'popularity.desc', 'vote_count.gte': '50' } },
  '/movie/now_playing': { base: '/discover/movie', extra: { sort_by: 'popularity.desc', 'vote_count.gte': '50' } },
  '/tv/popular':        { base: '/discover/tv',    extra: { sort_by: 'popularity.desc', 'vote_count.gte': '200' } },
};

function kidsPath(path) {
  const [base, query] = path.split('?');
  const params = new URLSearchParams(query || '');
  let newBase = base;
  const swap = KIDS_SWAPS[base];
  if (swap) {
    newBase = swap.base;
    Object.entries(swap.extra).forEach(([k, v]) => params.set(k, v));
  }
  if (!newBase.startsWith('/discover/')) return path;
  params.set('certification_country', 'US');
  params.set('certification.lte', newBase === '/discover/tv' ? 'TV-PG' : 'PG-13');
  const without = params.get('without_genres');
  params.set('without_genres', without ? `${without},${HORROR}` : String(HORROR));
  return `${newBase}?${params.toString()}`;
}

function tmdb(path) {
  const finalPath = isKids() ? kidsPath(path) : path;
  const hit = tmdbCache.get(finalPath);
  if (hit && Date.now() - hit.at < TMDB_CACHE_TTL) return hit.promise;
  const promise = new Promise((resolve, reject) => {
    tmdbQueue.push({ path: finalPath, resolve, reject, tries: 0 });
    tmdbPump();
  });
  tmdbCache.set(finalPath, { at: Date.now(), promise });
  promise.catch(() => tmdbCache.delete(finalPath));
  return promise;
}

/* Drop adult / horror results when a kids profile is active */
function kidsFilter(items) {
  if (!isKids()) return items;
  return items.filter(r => !r.adult && !(r.genre_ids || []).includes(HORROR));
}

/* Full details incl. IMDb id, seasons and collection — shared by every feature */
const fetchDetails = (type, id) => tmdb(`/${type}/${id}?append_to_response=external_ids`);

const omdbCache = new Map();
async function imdbRating(imdbId) {
  if (!imdbId || !OMDB_KEY) return null;
  if (omdbCache.has(imdbId)) return omdbCache.get(imdbId);
  const promise = fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`)
    .then(r => r.json())
    .then(d => {
      if (!d || d.Response !== 'True') return null;
      const clean = (v) => (v && v !== 'N/A' ? v : null);
      return { rating: clean(d.imdbRating), votes: clean(d.imdbVotes), rated: clean(d.Rated) };
    })
    .catch(() => null);
  omdbCache.set(imdbId, promise);
  return promise;
}

/* Kids playback gate: US certification must be kid-friendly */
const kidsVerdicts = new Map();
async function isKidSafe(type, id) {
  const key = `${type}:${id}`;
  if (kidsVerdicts.has(key)) return kidsVerdicts.get(key);
  let ok = false;
  try {
    let cert = '';
    if (type === 'movie') {
      const data = await tmdb(`/movie/${id}/release_dates`);
      const us = (data.results || []).find(r => r.iso_3166_1 === 'US');
      cert = (us?.release_dates || []).map(r => r.certification).find(Boolean) || '';
      ok = KIDS_MOVIE_OK.has(cert);
    } else {
      const data = await tmdb(`/tv/${id}/content_ratings`);
      cert = (data.results || []).find(r => r.iso_3166_1 === 'US')?.rating || '';
      ok = KIDS_TV_OK.has(cert);
    }
    if (!cert) {
      // Unrated in the US: allow only non-adult, non-horror titles
      const d = await fetchDetails(type, id);
      ok = !d.adult && !(d.genres || []).some(g => g.id === HORROR);
    }
  } catch { ok = false; }
  kidsVerdicts.set(key, ok);
  return ok;
}

/* ============================================================
   5. CARDS & ROWS
   ============================================================ */
function watchHash(type, id, season, episode, title) {
  const q = new URLSearchParams();
  if (type === 'tv') { q.set('s', season || 1); q.set('e', episode || 1); }
  if (title) q.set('t', title);
  const qs = q.toString();
  return `#/watch/${type}/${id}${qs ? '?' + qs : ''}`;
}

function play(type, id, title, season, episode) {
  go(watchHash(type, id, season, episode, title));
}

function favButton(item, type) {
  const btn = el('button', 'fav-btn');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Toggle watchlist');
  btn.innerHTML = icon('heart');
  const paint = (on) => { btn.classList.toggle('active', on); btn.title = on ? 'Remove from Watchlist' : 'Add to Watchlist'; };
  paint(isFavourite(type, item.id));
  btn.onclick = (e) => {
    e.stopPropagation();
    const added = toggleFavourite(item, type);
    paint(added);
    toast(added ? '♥ Added to Watchlist' : 'Removed from Watchlist');
    refreshPersonalRows();
  };
  return btn;
}

/* Image with a blurred low-res placeholder; the full image fades in on load.
   `inner` is extra markup placed over the image (badges, progress bar…). */
function mediaHtml(src, thumb, alt, inner = '') {
  if (!src) return `<div class="card-media"><div class="card-fallback">🎬</div>${inner}</div>`;
  return `<div class="card-media"${thumb ? ` style="--thumb:url('${thumb}')"` : ''}>
    <img src="${src}" alt="${esc(alt)}" loading="lazy" />${inner}</div>`;
}

/* Wide image for landscape cards: backdrop, else poster */
function landscapeImage(item, size = 'w780') {
  if (item.backdrop_path) return [imgUrl(item.backdrop_path, size), imgUrl(item.backdrop_path, 'w300')];
  if (item.poster_path) return [imgUrl(item.poster_path, 'w500'), imgUrl(item.poster_path, 'w92')];
  return [null, null];
}

const posterImage = (item) => [imgUrl(item.poster_path, 'w342'), imgUrl(item.poster_path, 'w92')];

const metaHtml = (parts) => parts.filter(Boolean).map(p => `<span>${esc(p)}</span>`).join('<span class="dot"></span>');

/* ★ 7.8 · 2026 · TV Show */
function cardMeta(item, type, extra = []) {
  return [
    item.vote_average > 0 ? `<span class="rating"><span class="star">★</span> ${item.vote_average.toFixed(1)}</span>` : '',
    yearOf(item) ? `<span>${esc(yearOf(item))}</span>` : '',
    `<span>${type === 'tv' ? 'TV Show' : 'Movie'}</span>`,
    ...extra.map(x => `<span>${esc(x)}</span>`),
  ].filter(Boolean).join('<span class="dot"></span>');
}

/* "New" for the last 30 days, "Coming soon" for future dates */
function releaseBadge(item) {
  const date = item.release_date || item.first_air_date;
  if (!date) return '';
  const days = (Date.now() - Date.parse(date)) / 864e5;
  if (days < 0) return 'Coming soon';
  return days <= 30 ? 'New' : '';
}

const badgeHtml = (text) => (text ? `<span class="card-badge">${esc(text)}</span>` : '');
const topBadge = (rank) => `<div class="top-badge"><small>TOP</small>${rank}</div>`;

function removeButton(label, onRemove) {
  const rm = el('button', 'remove-btn', icon('x'));
  rm.type = 'button';
  rm.title = label;
  rm.setAttribute('aria-label', label);
  rm.onclick = (e) => { e.stopPropagation(); onRemove(); };
  return rm;
}

// Images: fade in when loaded, swap to the 🎬 fallback if they fail
document.addEventListener('load', (e) => {
  if (e.target.matches?.('.card-media img')) e.target.classList.add('loaded');
}, true);
document.addEventListener('error', (e) => {
  if (!e.target.matches?.('.card-media img')) return;
  e.target.insertAdjacentHTML('afterend', '<div class="card-fallback">🎬</div>');
  e.target.remove();
}, true);

function cardShell(className, media, title, meta) {
  return el('div', `card ${className}`, `
    ${media}
    <div class="card-info">
      <div class="card-title">${esc(title)}</div>
      <div class="card-meta">${meta}</div>
    </div>
  `);
}

function wireCard(card, item, type, { heart = true, hoverInfo = true } = {}) {
  const title = titleOf(item);
  if (heart) card.querySelector('.card-media').appendChild(favButton(item, type));
  card.onclick = () => play(type, item.id, title);
  if (hoverInfo) attachHover(card, type, item);
  return card;
}

/* Wide card — the default in rows and grids */
function makeCard(item, type = typeOf(item)) {
  const [src, thumb] = landscapeImage(item);
  const card = cardShell('card--landscape', mediaHtml(src, thumb, titleOf(item), badgeHtml(releaseBadge(item))), titleOf(item), cardMeta(item, type));
  return wireCard(card, item, type);
}

/* Tall poster card — Top 10, A24, Cannes, Watchlist */
function makePosterCard(item, type = typeOf(item), { rank = 0, badge = '' } = {}) {
  const [src, thumb] = posterImage(item);
  const inner = (rank ? topBadge(rank) : '') + badgeHtml(badge);
  const card = cardShell('card--poster', mediaHtml(src, thumb, titleOf(item), inner), titleOf(item), cardMeta(item, type));
  return wireCard(card, item, type);
}

/* Big first card of the Top 10 row */
function makeFeatureCard(item, rank) {
  const type = typeOf(item);
  const title = titleOf(item);
  const [src, thumb] = landscapeImage(item, 'w1280');
  const card = cardShell('card--feature', mediaHtml(src, thumb, title, `
    ${topBadge(rank)}
    <div class="feature-body">
      <div class="feature-logo"><span class="feature-title">${esc(title)}</span></div>
      <p class="feature-overview">${esc(item.overview || '')}</p>
      <button class="btn-play btn-sm" type="button">${icon('play')}Play</button>
    </div>`), title, cardMeta(item, type));
  fetchLogo(type, item.id).then(path => {
    if (!path) return;
    const box = card.querySelector('.feature-logo');
    const img = new Image();
    img.alt = title;
    img.onload = () => box.replaceChildren(img);
    img.src = imgUrl(path, 'w500');
  });
  return wireCard(card, item, type, { hoverInfo: false });
}

/* Grid card (search, discover, genre…) — same as the row card */
const makeGridCard = (item, type = typeOf(item)) => makeCard(item, type);

function fillGrid(container, items, msg = 'No results found.') {
  container.innerHTML = '';
  if (!items.length) { showEmpty(container, msg); return; }
  items.forEach(item => container.appendChild(makeGridCard(item)));
}

function sectionHead(titleHtml, subtitle, href) {
  const title = href ? `<a href="${href}">${titleHtml}${icon('chevronRight', 'icon chev')}</a>` : titleHtml;
  return `<div class="section-head">
    <h2 class="row-title">${title}</h2>
    ${subtitle ? `<p class="row-sub">${esc(subtitle)}</p>` : ''}
  </div>`;
}

/* Horizontal row with scroll arrows. `cards` is an array of elements. */
function makeRow(titleText, cards, className = '', { subtitle = '', href = '', variant = 'landscape', titleHtml = null, head = true } = {}) {
  const row = el('section', `row row--${variant}` + (className ? ' ' + className : ''));
  if (head) row.innerHTML = sectionHead(titleHtml ?? esc(titleText), subtitle, href);

  const wrapper = el('div', 'row-wrapper');
  const left = el('button', 'row-arrow row-arrow-left', icon('chevronLeft'));
  const right = el('button', 'row-arrow row-arrow-right', icon('chevronRight'));
  left.setAttribute('aria-label', 'Scroll left');
  right.setAttribute('aria-label', 'Scroll right');
  const scroll = el('div', 'row-scroll');
  cards.forEach(c => scroll.appendChild(c));
  wrapper.append(left, scroll, right);
  row.appendChild(wrapper);

  const step = () => Math.max(scroll.clientWidth * 0.8, 320);
  left.onclick = () => scroll.scrollBy({ left: -step(), behavior: 'smooth' });
  right.onclick = () => scroll.scrollBy({ left: step(), behavior: 'smooth' });

  const update = () => {
    left.classList.toggle('disabled', scroll.scrollLeft <= 4);
    right.classList.toggle('disabled', scroll.scrollLeft + scroll.clientWidth >= scroll.scrollWidth - 4);
  };
  scroll.addEventListener('scroll', update, { passive: true });
  row.__updateArrows = update;
  requestAnimationFrame(update);
  return row;
}

function makeSkeletonRow(titleText, variant = 'landscape', subtitle = '') {
  const row = el('section', `row row--${variant}`, sectionHead(esc(titleText), subtitle));
  const scroll = el('div', 'row-scroll');
  for (let i = 0; i < 8; i++) scroll.appendChild(el('div', `skeleton skeleton--${i === 0 && variant === 'top10' ? 'feature' : variant}`));
  row.appendChild(scroll);
  return row;
}

window.addEventListener('resize', () => {
  document.querySelectorAll('.row').forEach(r => r.__updateArrows && r.__updateArrows());
}, { passive: true });

/* ============================================================
   6. HOVER CARD
   ============================================================ */
const hoverCard = $('hover-card');
const hover = { showTimer: null, hideTimer: null, card: null, token: 0 };

function attachHover(card, type, item) {
  card.addEventListener('mouseenter', () => onCardEnter(card, type, item));
  card.addEventListener('mouseleave', scheduleHoverHide);
}

function onCardEnter(card, type, item) {
  clearTimeout(hover.hideTimer);
  if (hover.card === card && !hoverCard.classList.contains('hidden')) return;
  hover.card = card;
  clearTimeout(hover.showTimer);
  hover.showTimer = setTimeout(async () => {
    const token = ++hover.token;
    renderHoverCard(item, null, type, card, true);
    try {
      const details = await fetchDetails(type, item.id);
      if (token !== hover.token) return;
      const imdb = await imdbRating(details.external_ids?.imdb_id);
      if (token !== hover.token) return;
      renderHoverCard(details, imdb, type, card, false);
    } catch {
      if (token !== hover.token) return;
      const meta = hoverCard.querySelector('.hc-meta');
      if (meta) meta.insertAdjacentHTML('beforeend', '<span class="hc-dot"></span><span style="color:var(--accent)">failed</span>');
    }
  }, 250);
}

function scheduleHoverHide() {
  clearTimeout(hover.showTimer);
  clearTimeout(hover.hideTimer);
  hover.hideTimer = setTimeout(() => {
    if (hoverCard.matches(':hover')) return;
    hideHoverCard();
  }, 200);
}

function hideHoverCard() {
  clearTimeout(hover.showTimer);
  clearTimeout(hover.hideTimer);
  hover.card = null;
  hover.token++;
  hoverCard.classList.add('hidden');
  hoverCard.classList.remove('sheet');
}

/* "More info": the same details card, opened on click */
async function showInfoCard(anchor, type, item) {
  clearTimeout(hover.showTimer);
  clearTimeout(hover.hideTimer);
  hover.card = anchor;
  const token = ++hover.token;
  hoverCard.classList.add('sheet');
  renderHoverCard(item, null, type, anchor, true);
  try {
    const details = await fetchDetails(type, item.id);
    if (token !== hover.token) return;
    const imdb = await imdbRating(details.external_ids?.imdb_id);
    if (token !== hover.token) return;
    renderHoverCard(details, imdb, type, anchor, false);
  } catch {}
}

document.addEventListener('click', (e) => {
  if (hoverCard.classList.contains('hidden') || !hoverCard.classList.contains('sheet')) return;
  if (hoverCard.contains(e.target) || hover.card?.contains(e.target)) return;
  hideHoverCard();
});

function renderHoverCard(data, imdb, type, cardEl, loading) {
  const title = titleOf(data);
  const year = yearOf(data);
  const genres = (data.genres || []).map(g => g.name).slice(0, 3);
  const runtime = data.runtime
    ? `${data.runtime} min`
    : data.number_of_seasons
      ? `${data.number_of_seasons} season${data.number_of_seasons > 1 ? 's' : ''}`
      : '';
  const backdrop = imgUrl(data.backdrop_path, 'w780') || imgUrl(data.poster_path);

  hoverCard.innerHTML = `
    ${backdrop ? `<div class="hc-backdrop" style="background-image:url('${backdrop}')"></div>` : ''}
    <div class="hc-body">
      <h3 class="hc-title">${esc(title)}</h3>
      <div class="hc-meta">
        ${year ? `<span>${esc(year)}</span>` : ''}
        ${runtime ? `<span class="hc-dot"></span><span>${esc(runtime)}</span>` : ''}
        ${imdb?.rated ? `<span class="hc-dot"></span><span>${esc(imdb.rated)}</span>` : ''}
        ${loading ? '<span class="hc-dot"></span><span style="color:var(--accent)">loading…</span>' : ''}
      </div>
      <div class="hc-ratings">
        <div class="hc-rating">
          <span class="hc-rating-label">IMDb</span>
          <span class="hc-rating-value">${esc(imdb?.rating ?? '—')}</span>
          ${imdb?.votes ? `<span class="hc-rating-votes">${esc(imdb.votes)}</span>` : ''}
        </div>
        <div class="hc-rating">
          <span class="hc-rating-label">TMDB</span>
          <span class="hc-rating-value">${(data.vote_average || 0).toFixed(1)}</span>
        </div>
      </div>
      ${genres.length ? `<div class="hc-genres">${genres.map(g => `<span class="hc-genre">${esc(g)}</span>`).join('')}</div>` : ''}
      <p class="hc-overview">${esc(data.overview || 'No description available.')}</p>
      <div class="hc-actions">
        <button class="hc-play">${icon('play')}Play</button>
        ${data.belongs_to_collection ? '<button class="hc-collection">🎬 Collection</button>' : ''}
      </div>
    </div>
  `;

  hoverCard.querySelector('.hc-play').onclick = (e) => {
    e.stopPropagation();
    hideHoverCard();
    play(type, data.id, title);
  };
  const coll = hoverCard.querySelector('.hc-collection');
  if (coll) coll.onclick = (e) => {
    e.stopPropagation();
    hideHoverCard();
    const c = data.belongs_to_collection;
    go(`#/collection/${c.id}?name=${encodeURIComponent(c.name || '')}`);
  };

  hoverCard.classList.remove('hidden');
  positionHoverCard(cardEl);
}

function positionHoverCard(cardEl) {
  // On phones the "More info" card is a bottom sheet, placed by CSS
  if (hoverCard.classList.contains('sheet') && matchMedia('(max-width: 720px)').matches) {
    hoverCard.style.left = '';
    hoverCard.style.top = '';
    return;
  }
  const rect = cardEl.getBoundingClientRect();
  const w = hoverCard.offsetWidth || 260;
  const h = hoverCard.offsetHeight || 360;
  const vw = window.innerWidth, vh = window.innerHeight;
  const left = Math.max(12, Math.min(rect.left + rect.width / 2 - w / 2, vw - w - 12));
  let top;
  if (rect.top >= h + 20) top = rect.top - h - 10;
  else if (vh - rect.bottom >= h + 20) top = rect.bottom + 10;
  else top = Math.max(12, Math.min(rect.top - 40, vh - h - 12));
  hoverCard.style.left = left + 'px';
  hoverCard.style.top = top + 'px';
}

hoverCard.addEventListener('mouseenter', () => clearTimeout(hover.hideTimer));
hoverCard.addEventListener('mouseleave', scheduleHoverHide);
// Scrolling hides an open card but keeps a pending one, so a card still
// appears for whatever ends up under the pointer
window.addEventListener('scroll', () => {
  if (hoverCard.classList.contains('hidden') || hoverCard.matches(':hover')) return;
  hover.token++;
  hover.card = null;
  hoverCard.classList.add('hidden');
}, { passive: true });
window.addEventListener('resize', scheduleHoverHide);

/* ============================================================
   7. HOME & SEARCH
   ============================================================ */
const heroEl = $('hero');
const personalRowsEl = $('personalRows');
const mainRowsEl = $('mainRows');
const searchResultsEl = $('searchResults');
const searchInput = $('search');
let homeLoaded = false;
let homeScrollY = 0;

/* ---------- Title logos (TMDB artwork) ---------- */
const logoCache = new Map();
function fetchLogo(type, id) {
  const key = `${type}:${id}`;
  if (!logoCache.has(key)) {
    logoCache.set(key, tmdb(`/${type}/${id}/images?include_image_language=en,null`).then(d => {
      const logos = (d.logos || []).filter(l => l.iso_639_1 === 'en' || !l.iso_639_1);
      logos.sort((a, b) => (b.iso_639_1 === 'en') - (a.iso_639_1 === 'en') || (b.vote_average || 0) - (a.vote_average || 0));
      return logos[0]?.file_path || null;
    }).catch(() => null));
  }
  return logoCache.get(key);
}

/* ---------- Hero carousel ---------- */
const heroState = { items: [], index: 0, timer: null };

function renderHeroItem(idx) {
  const item = heroState.items[idx];
  if (!item) return;
  heroState.index = idx;
  const title = titleOf(item);
  const type = typeOf(item);
  const genres = (item.genre_ids || []).map(genreName).filter(Boolean).slice(0, 2);
  const meta = [
    item.vote_average > 0 ? `<span class="rating"><span class="star">★</span> ${item.vote_average.toFixed(1)}</span>` : '',
    yearOf(item) ? `<span>${esc(yearOf(item))}</span>` : '',
    `<span>${type === 'tv' ? 'Show' : 'Movie'}</span>`,
    ...genres.map(g => `<span>${esc(g)}</span>`),
  ].filter(Boolean).join('<span class="dot"></span>');
  const isNew = releaseBadge(item) === 'New';

  heroEl.innerHTML = `
    <div class="hero-bg" style="background-image:url('${imgUrl(item.backdrop_path, 'original')}')"></div>
    <div class="hero-inner">
      <div class="hero-content">
        <div class="hero-logo"><h1 class="hero-title">${esc(title)}</h1></div>
        <div class="hero-meta">${meta}</div>
        <p class="hero-overview">${esc(item.overview || '')}</p>
        <div class="hero-actions">
          <button class="btn-play" data-hero="play" type="button">${icon('play')}Play</button>
          <button class="btn-glass" data-hero="info" type="button">${icon('info')}More info</button>
        </div>
      </div>
      <div class="hero-side">
        <div class="hero-badges">
          ${isNew ? '<span class="hero-badge">New</span>' : ''}
          <span class="hero-badge"><b>#${idx + 1}</b> in Trending this week</span>
        </div>
        ${heroState.items.length > 1 ? `<div class="hero-dots">
          ${heroState.items.map((_, i) => `<button class="hero-dot${i === idx ? ' active' : ''}" data-idx="${i}" aria-label="Show item ${i + 1}"></button>`).join('')}
        </div>` : ''}
      </div>
    </div>
  `;
  heroEl.querySelector('[data-hero="play"]').onclick = () => play(type, item.id, title);
  heroEl.querySelector('[data-hero="info"]').onclick = (e) => { e.stopPropagation(); showInfoCard(e.currentTarget, type, item); };
  heroEl.querySelectorAll('.hero-dot').forEach(dot => {
    dot.onclick = (e) => {
      e.stopPropagation();
      renderHeroItem(Number(dot.dataset.idx));
      startHeroTimer();
    };
  });

  // Swap the text title for the film's logo artwork when there is one
  fetchLogo(type, item.id).then(path => {
    if (!path || heroState.index !== idx) return;
    const img = new Image();
    img.className = 'hero-logo-img';
    img.alt = '';
    img.onload = () => {
      const box = heroEl.querySelector('.hero-logo');
      if (heroState.index !== idx || !box) return;
      box.classList.add('has-logo');
      box.prepend(img);
    };
    img.src = imgUrl(path, 'w500');
  });
}

function startHeroTimer() {
  clearInterval(heroState.timer);
  if (heroState.items.length < 2) return;
  heroState.timer = setInterval(() => {
    if ($('home-view').classList.contains('hidden') || window.scrollY > window.innerHeight * 0.6) return;
    if (!hoverCard.classList.contains('hidden')) return;
    renderHeroItem((heroState.index + 1) % heroState.items.length);
  }, 9000);
}

function buildHero(items) {
  heroState.items = items.filter(r => r.backdrop_path && r.overview).slice(0, 5);
  if (!heroState.items.length) { heroEl.innerHTML = ''; return; }
  renderHeroItem(0);
  startHeroTimer();
}

/* ---------- Home sections ---------- */
function whenNearViewport(node, fn) {
  if (!('IntersectionObserver' in window)) { fn(); return; }
  const io = new IntersectionObserver((entries) => {
    if (!entries.some(e => e.isIntersecting)) return;
    io.disconnect();
    fn();
  }, { rootMargin: '900px 0px' });
  io.observe(node);
}

async function loadTop10() {
  const data = await tmdb('/trending/all/day');
  const items = kidsFilter(data.results || [])
    .filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path)
    .slice(0, 10);
  // The featured first card needs a wide image
  const firstWide = items.findIndex(r => r.backdrop_path);
  if (firstWide > 0) items.unshift(...items.splice(firstWide, 1));
  return items;
}

async function loadPalmeDor() {
  const found = await Promise.all(PALME_DOR.map(async ({ year, title }) => {
    const q = encodeURIComponent(title);
    let res = (await tmdb(`/search/movie?query=${q}&year=${year}`).catch(() => ({}))).results || [];
    if (!res.length) res = (await tmdb(`/search/movie?query=${q}`).catch(() => ({}))).results || [];
    const hit = res.find(r => r.poster_path);
    return hit ? { ...hit, media_type: 'movie', __badge: `Palme d'Or ${year}` } : null;
  }));
  return found.filter(Boolean);
}

async function renderSection(def, placeholder) {
  if (def.custom) return def.custom(placeholder);
  let items;
  if (def.load) {
    items = await def.load();
  } else {
    const data = await tmdb(def.path);
    items = kidsFilter(data.results || []);
    if (def.hero) buildHero(items);
  }
  items = items.filter(x => x.poster_path || x.backdrop_path);
  if (!items.length) { placeholder.remove(); return; }

  const variant = def.variant || 'landscape';
  let cards;
  if (variant === 'top10') {
    cards = items.map((it, i) => (i === 0 ? makeFeatureCard(it, 1) : makePosterCard(it, typeOf(it), { rank: i + 1 })));
  } else if (variant === 'portrait') {
    cards = items.slice(0, 25).map(it => makePosterCard(it, typeOf(it), { badge: it.__badge }));
  } else {
    cards = items.slice(0, 20).map(it => makeCard(it));
  }
  placeholder.replaceWith(makeRow(def.title, cards, '', { subtitle: def.subtitle, href: def.href, variant }));
}

let homeGen = 0;
async function loadHome() {
  homeLoaded = true;
  const gen = ++homeGen;
  heroEl.innerHTML = '<div class="hero-skeleton"></div>';
  mainRowsEl.innerHTML = '';

  const jobs = [];
  HOME_SECTIONS.filter(def => !(def.hideForKids && isKids())).forEach(def => {
    const placeholder = def.custom ? el('section', 'row') : makeSkeletonRow(def.title, def.variant || 'landscape', def.subtitle);
    mainRowsEl.appendChild(placeholder);
    const run = () => renderSection(def, placeholder).catch(err => {
      if (placeholder.isConnected) placeholder.remove();
      throw err;
    });
    if (def.eager) jobs.push(run());
    else whenNearViewport(placeholder, () => { if (gen === homeGen) run().catch(() => {}); });
  });

  const results = await Promise.allSettled(jobs);
  if (gen !== homeGen) return;
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length === results.length) {
    mainRowsEl.innerHTML = '';
    mainRowsEl.appendChild(errorPanel("Couldn't load the home page", failed[0].reason?.message, loadHome));
  }
  refreshPersonalRows();
}

/* ---------- Streaming services ---------- */
let homeService = SERVICES[0].id;
let providerLogos = null;

async function getProviderLogos() {
  if (!providerLogos) {
    providerLogos = tmdb('/watch/providers/movie?watch_region=US')
      .then(d => Object.fromEntries((d.results || []).map(p => [p.provider_id, p.logo_path])))
      .catch(() => ({}));
  }
  return providerLogos;
}

async function serviceItems(id) {
  const q = `with_watch_providers=${id}&watch_region=US&sort_by=popularity.desc&vote_count.gte=50`;
  const [m, t] = await Promise.all([
    tmdb(`/discover/movie?${q}`).catch(() => ({ results: [] })),
    tmdb(`/discover/tv?${q}`).catch(() => ({ results: [] })),
  ]);
  const movies = (m.results || []).map(x => ({ ...x, media_type: 'movie' }));
  const shows = (t.results || []).map(x => ({ ...x, media_type: 'tv' }));
  const mixed = [];
  for (let i = 0; i < Math.max(movies.length, shows.length); i++) {
    if (shows[i]) mixed.push(shows[i]);
    if (movies[i]) mixed.push(movies[i]);
  }
  return kidsFilter(mixed).filter(x => x.backdrop_path || x.poster_path).slice(0, 20);
}

async function buildServicesSection(placeholder) {
  const logos = await getProviderLogos();
  const section = el('section', 'row row--landscape row-services');
  const name = () => SERVICES.find(s => s.id === homeService)?.label || '';
  section.innerHTML = `
    ${sectionHead(`Only on <span class="accent-text" data-svc-name>${esc(name())}</span>`, 'Popular titles on this streaming service')}
    <div class="service-tiles">
      ${SERVICES.map(s => `
        <button class="service-tile${s.id === homeService ? ' active' : ''}" data-id="${s.id}" type="button">
          <span class="service-logo">${logos[s.id] ? `<img src="${imgUrl(logos[s.id], 'w92')}" alt="" loading="lazy" />` : esc(s.label[0])}</span>
          <span class="service-name">${esc(s.label)}</span>
        </button>`).join('')}
    </div>
    <div class="service-row"></div>
  `;
  const rowBox = section.querySelector('.service-row');
  const show = async () => {
    const id = homeService;
    rowBox.replaceChildren(makeSkeletonRow('', 'landscape').querySelector('.row-scroll'));
    const items = await serviceItems(id);
    if (id !== homeService) return;
    rowBox.replaceChildren(makeRow('', items.map(it => makeCard(it)), '', { head: false }));
  };
  section.querySelectorAll('.service-tile').forEach(tile => {
    tile.onclick = () => {
      homeService = Number(tile.dataset.id);
      section.querySelectorAll('.service-tile').forEach(t => t.classList.toggle('active', t === tile));
      section.querySelector('[data-svc-name]').textContent = name();
      show();
    };
  });
  placeholder.replaceWith(section);
  await show();
}

/* ---------- Genres ---------- */
function buildGenresSection(placeholder) {
  const genres = GENRES.filter(g => !(isKids() && g.id === HORROR));
  const section = el('section', 'row row-genres', `
    ${sectionHead('Browse by Genre', 'Jump straight to the best of each genre')}
    <div class="genre-chips">
      ${genres.map(g => `<a class="genre-chip" href="#/genre/${g.id}?name=${encodeURIComponent(g.name)}">${esc(g.name)}</a>`).join('')}
    </div>
  `);
  placeholder.replaceWith(section);
}

/* ---------- Continue Watching & Watchlist rows ---------- */
function makeContinueCard(entry) {
  const pct = entry.duration ? Math.min(100, (entry.time / entry.duration) * 100) : 0;
  const [src, thumb] = landscapeImage(entry);
  const label = entry.type === 'tv' ? `S${entry.season} · E${entry.episode}` : 'Movie';
  const card = cardShell('card--landscape', mediaHtml(src, thumb, entry.title,
    entry.duration ? `<div class="progress-strip"><span style="width:${pct}%"></span></div>` : ''),
    entry.title || 'Untitled', metaHtml([label, entry.duration ? `${Math.round(pct)}% watched` : 'Started']));
  card.appendChild(removeButton('Remove from Continue Watching', () => {
    removeProgressForTitle(entry.type, entry.id);
    refreshPersonalRows();
  }));
  card.onclick = () => play(entry.type, entry.id, entry.title, entry.season, entry.episode);
  return card;
}

function makeWatchlistCard(fav) {
  const [src, thumb] = posterImage(fav);
  const card = cardShell('card--poster', mediaHtml(src, thumb, fav.title), fav.title,
    metaHtml([fav.year, fav.type === 'tv' ? 'TV Show' : 'Movie']));
  card.appendChild(removeButton('Remove from Watchlist', () => {
    store.set('zs_favourites', getFavourites().filter(x => !(x.type === fav.type && x.id === fav.id)));
    refreshPersonalRows();
  }));
  card.onclick = () => play(fav.type, fav.id, fav.title);
  return card;
}

let personalRowsGen = 0;
async function refreshPersonalRows() {
  const gen = ++personalRowsGen;

  // Latest entry per title (one card per show, not per episode)
  const latest = new Map();
  Object.values(getProgressStore()).forEach(e => {
    if (!e.updatedAt) return;
    const key = `${e.type}:${e.id}`;
    if (!latest.has(key) || latest.get(key).updatedAt < e.updatedAt) latest.set(key, e);
  });
  const entries = [...latest.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 12);
  const enriched = await Promise.all(entries.map(async e => {
    if (e.backdrop_path) return e;
    try {
      const d = await fetchDetails(e.type, e.id);
      return { ...e, backdrop_path: d.backdrop_path, poster_path: e.poster_path || d.poster_path };
    } catch { return e; }
  }));
  if (gen !== personalRowsGen) return;

  const favs = getFavourites();
  personalRowsEl.innerHTML = '';
  if (enriched.length) personalRowsEl.appendChild(makeRow('Continue Watching', enriched.map(makeContinueCard), 'row-personal', { subtitle: 'Pick up where you left off' }));
  if (favs.length) personalRowsEl.appendChild(makeRow('Your Watchlist', favs.map(makeWatchlistCard), 'row-personal', { subtitle: "Titles you've saved for later", variant: 'portrait' }));
}

function showHome() {
  showView('home-view');
  setDocTitle('');
  $('home-view').classList.remove('is-searching');
  heroEl.classList.remove('hidden');
  personalRowsEl.classList.remove('hidden');
  mainRowsEl.classList.remove('hidden');
  searchResultsEl.classList.add('hidden');
  if (!homeLoaded) { loadHome(); return; }
  refreshPersonalRows();
  const y = homeScrollY;
  requestAnimationFrame(() => window.scrollTo({ top: y }));
}

/* ---------- Search results ---------- */
async function showSearch(q) {
  showView('home-view');
  if (!homeLoaded) loadHome();
  $('home-view').classList.add('is-searching');
  heroEl.classList.add('hidden');
  personalRowsEl.classList.add('hidden');
  mainRowsEl.classList.add('hidden');
  searchResultsEl.classList.remove('hidden');
  setDocTitle(`Search: ${q}`);
  if (searchInput.value.trim() !== q) searchInput.value = q;

  searchResultsEl.innerHTML = `<div class="row">${sectionHead(`Searching “${esc(q)}”…`, '')}<div class="random-grid"></div></div>`;
  const grid = searchResultsEl.querySelector('.random-grid');
  showSkeletons(grid, 12);
  try {
    const data = await tmdb(`/search/multi?query=${encodeURIComponent(q)}`);
    const items = kidsFilter(data.results || [])
      .filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path);
    searchResultsEl.querySelector('.row-title').textContent = items.length ? `Results for "${q}"` : 'No results';
    fillGrid(grid, items, `Nothing${isKids() ? ' kid-safe' : ''} matched "${q}".`);
  } catch (err) {
    searchResultsEl.innerHTML = '';
    searchResultsEl.appendChild(errorPanel('Search failed', err.message, () => showSearch(q)));
  }
}

/* ---------- Search box: autocomplete + history ---------- */
const suggestionsEl = $('searchSuggestions');
const historyEl = $('searchHistory');
const suggest = { items: [], index: -1, debounce: null, reqId: 0 };

const getSearchHistory = () => store.get('zs_search_history', []);
function addSearchHistory(q) {
  const h = getSearchHistory().filter(x => x.toLowerCase() !== q.toLowerCase());
  h.unshift(q);
  store.set('zs_search_history', h.slice(0, 5));
}

function openSearch() {
  $('searchPanel').classList.remove('hidden');
  $('searchToggle').classList.add('active');
  searchInput.focus();
  searchInput.select();
}

function closeSearch() {
  $('searchPanel').classList.add('hidden');
  $('searchToggle').classList.remove('active');
  hideSuggestions();
  historyEl.classList.add('hidden');
  searchInput.blur();
}

const searchOpen = () => !$('searchPanel').classList.contains('hidden');

function runSearch(q = searchInput.value.trim()) {
  if (!q) return;
  addSearchHistory(q);
  closeSearch();
  go(`#/search?q=${encodeURIComponent(q)}`);
}

function hideSuggestions() {
  suggest.reqId++;
  suggestionsEl.classList.add('hidden');
  suggestionsEl.innerHTML = '';
  suggest.items = [];
  suggest.index = -1;
}

function setSuggestActive(i) {
  suggest.index = i;
  suggestionsEl.querySelectorAll('.suggest-item').forEach(node => {
    node.classList.toggle('active', Number(node.dataset.idx) === i);
  });
  suggestionsEl.querySelector('.suggest-item.active')?.scrollIntoView({ block: 'nearest' });
}

function pickSuggestion(i) {
  const item = suggest.items[i];
  if (!item) return;
  searchInput.value = '';
  closeSearch();
  play(typeOf(item), item.id, titleOf(item));
}

function renderSuggestions(items, q) {
  suggest.items = items;
  suggest.index = -1;
  suggestionsEl.innerHTML = items.length
    ? items.map((it, i) => {
        const year = yearOf(it);
        const poster = imgUrl(it.poster_path, 'w92');
        return `
          <div class="suggest-item" data-idx="${i}">
            <div class="suggest-poster">${poster ? `<img src="${poster}" alt="" />` : '🎬'}</div>
            <div class="suggest-info">
              <div class="suggest-title">${esc(titleOf(it))}</div>
              <div class="suggest-meta">
                <span class="suggest-badge">${typeOf(it) === 'tv' ? 'TV' : 'Movie'}</span>
                ${year ? `<span>${esc(year)}</span>` : ''}
                ${it.vote_average ? `<span class="rating"><span class="star">★</span> ${it.vote_average.toFixed(1)}</span>` : ''}
              </div>
            </div>
          </div>`;
      }).join('')
    : `<div class="suggest-empty">No matches for "${esc(q)}"</div>`;
  suggestionsEl.classList.remove('hidden');
  suggestionsEl.querySelectorAll('.suggest-item').forEach(node => {
    node.onmouseenter = () => setSuggestActive(Number(node.dataset.idx));
    node.onclick = () => pickSuggestion(Number(node.dataset.idx));
  });
}

async function fetchSuggestions(raw) {
  const q = raw.trim();
  if (q.length < 2) { hideSuggestions(); return; }
  const reqId = ++suggest.reqId;
  suggestionsEl.innerHTML = '<div class="suggest-loading">Searching…</div>';
  suggestionsEl.classList.remove('hidden');
  try {
    const data = await tmdb(`/search/multi?query=${encodeURIComponent(q)}`);
    if (reqId !== suggest.reqId) return;
    const items = kidsFilter(data.results || [])
      .filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path)
      .slice(0, 8);
    renderSuggestions(items, q);
  } catch {
    if (reqId !== suggest.reqId) return;
    suggestionsEl.innerHTML = '<div class="suggest-empty">Couldn\'t search right now</div>';
  }
}

function renderSearchHistory() {
  const h = getSearchHistory();
  if (!h.length) { historyEl.classList.add('hidden'); return; }
  historyEl.innerHTML = `
    <div class="sh-header"><span>Recent searches</span><button class="sh-clear">Clear</button></div>
    ${h.map(q => `<div class="sh-item" data-q="${esc(q)}">${icon('search')}${esc(q)}</div>`).join('')}
  `;
  historyEl.classList.remove('hidden');
  historyEl.querySelector('.sh-clear').onclick = (e) => {
    e.stopPropagation();
    store.set('zs_search_history', []);
    historyEl.classList.add('hidden');
  };
  historyEl.querySelectorAll('.sh-item').forEach(item => {
    item.onclick = () => { searchInput.value = item.dataset.q; runSearch(item.dataset.q); };
  });
}

function wireSearch() {
  $('searchToggle').onclick = (e) => {
    e.stopPropagation();
    if (searchOpen()) closeSearch(); else openSearch();
  };

  searchInput.addEventListener('input', () => {
    historyEl.classList.add('hidden');
    clearTimeout(suggest.debounce);
    if (!searchInput.value.trim()) { hideSuggestions(); renderSearchHistory(); return; }
    suggest.debounce = setTimeout(() => fetchSuggestions(searchInput.value), 200);
  });

  searchInput.addEventListener('keydown', (e) => {
    const open = !suggestionsEl.classList.contains('hidden');
    const count = suggest.items.length;
    if (e.key === 'ArrowDown' && open && count) {
      e.preventDefault(); setSuggestActive((suggest.index + 1) % count);
    } else if (e.key === 'ArrowUp' && open && count) {
      e.preventDefault(); setSuggestActive((suggest.index - 1 + count) % count);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && suggest.index >= 0) pickSuggestion(suggest.index);
      else runSearch();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      closeSearch();
    }
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length >= 2) fetchSuggestions(searchInput.value);
    else if (!searchInput.value.trim()) renderSearchHistory();
  });

  document.addEventListener('click', (e) => {
    if (!searchOpen() || $('searchPanel').contains(e.target)) return;
    closeSearch();
  });
}

/* ============================================================
   8. GRIDS
   ============================================================ */

/* ---------- Random picks ---------- */
const randomGenreEl = $('randomGenre');
const refreshRandomBtn = $('refreshRandom');
let randomRunId = 0;

async function refreshRandomGrid() {
  const runId = ++randomRunId;
  const grid = $('randomGrid');
  refreshRandomBtn.disabled = true;
  refreshRandomBtn.classList.remove('spin');
  void refreshRandomBtn.offsetWidth;
  refreshRandomBtn.classList.add('spin');
  showSkeletons(grid, 8);

  try {
    const genre = randomGenreEl.value;
    const base = `/discover/movie?sort_by=popularity.desc&vote_count.gte=100&vote_average.gte=5.5${genre ? `&with_genres=${genre}` : ''}`;
    const first = await tmdb(`${base}&page=1`);
    const maxPage = Math.max(1, Math.min(first.total_pages || 1, 500));

    const picks = new Map();
    for (let round = 0; round < 3 && picks.size < 8; round++) {
      const pages = Array.from({ length: 8 - picks.size }, () => 1 + Math.floor(Math.random() * maxPage));
      const results = await Promise.all(pages.map(p => tmdb(`${base}&page=${p}`).catch(() => ({ results: [] }))));
      results.forEach(r => {
        const pool = kidsFilter(r.results || []).filter(x => !picks.has(x.id));
        if (pool.length && picks.size < 8) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          picks.set(pick.id, pick);
        }
      });
    }
    if (runId !== randomRunId) return;
    fillGrid(grid, [...picks.values()], "Couldn't fetch any picks. Try again.");
  } catch {
    if (runId === randomRunId) showEmpty(grid, 'Something went wrong. Try again.');
  } finally {
    setTimeout(() => {
      refreshRandomBtn.disabled = false;
      refreshRandomBtn.classList.remove('spin');
    }, 500);
  }
}

function openRandom() {
  showView('random-view');
  setDocTitle('Random Picks');
  refreshRandomGrid();
}

/* ---------- Genre ---------- */
async function openGenre(genreId, genreName) {
  const name = genreName || GENRES.find(g => g.id === genreId)?.name || 'Genre';
  showView('genre-view');
  $('genreTitle').textContent = name;
  setDocTitle(name);
  const grid = $('genreGrid');
  showSkeletons(grid, 12);
  try {
    const path = (p) => `/discover/movie?sort_by=vote_average.desc&vote_count.gte=500&with_genres=${genreId}&page=${p}`;
    const [p1, p2] = await Promise.all([tmdb(path(1)), tmdb(path(2)).catch(() => ({ results: [] }))]);
    const seen = new Set();
    const items = kidsFilter([...(p1.results || []), ...(p2.results || [])])
      .filter(r => !seen.has(r.id) && seen.add(r.id))
      .slice(0, 18);
    fillGrid(grid, items, 'No titles found.');
  } catch {
    showEmpty(grid, 'Something went wrong.');
  }
}

/* ---------- Top 100 (ranked by IMDb) ---------- */
const TOP100_TTL = 7 * 24 * 60 * 60 * 1000;
const top100Memory = {};
const top100State = { type: 'movie', page: 1 };

async function buildTop100List(type, onProgress) {
  const cacheKey = `zs_top100_imdb_${type}${isKids() ? '_kids' : ''}`;
  if (top100Memory[cacheKey]) return top100Memory[cacheKey];
  try {
    const cached = JSON.parse(rawGet(cacheKey) || 'null');
    if (cached?.items && Date.now() - cached.ts < TOP100_TTL) {
      top100Memory[cacheKey] = cached.items;
      return cached.items;
    }
  } catch {}

  const minVotes = type === 'movie' ? 20000 : 5000;
  const pages = await Promise.all([1, 2, 3, 4, 5].map(p =>
    tmdb(`/discover/${type}?sort_by=vote_average.desc&vote_count.gte=${minVotes}&page=${p}`)
      .catch(() => ({ results: [] }))
  ));
  const seen = new Set();
  const pool = [];
  pages.forEach(r => (r.results || []).forEach(item => {
    if (item.poster_path && !seen.has(item.id)) { seen.add(item.id); pool.push(item); }
  }));

  let done = 0;
  const enriched = await Promise.all(pool.map(async item => {
    let score = 0;
    try {
      const details = await fetchDetails(type, item.id);
      const r = await imdbRating(details.external_ids?.imdb_id);
      score = parseFloat(r?.rating) || 0;
    } catch {}
    onProgress?.(++done, pool.length);
    return { ...item, __imdb: score };
  }));

  const sorted = enriched
    .filter(x => x.__imdb > 0)
    .sort((a, b) => b.__imdb - a.__imdb || (b.vote_count || 0) - (a.vote_count || 0))
    .slice(0, 100);
  top100Memory[cacheKey] = sorted;
  rawSet(cacheKey, JSON.stringify({ items: sorted, ts: Date.now() }));
  return sorted;
}

function makeTop100Card(item, rank, type) {
  const score = item.__imdb > 0 ? item.__imdb.toFixed(1) : null;
  const [src, thumb] = posterImage(item);
  const card = cardShell('card--poster card--ranked', mediaHtml(src, thumb, titleOf(item), `
    ${topBadge(rank)}
    <div class="imdb-badge${score ? '' : ' empty'}"><b>IMDb</b> ${score || '—'}</div>`),
    titleOf(item), metaHtml([yearOf(item), type === 'tv' ? 'TV Show' : 'Movie']));
  return wireCard(card, item, type);
}

async function loadTop100Page(page) {
  top100State.page = page;
  const grid = $('top100Grid');
  const sub = $('top100Sub');
  const type = top100State.type;
  showSkeletons(grid, 20, 'portrait');
  $('top100Pagination').innerHTML = '';
  try {
    const list = await buildTop100List(type, (done, total) => {
      sub.textContent = `Ranking by IMDb… ${done}/${total}`;
    });
    if (type !== top100State.type || page !== top100State.page) return;
    sub.textContent = `Ranked by IMDb rating · ${type === 'tv' ? 'Series' : 'Films'}`;
    const start = (page - 1) * 20;
    const slice = list.slice(start, start + 20);
    grid.innerHTML = '';
    if (!slice.length) { showEmpty(grid, 'No titles found.'); return; }
    slice.forEach((item, i) => grid.appendChild(makeTop100Card(item, start + i + 1, type)));
    renderPager($('top100Pagination'), page, Math.min(5, Math.ceil(list.length / 20)), (p) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      loadTop100Page(p);
    });
  } catch {
    showEmpty(grid, 'Something went wrong loading the list.');
  }
}

function openTop100(type) {
  top100State.type = type === 'tv' ? 'tv' : 'movie';
  const heading = top100State.type === 'tv' ? 'Top 100 TV Shows' : 'Top 100 Movies';
  showView('top100-view');
  $('top100Title').textContent = heading;
  setDocTitle(heading);
  $('top100Toggle').querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === top100State.type);
  });
  loadTop100Page(1);
}

/* ---------- Discover ---------- */
const discoverState = { filter: 'new', page: 1, service: SERVICES[0].id, genre: 28 };

function discoverPathFor(page) {
  const s = discoverState;
  switch (s.filter) {
    case 'upcoming': return { path: `/movie/upcoming?page=${page}`,    label: 'Upcoming Movies' };
    case 'trending': return { path: `/trending/all/week?page=${page}`, label: 'Trending This Week' };
    case 'service': {
      const svc = SERVICES.find(x => x.id === s.service) || SERVICES[0];
      return {
        path: `/discover/movie?sort_by=popularity.desc&vote_count.gte=100&with_watch_providers=${svc.id}&watch_region=US&page=${page}`,
        label: `On ${svc.label}`,
      };
    }
    case 'top-genre': {
      const g = GENRES.find(x => x.id === s.genre) || GENRES[0];
      return {
        path: `/discover/movie?sort_by=vote_average.desc&vote_count.gte=500&with_genres=${g.id}&page=${page}`,
        label: `Top ${g.name}`,
      };
    }
    default: return { path: `/movie/now_playing?page=${page}`, label: 'New Releases' };
  }
}

function buildDiscoverFilters() {
  const wrap = $('discoverFilters');
  wrap.innerHTML = '';
  DISCOVER_FILTERS.forEach(f => {
    const pill = el('button', 'filter-pill' + (f.key === discoverState.filter ? ' active' : ''));
    pill.textContent = f.label;
    pill.onclick = () => {
      discoverState.filter = f.key;
      buildDiscoverFilters();
      buildDiscoverControls();
      loadDiscoverPage(1);
    };
    wrap.appendChild(pill);
  });
}

function buildDiscoverControls() {
  const wrap = $('discoverControls');
  wrap.innerHTML = '';
  const { filter } = discoverState;
  if (filter !== 'service' && filter !== 'top-genre') return;
  const sel = el('select', 'genre-select');
  if (filter === 'service') {
    sel.innerHTML = SERVICES.map(s => `<option value="${s.id}"${s.id === discoverState.service ? ' selected' : ''}>${esc(s.label)}</option>`).join('');
    sel.onchange = () => { discoverState.service = Number(sel.value); loadDiscoverPage(1); };
  } else {
    sel.innerHTML = GENRES.map(g => `<option value="${g.id}"${g.id === discoverState.genre ? ' selected' : ''}>${esc(g.name)}</option>`).join('');
    sel.onchange = () => { discoverState.genre = Number(sel.value); loadDiscoverPage(1); };
  }
  wrap.appendChild(sel);
}

async function loadDiscoverPage(page) {
  discoverState.page = page;
  const grid = $('discoverGrid');
  const pager = $('discoverPagination');
  const snapshot = JSON.stringify(discoverState);
  showSkeletons(grid, 12);
  pager.innerHTML = '';
  const { path, label } = discoverPathFor(page);
  $('discoverSub').textContent = label;
  try {
    const data = await tmdb(path);
    if (snapshot !== JSON.stringify(discoverState)) return;
    fillGrid(grid, kidsFilter(data.results || []).filter(x => x.poster_path));
    renderPager(pager, page, Math.min(data.total_pages || 1, 8), (p) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      loadDiscoverPage(p);
    });
  } catch {
    showEmpty(grid, "Couldn't load. Try again.");
  }
}

function openDiscover() {
  showView('discover-view');
  setDocTitle('Discover');
  buildDiscoverFilters();
  buildDiscoverControls();
  loadDiscoverPage(discoverState.page || 1);
}

/* ---------- Person ---------- */
async function openPerson(personId) {
  showView('person-view');
  const header = $('personHeader');
  const grid = $('personGrid');
  header.innerHTML = '<div class="person-photo"><div class="photo-fallback">👤</div></div>';
  showSkeletons(grid, 12);
  try {
    const [person, credits] = await Promise.all([
      tmdb(`/person/${personId}`),
      tmdb(`/person/${personId}/combined_credits`),
    ]);
    setDocTitle(person.name);
    const photo = imgUrl(person.profile_path, 'w300');
    header.innerHTML = `
      <div class="person-photo">${photo ? `<img src="${photo}" alt="${esc(person.name)}" />` : '<div class="photo-fallback">👤</div>'}</div>
      <div class="person-info">
        <h1 class="person-name">${esc(person.name)}</h1>
        <div class="person-meta">
          ${person.known_for_department ? `<span><strong>Known for</strong>${esc(person.known_for_department)}</span>` : ''}
          ${person.birthday ? `<span><strong>Born</strong>${esc(person.birthday)}</span>` : ''}
          ${person.place_of_birth ? `<span><strong>From</strong>${esc(person.place_of_birth)}</span>` : ''}
        </div>
        ${person.biography ? `<p class="person-bio collapsed">${esc(person.biography)}</p>
          <button class="bio-toggle">Read more</button>` : ''}
      </div>
    `;
    const bio = header.querySelector('.person-bio');
    const toggle = header.querySelector('.bio-toggle');
    if (bio && toggle) toggle.onclick = () => {
      bio.classList.toggle('collapsed');
      toggle.textContent = bio.classList.contains('collapsed') ? 'Read more' : 'Show less';
    };

    const seen = new Set();
    const items = kidsFilter(credits.cast || [])
      .filter(c => c.poster_path && (c.media_type === 'movie' || c.media_type === 'tv'))
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .filter(c => { const k = `${c.media_type}:${c.id}`; return !seen.has(k) && seen.add(k); })
      .slice(0, 40);
    fillGrid(grid, items);
  } catch {
    header.innerHTML = '<div class="random-empty">Couldn\'t load person.</div>';
    grid.innerHTML = '';
  }
}

/* ---------- Collection ---------- */
async function openCollection(collectionId, fallbackName) {
  showView('collection-view');
  const banner = $('collectionBanner');
  const grid = $('collectionGrid');
  banner.classList.add('hidden');
  showSkeletons(grid, 10);
  try {
    const data = await tmdb(`/collection/${collectionId}`);
    const name = data.name || fallbackName || 'Collection';
    setDocTitle(name);
    const backdrop = imgUrl(data.backdrop_path || data.parts?.[0]?.backdrop_path, 'original');
    banner.innerHTML = `
      ${backdrop ? `<div class="cb-bg" style="background-image:url('${backdrop}')"></div>` : ''}
      <div class="cb-content"><h1>${esc(name)}</h1><p>${esc(data.overview || '')}</p></div>
    `;
    banner.classList.remove('hidden');
    const parts = kidsFilter(data.parts || [])
      .filter(p => p.poster_path)
      .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
    fillGrid(grid, parts);
  } catch {
    showEmpty(grid, "Couldn't load collection.");
  }
}

/* ============================================================
   9. PLAYER
   ============================================================ */
let iframe = $('player');

/* Swap in a fresh iframe instead of changing src: re-pointing an existing
   iframe adds entries to browser history, which breaks the Back button. */
function setPlayerSrc(url) {
  if (iframe.getAttribute('src') === url) return;
  const fresh = iframe.cloneNode(false);
  fresh.src = url;
  iframe.replaceWith(fresh);
  iframe = fresh;
}
const statusEl = $('status');
const sourceSelect = $('sourceSelect');
const nextEpisodeBtn = $('nextEpisodeBtn');
const tvPickerRoot = $('tvPickerRoot');
const epHover = $('epHover');

const player = {
  current: null,        // { type, id, season, episode, title, poster }
  source: null,
  fallbackTimer: null,
  watchTicker: null,
  playing: false,
  token: 0,
  lastProgressSave: 0,
};

let playerReady = false;
const storedSource = () => rawGet('zs_player_source') || 'cinesrc';

function cinesrcUrl(type, id, season, episode) {
  const s = getSettings();
  const params = new URLSearchParams();
  if (type === 'tv') {
    params.set('s', season);
    params.set('e', episode);
  }
  params.set('back', 'close');
  params.set('color', '#' + (document.documentElement.dataset.accentHex || 'ffb6d9'));
  if (type === 'tv') {
    params.set('autonext', s.autonext ? 'true' : 'false');
    params.set('autoskip', s.autoskip ? 'true' : 'false');
  }
  if (!s.autoplay) params.set('autoplay', 'false');
  const prog = getProgressFor(type, id, season, episode);
  if (prog && prog.time > 30 && prog.duration && prog.time / prog.duration < 0.95) {
    params.set('t', Math.floor(prog.time));
    params.set('continueprompt', 'false');
  }
  return `${ORIGIN}/embed/${type}/${id}?${params.toString()}`;
}

function sourceUrl(key, type, id, season, episode) {
  const s = season || 1, e = episode || 1;
  switch (key) {
    case 'vidsrc':
      return type === 'movie' ? `https://vidsrc.to/embed/movie/${id}` : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`;
    case '2embed':
      return type === 'movie' ? `https://www.2embed.cc/embed/${id}` : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`;
    case 'multi':
      return type === 'movie'
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`;
    default:
      return cinesrcUrl(type, id, s, e);
  }
}

function applySource(key) {
  const c = player.current;
  if (!c) return;
  player.source = key;
  playerReady = false;
  sourceSelect.value = key;
  setPlayerSrc(sourceUrl(key, c.type, c.id, c.season, c.episode));
  statusEl.textContent = 'Loading…';

  clearTimeout(player.fallbackTimer);
  player.fallbackTimer = null;
  clearInterval(player.watchTicker);
  if (key !== 'cinesrc') { startWatchTicker(); return; }
  // Only CineSrc reports "ready"; if it stays silent, fall back to VidSrc
  const token = player.token;
  player.fallbackTimer = setTimeout(() => {
    if (token !== player.token || player.source !== 'cinesrc') return;
    toast('CineSrc slow — trying VidSrc…');
    applySource('vidsrc');
  }, SOURCE_READY_TIMEOUT);
}

function sendCommand(command, args = []) {
  try { iframe.contentWindow.postMessage({ type: 'cinesrc:command', command, args }, ORIGIN); } catch {}
}

async function openPlayer(type, id, season, episode, title) {
  const token = ++player.token;
  showView('player-view');
  $('player-title').textContent = title || '';
  setDocTitle(title);

  if (isKids() && !(await isKidSafe(type, id))) {
    if (token !== player.token) return;
    toast('Not available on a Kids profile');
    location.replace('#/');
    return;
  }
  if (token !== player.token) return;

  player.current = { type, id, season: season || 1, episode: episode || 1, title: title || '', poster: null };
  player.lastProgressSave = 0;
  player.playing = false;
  applySource(storedSource());

  nextEpisodeBtn.classList.toggle('hidden', type !== 'tv');
  maybeShowResumePrompt();
  if (type === 'tv') renderTvPicker(id, player.current.season, player.current.episode);
  else hideTvPicker();
  loadSimilar(type, id);

  // Fill in details we might not have (deep links carry no poster / sometimes no title)
  fetchDetails(type, id).then(d => {
    if (token !== player.token || !player.current) return;
    player.current.poster = d.poster_path || null;
    if (!player.current.title) {
      player.current.title = titleOf(d);
      $('player-title').textContent = player.current.title;
      setDocTitle(player.current.title);
    }
  }).catch(() => {});
}

function leavePlayer() {
  if (!player.current && !iframe.getAttribute('src')) return;
  player.token++;
  player.current = null;
  player.playing = false;
  clearTimeout(player.fallbackTimer);
  clearInterval(player.watchTicker);
  setPlayerSrc('about:blank');
  $('resumeOverlay')?.remove();
  hideTvPicker();
  hideEpisodeTooltip();
  $('similar-section').classList.add('hidden');
  $('similarGrid').innerHTML = '';
}

/* ---------- Progress ---------- */
function saveProgress(time, duration) {
  const c = player.current;
  if (!c) return;
  const now = Date.now();
  if (now - player.lastProgressSave < 4000) return;
  player.lastProgressSave = now;

  const s = getProgressStore();
  const key = progressKey(c.type, c.id, c.season, c.episode);
  if (!duration || time < 5 || time / duration > 0.92) {
    if (s[key]) { delete s[key]; store.set('zs_progress', s); }
    return;
  }
  s[key] = {
    type: c.type, id: c.id, season: c.season, episode: c.episode,
    title: c.title, poster_path: c.poster, time, duration, updatedAt: now,
  };
  store.set('zs_progress', s);
}

/* Other sources: count seconds the player is actually on screen, then mark
   the episode/movie as started so it shows up in Continue Watching. */
function startWatchTicker() {
  const token = player.token;
  let seen = 0;
  player.watchTicker = setInterval(() => {
    if (token !== player.token || !player.current) { clearInterval(player.watchTicker); return; }
    if (document.visibilityState !== 'visible' || $('player-view').classList.contains('hidden')) return;
    seen += 5;
    if (seen < STARTED_AFTER_SECONDS) return;
    clearInterval(player.watchTicker);
    markStarted();
  }, 5000);
}

function markStarted() {
  const c = player.current;
  if (!c) return;
  const s = getProgressStore();
  const key = progressKey(c.type, c.id, c.season, c.episode);
  const existing = s[key];
  // Keep real CineSrc progress if there is some; just bump it to the front
  s[key] = existing
    ? { ...existing, title: c.title || existing.title, poster_path: c.poster || existing.poster_path, updatedAt: Date.now() }
    : { type: c.type, id: c.id, season: c.season, episode: c.episode, title: c.title,
        poster_path: c.poster, time: 0, duration: 0, updatedAt: Date.now() };
  store.set('zs_progress', s);
}

/* ---------- Resume prompt ---------- */
function maybeShowResumePrompt() {
  const c = player.current;
  if (player.source !== 'cinesrc') return;
  const prog = getProgressFor(c.type, c.id, c.season, c.episode);
  if (!prog || prog.time < 30 || !prog.duration || prog.time / prog.duration > 0.95) return;

  const token = player.token;
  setTimeout(() => {
    if (token !== player.token) return;
    $('resumeOverlay')?.remove();
    const poster = imgUrl(prog.poster_path, 'w500');
    const overlay = el('div', 'resume-overlay', `
      <div class="resume-card">
        ${poster ? `<div class="resume-bg" style="background-image:url('${poster}')"></div>` : ''}
        <div class="resume-body">
          <div class="resume-eyebrow">Continue watching</div>
          <h3 class="resume-title">${esc(prog.title || 'Resume?')}</h3>
          <p class="resume-desc">You stopped at <strong>${formatTime(prog.time)}</strong></p>
          <div class="resume-actions">
            <button class="resume-btn resume-btn-primary" data-act="resume">▶ Resume</button>
            <button class="resume-btn resume-btn-ghost" data-act="restart">Start over</button>
          </div>
        </div>
      </div>
    `);
    overlay.id = 'resumeOverlay';
    document.body.appendChild(overlay);
    // The embed URL already seeks via t=; "Start over" seeks back to 0
    overlay.querySelector('[data-act="resume"]').onclick = () => overlay.remove();
    overlay.querySelector('[data-act="restart"]').onclick = () => { overlay.remove(); seekWhenReady(0); };
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }, 400);
}

function seekWhenReady(time) {
  if (playerReady) { sendCommand('seek', [time]); return; }
  const token = player.token;
  const onReady = (e) => {
    if (e.origin !== ORIGIN || e.data?.type !== 'cinesrc:ready') return;
    window.removeEventListener('message', onReady);
    if (token === player.token) setTimeout(() => sendCommand('seek', [time]), 80);
  };
  window.addEventListener('message', onReady);
  setTimeout(() => window.removeEventListener('message', onReady), 8000);
}

/* ---------- Messages from the CineSrc player ---------- */
window.addEventListener('message', (event) => {
  if (event.origin !== ORIGIN) return;
  const d = event.data || {};
  switch (d.type) {
    case 'cinesrc:ready':
      playerReady = true;
      clearTimeout(player.fallbackTimer);
      statusEl.textContent = 'Ready';
      break;
    case 'cinesrc:play':  player.playing = true;  statusEl.textContent = 'Playing'; break;
    case 'cinesrc:pause': player.playing = false; statusEl.textContent = 'Paused';  break;
    case 'cinesrc:timeupdate':
      if (typeof d.currentTime === 'number' && typeof d.duration === 'number') {
        statusEl.textContent = `${formatTime(d.currentTime)} / ${formatTime(d.duration)}`;
        saveProgress(d.currentTime, d.duration);
      }
      break;
    case 'cinesrc:error':
      statusEl.textContent = 'Error: ' + JSON.stringify(d.error);
      break;
    case 'cinesrc:nextepisode': {
      const c = player.current;
      if (c && c.type === 'tv' && d.season != null && d.episode != null) {
        c.season = Number(d.season);
        c.episode = Number(d.episode);
        player.lastProgressSave = 0;
        history.replaceState(null, '', watchHash('tv', c.id, c.season, c.episode, c.title));
        renderTvPicker(c.id, c.season, c.episode);
      }
      break;
    }
    case 'cinesrc:close':
      player.playing = false;
      go('#/');
      break;
  }
});

/* ---------- Auto-pause when the app loses focus ---------- */
function pauseIfPlaying() {
  if (!player.playing || $('player-view').classList.contains('hidden')) return;
  sendCommand('pause');
  player.playing = false;
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') pauseIfPlaying();
});
let blurTimer = null;
window.addEventListener('blur', () => {
  clearTimeout(blurTimer);
  blurTimer = setTimeout(() => {
    // Clicking into the player iframe also blurs the window — ignore that
    if (document.activeElement?.tagName === 'IFRAME') return;
    if (document.visibilityState === 'hidden') return;
    pauseIfPlaying();
  }, 250);
});
window.addEventListener('focus', () => clearTimeout(blurTimer));

/* ---------- Next episode (rolls over into the next season) ---------- */
async function nextEpisode() {
  const c = player.current;
  if (!c || c.type !== 'tv') return;
  let season = c.season;
  let episode = c.episode + 1;
  try {
    const seasonData = await tmdb(`/tv/${c.id}/season/${season}`);
    const count = (seasonData.episodes || []).length;
    if (count && episode > count) {
      const show = await fetchDetails('tv', c.id);
      const later = (show.seasons || [])
        .filter(s => s.season_number > season && s.episode_count > 0)
        .sort((a, b) => a.season_number - b.season_number)[0];
      if (!later) { toast("That's the last episode"); return; }
      season = later.season_number;
      episode = 1;
    }
  } catch {}
  toast(`Loading S${season} E${episode}…`);
  play('tv', c.id, c.title, season, episode);
}
nextEpisodeBtn.onclick = nextEpisode;

async function previousEpisode() {
  const c = player.current;
  if (!c || c.type !== 'tv') return;
  let season = c.season;
  let episode = c.episode - 1;
  if (episode < 1) {
    try {
      const show = await fetchDetails('tv', c.id);
      const earlier = (show.seasons || [])
        .filter(s => s.season_number > 0 && s.season_number < season && s.episode_count > 0)
        .sort((a, b) => b.season_number - a.season_number)[0];
      if (!earlier) { toast("That's the first episode"); return; }
      season = earlier.season_number;
      episode = earlier.episode_count;
    } catch { return; }
  }
  toast(`Loading S${season} E${episode}…`);
  play('tv', c.id, c.title, season, episode);
}

/* ---------- TV episode picker ---------- */
function hideTvPicker() {
  tvPickerRoot.classList.add('hidden');
  tvPickerRoot.innerHTML = '';
}

let tvPickerToken = 0;
async function renderTvPicker(tvId, season, activeEpisode) {
  const token = ++tvPickerToken;
  tvPickerRoot.classList.remove('hidden');
  tvPickerRoot.innerHTML = '<div class="tv-picker-card"><div class="tv-picker-loading">Loading episodes…</div></div>';
  try {
    const info = await fetchDetails('tv', tvId);
    const seasons = (info.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0);
    if (!seasons.length) {
      if (token === tvPickerToken) tvPickerRoot.innerHTML = '<div class="tv-picker-card"><div class="tv-picker-empty">No episodes available.</div></div>';
      return;
    }
    if (!seasons.some(s => s.season_number === season)) season = seasons[0].season_number;
    const seasonData = await tmdb(`/tv/${tvId}/season/${season}`);
    if (token !== tvPickerToken) return;
    const episodes = seasonData.episodes || [];

    tvPickerRoot.innerHTML = `
      <div class="tv-picker-card">
        <div class="tv-picker-head">
          <h3><span class="show-name">${esc(info.name || 'Episodes')}</span><span class="season-label">· S${season}</span></h3>
          <select aria-label="Select season">
            ${seasons.map(s => `<option value="${s.season_number}"${s.season_number === season ? ' selected' : ''}>
              ${esc(s.name || `Season ${s.season_number}`)} · ${s.episode_count} eps</option>`).join('')}
          </select>
        </div>
        <div class="episode-strip">
          ${episodes.length ? episodes.map(ep => {
            const still = imgUrl(ep.still_path, 'w300');
            const meta = [ep.air_date || '', ep.runtime ? `${ep.runtime} min` : ''].filter(Boolean).join(' · ');
            return `
              <div class="ep-card${ep.episode_number === activeEpisode ? ' active' : ''}" data-ep="${ep.episode_number}">
                <div class="ep-thumb">
                  ${still ? `<img src="${still}" alt="" loading="lazy" />` : ''}
                  <span class="ep-num">E${ep.episode_number}</span>
                </div>
                <div class="ep-body">
                  <div class="ep-title">${esc(ep.name || `Episode ${ep.episode_number}`)}</div>
                  <div class="ep-meta">${esc(meta)}</div>
                </div>
              </div>`;
          }).join('') : '<div class="tv-picker-empty">No episodes in this season.</div>'}
        </div>
      </div>
    `;

    tvPickerRoot.querySelector('select').onchange = (e) => {
      const s = Number(e.target.value);
      const c = player.current;
      renderTvPicker(tvId, s, c && c.season === s ? c.episode : null);
    };

    tvPickerRoot.querySelectorAll('.ep-card').forEach(card => {
      const ep = episodes.find(x => x.episode_number === Number(card.dataset.ep));
      card.onclick = () => {
        hideEpisodeTooltip();
        play('tv', tvId, info.name || '', season, Number(card.dataset.ep));
      };
      card.addEventListener('mouseenter', () => showEpisodeTooltip(card, season, ep));
      card.addEventListener('mouseleave', hideEpisodeTooltip);
    });

    // Scroll the episode list (not the page) so the current episode is visible
    const active = tvPickerRoot.querySelector('.ep-card.active');
    const strip = tvPickerRoot.querySelector('.episode-strip');
    if (active && strip) strip.scrollTop = Math.max(0, active.offsetTop - strip.offsetTop - 8);
  } catch {
    if (token === tvPickerToken) tvPickerRoot.innerHTML = '<div class="tv-picker-card"><div class="tv-picker-empty">Couldn\'t load episodes.</div></div>';
  }
}

/* ---------- Episode tooltip ---------- */
let epHoverTimer = null;

function showEpisodeTooltip(card, season, ep) {
  if (!ep) return;
  clearTimeout(epHoverTimer);
  epHover.innerHTML = `
    <div class="eh-head">
      <span class="eh-num">S${season} · E${ep.episode_number}</span>
      ${ep.vote_average ? `<span class="eh-rating">★ ${Number(ep.vote_average).toFixed(1)}</span>` : '<span class="eh-rating empty">No rating</span>'}
    </div>
    <h4 class="eh-title">${esc(ep.name || `Episode ${ep.episode_number}`)}</h4>
    <div class="eh-meta">
      ${ep.air_date ? `<span>${esc(ep.air_date)}</span>` : ''}
      ${ep.air_date && ep.runtime ? '<span class="dot"></span>' : ''}
      ${ep.runtime ? `<span>${ep.runtime} min</span>` : ''}
    </div>
    <p class="eh-overview${ep.overview ? '' : ' empty'}">${esc(ep.overview || 'No description available.')}</p>
  `;
  epHover.classList.remove('hidden');
  const rect = card.getBoundingClientRect();
  const w = 280, h = epHover.offsetHeight || 200, m = 12;
  const left = Math.max(m, Math.min(rect.left + rect.width / 2 - w / 2, window.innerWidth - w - m));
  const top = rect.top > h + 20 ? rect.top - h - m : Math.min(rect.bottom + m, window.innerHeight - h - m);
  epHover.style.left = left + 'px';
  epHover.style.top = top + 'px';
  epHover.classList.add('show');
}

function hideEpisodeTooltip() {
  clearTimeout(epHoverTimer);
  epHover.classList.remove('show');
  epHoverTimer = setTimeout(() => epHover.classList.add('hidden'), 150);
}
window.addEventListener('scroll', hideEpisodeTooltip, { passive: true, capture: true });

/* ---------- Similar titles ---------- */
async function loadSimilar(type, id) {
  const section = $('similar-section');
  const grid = $('similarGrid');
  const token = player.token;
  section.classList.remove('hidden');
  showSkeletons(grid, 8);
  try {
    const data = await tmdb(`/${type}/${id}/similar`);
    if (token !== player.token) return;
    const items = kidsFilter(data.results || [])
      .filter(x => x.poster_path)
      .map(x => ({ ...x, media_type: type }))
      .slice(0, 12);
    if (!items.length) { section.classList.add('hidden'); return; }
    fillGrid(grid, items);
  } catch {
    section.classList.add('hidden');
  }
}

function wirePlayer() {
  sourceSelect.innerHTML = SOURCES.map(s => `<option value="${s.key}">${esc(s.label)}</option>`).join('');
  sourceSelect.value = storedSource();
  sourceSelect.onchange = () => {
    rawSet('zs_player_source', sourceSelect.value);
    toast('Source: ' + SOURCES.find(s => s.key === sourceSelect.value)?.label);
    applySource(sourceSelect.value);
  };
  $('backHome').onclick = () => go('#/');
}

/* ============================================================
   10. SETTINGS
   ============================================================ */
function renderSettings() {
  renderSyncUI();
  const s = getSettings();
  document.querySelectorAll('[data-setting]').forEach(input => { input.checked = !!s[input.dataset.setting]; });

  const current = currentAccentKey();
  const grid = $('accentGrid');
  grid.innerHTML = Object.entries(ACCENTS).map(([key, a]) => `
    <div class="accent-item">
      <div class="accent-swatch-lg${current === key ? ' active' : ''}" data-key="${key}" title="${a.label}" style="background:${a.base}"></div>
      <div class="accent-swatch-label">${a.label}</div>
    </div>
  `).join('');
  grid.querySelectorAll('.accent-swatch-lg').forEach(sw => {
    sw.onclick = () => {
      applyAccent(sw.dataset.key);
      grid.querySelectorAll('.accent-swatch-lg').forEach(x => x.classList.toggle('active', x === sw));
      refreshProfileButton();
      toast('Accent: ' + ACCENTS[sw.dataset.key].label);
    };
  });
}

function openSettings() {
  showView('settings-view');
  setDocTitle('Settings');
  renderSettings();
}

function flashButton(btn, text, original) {
  btn.textContent = text;
  setTimeout(() => { btn.textContent = original; }, 1600);
}

function wireSettings() {
  document.querySelectorAll('[data-setting]').forEach(input => {
    input.addEventListener('change', () => {
      store.set('zs_settings', { ...getSettings(), [input.dataset.setting]: input.checked });
      toast(input.checked ? 'Setting enabled' : 'Setting disabled');
    });
  });
  $('clearProgress').onclick = (e) => {
    store.remove('zs_progress');
    flashButton(e.currentTarget, 'Cleared ✓', 'Clear');
    toast('Progress cleared');
    refreshPersonalRows();
  };
  $('clearWatchlist').onclick = (e) => {
    store.remove('zs_favourites');
    flashButton(e.currentTarget, 'Cleared ✓', 'Clear');
    toast('Watchlist cleared');
    refreshPersonalRows();
  };
  $('resetAll').onclick = (e) => {
    if (!confirm('Reset all settings and data for this profile?')) return;
    NAMESPACED.forEach(k => store.remove(k));
    applyAccent('pink');
    renderSettings();
    refreshProfileButton();
    refreshPersonalRows();
    flashButton(e.currentTarget, 'Reset ✓', 'Reset');
    toast('Everything reset');
  };
  $('openProfilesBtn').onclick = () => showProfilePicker({ manage: true });
}

/* ============================================================
   11. PROFILES UI
   ============================================================ */
let pickerManageMode = false;
const newProfileId = () => 'p_' + Math.random().toString(36).slice(2, 10);
const profileColor = (p) => (ACCENTS[p?.color] || ACCENTS.pink).base;

function showProfilePicker({ manage = false } = {}) {
  $('profilePicker')?.remove();
  const profiles = loadProfiles();
  pickerManageMode = manage && profiles.length > 0;
  const overlay = el('div', 'profile-picker' + (pickerManageMode ? ' manage' : ''), `
    <div class="pp-inner">
      <div class="pp-brand"><span class="brand-mark">Z</span><span>${esc(APP_NAME)}</span></div>
      <h1 class="pp-title">${profiles.length ? "Who's watching?" : 'Create your profile'}</h1>
      <p class="pp-sub">${profiles.length ? 'Pick a profile to continue' : 'Set up a profile to get started'}</p>
      <div class="pp-grid"></div>
      ${profiles.length ? `<button class="pp-manage">${pickerManageMode ? 'Done' : 'Manage Profiles'}</button>` : ''}
      ${syncConfig() && !syncState.user ? `<button class="pp-signin" type="button">Already use ${esc(APP_NAME)} on another device? <b>Sign in</b></button>` : ''}
    </div>
  `);
  overlay.id = 'profilePicker';
  document.body.appendChild(overlay);
  renderPickerGrid();

  const manageBtn = overlay.querySelector('.pp-manage');
  if (manageBtn) manageBtn.onclick = () => {
    pickerManageMode = !pickerManageMode;
    overlay.classList.toggle('manage', pickerManageMode);
    manageBtn.textContent = pickerManageMode ? 'Done' : 'Manage Profiles';
    // Leaving manage mode with a profile already active just closes the picker
    if (!pickerManageMode && activeProfileId && activeProfile()) overlay.remove();
  };

  const signInBtn = overlay.querySelector('.pp-signin');
  if (signInBtn) signInBtn.onclick = () => openSignIn();

  // Brand-new device: jump straight into creating a profile, unless signing in could bring them over
  if (!profiles.length && !(syncConfig() && !syncState.user)) setTimeout(() => openProfileEditor(null), 120);
}

function renderPickerGrid() {
  const grid = document.querySelector('#profilePicker .pp-grid');
  if (!grid) return;
  grid.innerHTML = '';
  loadProfiles().forEach(p => {
    const item = el('button', 'pp-item', `
      <div class="pp-avatar" style="--p-color:${profileColor(p)}">
        ${p.kids ? '<span class="pp-kids-badge">KIDS</span>' : ''}
        <span class="pp-emoji">${esc(p.avatar || '👤')}</span>
      </div>
      <div class="pp-name">${esc(p.name)}</div>
    `);
    item.onclick = () => (pickerManageMode ? openProfileEditor(p) : selectProfile(p.id));
    grid.appendChild(item);
  });
  const add = el('button', 'pp-item pp-add', `
    <div class="pp-avatar pp-avatar-add"><span class="pp-emoji">＋</span></div>
    <div class="pp-name">Add Profile</div>
  `);
  add.onclick = () => openProfileEditor(null);
  grid.appendChild(add);
}

function openProfileEditor(profile) {
  $('profileModal')?.remove();
  const isNew = !profile;
  const draft = profile ? { ...profile } : { id: newProfileId(), name: '', avatar: AVATARS[0], color: 'pink', kids: false };

  const modal = el('div', 'profile-modal', `
    <div class="pm-card">
      <h2>${isNew ? 'Add Profile' : 'Edit Profile'}</h2>
      <div class="pm-field">
        <label class="pm-label" for="pmName">Name</label>
        <input class="pm-input" id="pmName" type="text" maxlength="20" placeholder="Enter a name" value="${esc(draft.name)}">
      </div>
      <div class="pm-field">
        <label class="pm-label">Avatar</label>
        <div class="pm-avatars">
          ${AVATARS.map(a => `<button class="pm-avatar${a === draft.avatar ? ' active' : ''}" data-avatar="${a}" type="button">${a}</button>`).join('')}
        </div>
      </div>
      <div class="pm-field">
        <label class="pm-label">Accent colour</label>
        <div class="pm-colors">
          ${Object.entries(ACCENTS).map(([k, a]) => `<button class="pm-color${k === draft.color ? ' active' : ''}" data-color="${k}" type="button" style="background:${a.base}" title="${a.label}"></button>`).join('')}
        </div>
      </div>
      <label class="pm-kids"><input type="checkbox" id="pmKids"${draft.kids ? ' checked' : ''}><span>Kids profile</span></label>
      <div class="pm-actions">
        ${isNew ? '' : '<button class="pm-btn pm-btn-danger" data-act="delete" type="button">Delete</button>'}
        <button class="pm-btn pm-btn-ghost" data-act="cancel" type="button">Cancel</button>
        <button class="pm-btn pm-btn-primary" data-act="save" type="button">Save</button>
      </div>
    </div>
  `);
  modal.id = 'profileModal';
  document.body.appendChild(modal);

  const nameInput = modal.querySelector('#pmName');
  nameInput.focus();
  nameInput.select();

  const pick = (selector, attr, field) => modal.querySelectorAll(selector).forEach(btn => {
    btn.onclick = () => {
      draft[field] = btn.dataset[attr];
      modal.querySelectorAll(selector).forEach(b => b.classList.toggle('active', b === btn));
    };
  });
  pick('.pm-avatar', 'avatar', 'avatar');
  pick('.pm-color', 'color', 'color');
  modal.querySelector('#pmKids').onchange = (e) => { draft.kids = e.target.checked; };
  modal.querySelector('[data-act="cancel"]').onclick = () => modal.remove();

  modal.querySelector('[data-act="save"]').onclick = () => {
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); nameInput.style.borderColor = '#ff8090'; return; }
    draft.name = name;
    const list = [...loadProfiles()];
    const idx = list.findIndex(p => p.id === draft.id);
    if (idx >= 0) list[idx] = draft; else list.push(draft);
    saveProfiles(list);
    modal.remove();

    if (draft.id === activeProfileId) {
      applyAccent(draft.color, { persist: false });
      onProfileChanged();
    }
    if (list.length === 1 && !activeProfileId) selectProfile(draft.id);
    else renderPickerGrid();
  };

  const del = modal.querySelector('[data-act="delete"]');
  if (del) del.onclick = () => {
    if (!confirm(`Delete profile "${draft.name}"?`)) return;
    const list = loadProfiles().filter(p => p.id !== draft.id);
    saveProfiles(list);
    purgeProfileData(draft.id);
    modal.remove();
    if (activeProfileId === draft.id) {
      activeProfileId = null;
      rawSet('zs_active_profile', '');
      try { sessionStorage.removeItem('zs_profile_picked'); } catch {}
      refreshProfileButton();
    }
    if (!list.length) showProfilePicker();
    else renderPickerGrid();
  };
}

function selectProfile(id) {
  const p = loadProfiles().find(x => x.id === id);
  if (!p) return;
  activeProfileId = id;
  rawSet('zs_active_profile', id);
  try { sessionStorage.setItem('zs_profile_picked', '1'); } catch {}
  applyAccent(p.color || 'pink', { persist: false });
  $('profilePicker')?.remove();
  onProfileChanged();
  homeLoaded = false;   // rows depend on kids mode + per-profile data
  route();
}

function onProfileChanged() {
  refreshProfileButton();
  $('kidsPill').classList.toggle('hidden', !isKids());
  sourceSelect.value = storedSource();
}

function refreshProfileButton() {
  const btn = $('profileBtn');
  const p = activeProfile();
  btn.classList.toggle('hidden', !p);
  if (!p) return;
  btn.style.setProperty('--p-color', profileColor(p));
  btn.innerHTML = `<span class="pb-avatar">${esc(p.avatar || '👤')}</span>`;
  btn.title = `Signed in as ${p.name} · Switch profile`;
}

function toggleProfileMenu(anchor) {
  const existing = $('profileMenu');
  if (existing) { existing.remove(); return; }
  const rect = anchor.getBoundingClientRect();
  const menu = el('div', 'browse-menu', '<div class="browse-item"><span class="bi-icon">👥</span> Switch Profile</div>');
  menu.id = 'profileMenu';
  menu.style.top = rect.bottom + 8 + 'px';
  menu.style.left = Math.min(rect.left, window.innerWidth - 240) + 'px';
  document.body.appendChild(menu);
  menu.querySelector('.browse-item').onclick = () => { menu.remove(); showProfilePicker(); };
}

/* ============================================================
   ACCOUNT & SYNC (Supabase)
   Everything the app saves (except which profile is active on this
   device, and caches) is mirrored to one row per account. Each key
   carries a timestamp; when two devices disagree, the newest wins.
   ============================================================ */
const SYNC_META_KEY = 'zs_sync_meta';
const SYNCED_KEY = /^zs_(profiles|player_source)$|^zs_(favourites|progress|accent|settings|search_history)(::p_[a-z0-9]+)?$/i;
const SYNC_DEBOUNCE = 8000;    // wait for a quiet moment before uploading…
const SYNC_MAX_WAIT = 30000;   // …but never longer than this (e.g. while a video saves progress)
const syncState = { client: null, user: null, busy: false, again: false, timer: null, firstPending: 0, lastSync: 0, lastPull: 0, status: '', error: '' };
let syncApplying = false;
let resolveSyncClient;
const syncClientReady = new Promise(r => { resolveSyncClient = r; });

function syncConfig() {
  const c = window.ZS_SYNC_CONFIG;
  if (c?.url && c?.anonKey) return c;
  return SUPABASE_URL && SUPABASE_ANON_KEY ? { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } : null;
}
const syncReady = () => !!syncState.client;

function readSyncMeta() { try { return JSON.parse(localStorage.getItem(SYNC_META_KEY) || '{}'); } catch { return {}; } }
function writeSyncMeta(m) { try { localStorage.setItem(SYNC_META_KEY, JSON.stringify(m)); } catch {} }

/* Called by rawSet/rawRemove: timestamp the change and queue an upload */
function noteLocalChange(key) {
  if (syncApplying || !SYNCED_KEY.test(key)) return;
  const meta = readSyncMeta();
  meta[key] = Date.now();
  writeSyncMeta(meta);
  scheduleSync();
}

function scheduleSync() {
  if (!syncState.client || !syncState.user) return;
  const now = Date.now();
  if (!syncState.firstPending) syncState.firstPending = now;
  clearTimeout(syncState.timer);
  const wait = Math.max(0, Math.min(SYNC_DEBOUNCE, SYNC_MAX_WAIT - (now - syncState.firstPending)));
  syncState.timer = setTimeout(() => syncNow(), wait);
}

function localSyncedKeys() {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && SYNCED_KEY.test(k)) keys.push(k);
    }
  } catch {}
  return keys;
}

function setSyncStatus(status, error = '') {
  syncState.status = status;
  syncState.error = error;
  const el = $('syncStatus');
  if (el) el.textContent = error ? `⚠ ${error}` : status;
}

/* Pull, merge (newest wins per key), apply locally, push back if needed */
async function syncNow() {
  const { client, user } = syncState;
  if (!client || !user) return;
  if (syncState.busy) { syncState.again = true; return; }
  syncState.busy = true;
  clearTimeout(syncState.timer);
  syncState.firstPending = 0;
  setSyncStatus('Syncing…');
  try {
    const { data: row, error } = await client.from('user_data').select('data').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    const remote = row?.data?.keys || {};
    const meta = readSyncMeta();
    const merged = {};
    let changedHere = false;
    let changedThere = !row;

    const keys = new Set([...Object.keys(remote), ...localSyncedKeys(), ...Object.keys(meta).filter(k => SYNCED_KEY.test(k))]);
    for (const k of keys) {
      const r = remote[k];
      const localTime = meta[k] || 0;
      const localValue = localStorage.getItem(k);
      if (r && r.t > localTime) {
        merged[k] = r;
        if (localValue !== r.v) {
          syncApplying = true;
          try { if (r.v === null) localStorage.removeItem(k); else localStorage.setItem(k, r.v); } finally { syncApplying = false; }
          changedHere = true;
        }
        meta[k] = r.t;
      } else {
        if (localValue === null && !localTime) continue;           // nothing here, nothing there
        // Data from before signing in has no timestamp: it loses to anything already in the account
        const entry = { v: localValue, t: localTime || 1 };
        merged[k] = entry;
        meta[k] = entry.t;
        if (!r || r.v !== entry.v || r.t !== entry.t) changedThere = true;
      }
    }
    writeSyncMeta(meta);

    if (changedThere) {
      const { error: upErr } = await client.from('user_data')
        .upsert({ user_id: user.id, data: { v: 1, keys: merged }, updated_at: new Date().toISOString() });
      if (upErr) throw upErr;
    }
    syncState.lastSync = Date.now();
    setSyncStatus('Synced just now');
    if (changedHere) onSyncedDataChanged();
  } catch (err) {
    console.warn('Sync failed', err);
    setSyncStatus('', err.message || 'Sync failed — will retry');
    setTimeout(scheduleSync, 15000);
  } finally {
    syncState.busy = false;
    if (syncState.again) { syncState.again = false; scheduleSync(); }
  }
}

/* Another device changed something: refresh whatever is on screen */
function onSyncedDataChanged() {
  profilesCache = null;
  const profiles = loadProfiles();
  if (activeProfileId && !profiles.some(p => p.id === activeProfileId)) {
    activeProfileId = null;
    rawSet('zs_active_profile', '');
  }
  applyAccent(currentAccentKey(), { persist: false });
  onProfileChanged();
  if ($('profilePicker')) {
    $('profileModal')?.remove();
    showProfilePicker({ manage: pickerManageMode });
  } else if (!activeProfileId) {
    showProfilePicker();
  }
  if (!$('home-view').classList.contains('hidden')) refreshPersonalRows();
  if (!$('settings-view').classList.contains('hidden')) renderSettings();
  toast('Synced from your other devices');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = src;
    tag.onload = resolve;
    tag.onerror = () => reject(new Error('Could not load the sign-in library'));
    document.head.appendChild(tag);
  });
}

async function initSync() {
  const cfg = syncConfig();
  if (!cfg) { renderSyncUI(); return; }
  try {
    if (!window.supabase?.createClient) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    syncState.client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      // PKCE puts the sign-in code in ?code=… so it never clashes with the #/ routes
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    resolveSyncClient(true);
    const { data } = await syncState.client.auth.getSession();
    syncState.user = data.session?.user || null;
    syncState.client.auth.onAuthStateChange((_event, session) => {
      const before = syncState.user?.id;
      syncState.user = session?.user || null;
      renderSyncUI();
      if (syncState.user && syncState.user.id !== before) { $('signInModal')?.remove(); syncNow(); }
    });

    // Remove ?code=… left by the sign-in link
    const url = new URL(location.href);
    if (url.searchParams.has('code')) { url.searchParams.delete('code'); history.replaceState(null, '', url.toString()); }

    renderSyncUI();
    if (syncState.user) await syncNow();

    // Pull when you come back to the app; push before it goes to the background
    const onWake = () => { if (Date.now() - syncState.lastPull > 20000) { syncState.lastPull = Date.now(); syncNow(); } };
    window.addEventListener('focus', onWake);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onWake();
      else if (syncState.firstPending) syncNow();
    });
  } catch (err) {
    console.warn('Sync unavailable', err);
    resolveSyncClient(false);
    if ($('profilePicker') && !loadProfiles().length && !$('profileModal')) openProfileEditor(null);
    setSyncStatus('', err.message || 'Sync unavailable');
    renderSyncUI();
  }
}

function renderSyncUI() {
  const box = $('syncBody');
  if (!box) return;
  if (!syncConfig()) {
    box.innerHTML = `<div class="settings-row"><div class="settings-label">
      <span class="lbl">Sync isn't set up yet</span>
      <span class="desc">Add your Supabase project details to the top of app.js — see SYNC-SETUP.md.</span></div></div>`;
    return;
  }
  if (!syncState.client) {
    box.innerHTML = `<div class="settings-row"><div class="settings-label">
      <span class="lbl">Connecting…</span><span class="desc" id="syncStatus">${esc(syncState.error || '')}</span></div></div>`;
    return;
  }
  if (!syncState.user) {
    box.innerHTML = `<div class="settings-row">
      <div class="settings-label">
        <span class="lbl">Sync across your devices</span>
        <span class="desc">Sign in with your email to keep profiles, watchlists, progress and settings the same everywhere.</span>
      </div>
      <button class="pm-btn pm-btn-primary settings-action" id="syncSignInBtn" type="button">Sign in</button>
    </div>`;
    $('syncSignInBtn').onclick = () => openSignIn();
    return;
  }
  box.innerHTML = `
    <div class="settings-row">
      <div class="settings-label">
        <span class="lbl">Signed in as ${esc(syncState.user.email || 'your account')}</span>
        <span class="desc" id="syncStatus">${esc(syncState.error ? '⚠ ' + syncState.error : syncState.status || 'Synced')}</span>
      </div>
      <button class="pill-btn settings-action" id="syncNowBtn" type="button">Sync now</button>
    </div>
    <div class="settings-row">
      <div class="settings-label">
        <span class="lbl">Sign out</span>
        <span class="desc">This device keeps its copy; changes stop syncing until you sign in again.</span>
      </div>
      <button class="danger-btn" id="syncSignOutBtn" type="button">Sign out</button>
    </div>`;
  $('syncNowBtn').onclick = () => syncNow();
  $('syncSignOutBtn').onclick = async () => {
    await syncState.client.auth.signOut().catch(() => {});
    syncState.user = null;
    renderSyncUI();
    toast('Signed out');
  };
}

async function openSignIn() {
  if (!syncState.client && !(await syncClientReady)) {
    toast("Can't reach the sign-in service right now");
    return;
  }
  $('signInModal')?.remove();
  const modal = el('div', 'profile-modal', `
    <div class="pm-card signin-card">
      <h2>Sign in to sync</h2>
      <p class="signin-desc">Use the same email on every device — your profiles, watchlists, progress and settings follow you.</p>
      <div class="signin-step" data-step="email">
        <label class="pm-label" for="signinEmail">Email</label>
        <input class="pm-input" id="signinEmail" type="email" autocomplete="email" placeholder="you@example.com" />
        <div class="pm-actions">
          <button class="pm-btn pm-btn-ghost" data-act="cancel" type="button">Cancel</button>
          <button class="pm-btn pm-btn-primary" data-act="send" type="button">Email me a sign-in link</button>
        </div>
      </div>
      <div class="signin-step hidden" data-step="code">
        <p class="signin-sent">We've emailed <b data-email></b>. Open the link on this device — or type the 6-digit code from the email:</p>
        <input class="pm-input signin-code" id="signinCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" />
        <div class="pm-actions">
          <button class="pm-btn pm-btn-ghost" data-act="back" type="button">Use a different email</button>
          <button class="pm-btn pm-btn-primary" data-act="verify" type="button">Sign in</button>
        </div>
      </div>
      <p class="signin-error hidden"></p>
    </div>
  `);
  modal.id = 'signInModal';
  document.body.appendChild(modal);

  const emailInput = modal.querySelector('#signinEmail');
  const codeInput = modal.querySelector('#signinCode');
  const errorEl = modal.querySelector('.signin-error');
  const step = (name) => modal.querySelectorAll('.signin-step').forEach(s => s.classList.toggle('hidden', s.dataset.step !== name));
  const showError = (msg) => { errorEl.textContent = msg || ''; errorEl.classList.toggle('hidden', !msg); };
  emailInput.focus();

  const send = async () => {
    const email = emailInput.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { showError('Enter a valid email address.'); emailInput.focus(); return; }
    const btn = modal.querySelector('[data-act="send"]');
    btn.disabled = true; btn.textContent = 'Sending…'; showError('');
    const { error } = await syncState.client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true },
    });
    btn.disabled = false; btn.textContent = 'Email me a sign-in link';
    if (error) { showError(error.message); return; }
    modal.querySelector('[data-email]').textContent = email;
    step('code');
    codeInput.focus();
  };
  const verify = async () => {
    const token = codeInput.value.replace(/\D/g, '');
    if (token.length !== 6) { showError('The code is 6 digits.'); return; }
    const btn = modal.querySelector('[data-act="verify"]');
    btn.disabled = true; showError('');
    const { error } = await syncState.client.auth.verifyOtp({ email: emailInput.value.trim(), token, type: 'email' });
    btn.disabled = false;
    if (error) { showError(error.message); return; }
    modal.remove();
    toast('Signed in — syncing…');
  };

  modal.querySelector('[data-act="cancel"]').onclick = () => modal.remove();
  modal.querySelector('[data-act="send"]').onclick = send;
  modal.querySelector('[data-act="back"]').onclick = () => { step('email'); emailInput.focus(); };
  modal.querySelector('[data-act="verify"]').onclick = verify;
  emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') verify(); });
}

/* ============================================================
   12. HEADER, ROUTER & BOOT
   ============================================================ */
function showView(id) {
  document.querySelectorAll('main.view').forEach(v => v.classList.toggle('hidden', v.id !== id));
  window.scrollTo({ top: 0 });
}

function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

const routeStack = [];

function route() {
  // Remember how far down home was scrolled (not search results)
  const homeVisible = !$('home-view').classList.contains('hidden') && !heroEl.classList.contains('hidden');
  if (homeVisible) homeScrollY = window.scrollY;

  const hash = location.hash || '#/';
  if (routeStack[routeStack.length - 2] === hash) routeStack.pop();
  else if (routeStack[routeStack.length - 1] !== hash) routeStack.push(hash);
  if (homeVisible && (hash === '#/' || hash === '#')) homeScrollY = 0; // home → home: back to top

  const raw = location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = raw.split('?');
  const q = new URLSearchParams(queryPart || '');
  const [top, a, b] = pathPart.split('/').filter(Boolean);

  hideHoverCard();
  closeSearch();
  closeMenus();
  if (top !== 'watch') leavePlayer();
  setActiveNav(top);

  switch (top) {
    case undefined:    return showHome();
    case 'search':     return q.get('q') ? showSearch(q.get('q')) : location.replace('#/');
    case 'watch':
      if ((a === 'movie' || a === 'tv') && Number(b)) {
        return openPlayer(a, Number(b), Number(q.get('s')) || 1, Number(q.get('e')) || 1, q.get('t') || '');
      }
      break;
    case 'random':     return openRandom();
    case 'discover':
      if (q.get('f') && DISCOVER_FILTERS.some(f => f.key === q.get('f'))) { discoverState.filter = q.get('f'); discoverState.page = 1; }
      return openDiscover();
    case 'top100':     return openTop100(q.get('type') || 'movie');
    case 'settings':   return openSettings();
    case 'genre':      if (Number(a)) return openGenre(Number(a), q.get('name') || ''); break;
    case 'person':     if (Number(a)) return openPerson(Number(a)); break;
    case 'collection': if (Number(a)) return openCollection(Number(a), q.get('name') || ''); break;
  }
  location.replace('#/');
}

const NAV_FOR_ROUTE = { undefined: 'home', search: 'home', discover: 'discover', genre: 'discover', person: 'discover',
  collection: 'discover', top100: 'top100', random: 'random', settings: 'settings' };

function setActiveNav(top) {
  const key = NAV_FOR_ROUTE[top] || '';
  document.querySelectorAll('[data-nav]').forEach(n => {
    const on = n.dataset.nav === key;
    n.classList.toggle('active', on);
    if (on) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current');
  });
}

function closeMenus() {
  $('profileMenu')?.remove();
}

function wireHeader() {
  // Logo on home → back to top (the hash doesn't change, so route() wouldn't run)
  $('brandBtn').onclick = (e) => {
    if ((location.hash || '#/') === '#/') { e.preventDefault(); homeScrollY = 0; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  $('profileBtn').onclick = (e) => { e.stopPropagation(); toggleProfileMenu(e.currentTarget); };

  document.addEventListener('click', (e) => {
    if (!$('profileMenu')?.contains(e.target)) closeMenus();
  });
  window.addEventListener('resize', closeMenus);

  // Header turns solid once you scroll; back-to-top appears further down
  const header = $('siteHeader');
  const scrollTopBtn = $('scrollTopBtn');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 24);
    scrollTopBtn.classList.toggle('hidden', window.scrollY < 900);
    closeMenus();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Hard refresh (Settings → App): drop service-worker caches, then reload with a cache-buster
  $('refreshAppBtn').onclick = async (e) => {
    e.currentTarget.classList.add('spinning');
    toast('Refreshing…');
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch {}
    setTimeout(() => {
      const url = new URL(location.href);
      url.searchParams.set('_r', Date.now());
      location.replace(url.toString());
    }, 180);
  };

  // PWA install prompt
  let deferredInstall = null;
  const installBtn = $('installBtn');
  const installRow = $('installRow');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    installRow.classList.remove('hidden');
  });
  installBtn.onclick = async () => {
    if (!deferredInstall) return;
    try {
      deferredInstall.prompt();
      const choice = await deferredInstall.userChoice;
      if (choice?.outcome === 'accepted') toast('Installing…');
    } catch {}
    deferredInstall = null;
    installRow.classList.add('hidden');
  };
  window.addEventListener('appinstalled', () => {
    installRow.classList.add('hidden');
    toast('Installed ⭐');
  });
}

function wireViews() {
  document.querySelectorAll('[data-back]').forEach(btn => { btn.onclick = () => go('#/'); });

  randomGenreEl.innerHTML = genreOptions('All Genres');
  randomGenreEl.onchange = refreshRandomGrid;
  refreshRandomBtn.onclick = refreshRandomGrid;

  $('top100Toggle').querySelectorAll('.toggle-btn').forEach(btn => {
    btn.onclick = () => go(btn.dataset.type === 'tv' ? '#/top100?type=tv' : '#/top100');
  });
}

/* ---------- Keyboard shortcuts ---------- */
const SHORTCUTS = [
  ['/', 'Search'],
  ['Esc', 'Close / go back'],
  ['← →', 'Previous / next episode (in the player)'],
  ['?', 'Show these shortcuts'],
];

function toggleShortcutHelp() {
  const existing = $('shortcutHelp');
  if (existing) { existing.remove(); return; }
  const overlay = el('div', 'resume-overlay', `
    <div class="resume-card shortcuts-card">
      <div class="resume-body">
        <div class="resume-eyebrow">Keyboard shortcuts</div>
        <dl class="shortcut-list">
          ${SHORTCUTS.map(([k, d]) => `<dt>${k.split(' ').map(x => `<kbd>${esc(x)}</kbd>`).join(' ')}</dt><dd>${esc(d)}</dd>`).join('')}
        </dl>
      </div>
    </div>
  `);
  overlay.id = 'shortcutHelp';
  overlay.onclick = () => overlay.remove();
  document.body.appendChild(overlay);
}

function handleEscape() {
  if (searchOpen()) { closeSearch(); return; }
  const layers = ['shortcutHelp', 'signInModal', 'profileModal', 'resumeOverlay'];
  for (const id of layers) {
    const node = $(id);
    if (node) { node.remove(); return; }
  }
  const picker = $('profilePicker');
  if (picker) { if (activeProfile()) picker.remove(); return; }
  if ($('profileMenu')) { closeMenus(); return; }
  if (!hoverCard.classList.contains('hidden')) { hideHoverCard(); return; }
  if (routeStack.length > 1) history.back();
  else if ((location.hash || '#/') !== '#/') go('#/');
}

function wireKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (e.key === 'Escape') {
      if (typing) { t.blur(); return; }
      handleEscape();
      return;
    }
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); openSearch(); return; }
    if (e.key === '?') { toggleShortcutHelp(); return; }
    const inPlayer = !$('player-view').classList.contains('hidden') && player.current?.type === 'tv';
    if (inPlayer && e.key === 'ArrowRight') { e.preventDefault(); nextEpisode(); }
    if (inPlayer && e.key === 'ArrowLeft') { e.preventDefault(); previousEpisode(); }
  });
}

function boot() {
  document.querySelectorAll('[data-icon]').forEach(n => n.insertAdjacentHTML('afterbegin', icon(n.dataset.icon)));
  wireKeyboard();
  wireHeader();
  wireViews();
  wireSearch();
  wirePlayer();
  wireSettings();
  window.addEventListener('hashchange', route);

  const profiles = loadProfiles();
  const savedId = rawGet('zs_active_profile');
  let picked = null;
  try { picked = sessionStorage.getItem('zs_profile_picked'); } catch {}

  if (picked && savedId && profiles.some(p => p.id === savedId)) {
    activeProfileId = savedId;
    applyAccent(currentAccentKey(), { persist: false });
    onProfileChanged();
    route();
  } else {
    applyAccent(profiles.find(p => p.id === savedId)?.color || 'pink', { persist: false });
    showProfilePicker();
  }

  setTimeout(purgeOrphanedProfileKeys, 2000);
  initSync();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
    });
  }
}

boot();
