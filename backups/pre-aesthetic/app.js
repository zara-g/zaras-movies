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

const HOME_ROWS = [
  { title: '🔥 Trending This Week', path: '/trending/all/week' },
  { title: '🎬 Popular Movies',     path: '/movie/popular' },
  { title: '📺 Popular TV Shows',   path: '/tv/popular' },
  { title: '⭐ Top Rated Movies',   path: '/movie/top_rated' },
  { title: '🆕 New Releases',       path: '/movie/now_playing' },
  { title: '📅 Coming Soon',        path: '/movie/upcoming' },
];

const ACCENTS = {
  pink:     { label: 'Pink',     base: '#ffb6d9', light: '#ffd1e6', deep: '#ff8fc7' },
  lavender: { label: 'Lavender', base: '#c9b6ff', light: '#e0d1ff', deep: '#a88fff' },
  mint:     { label: 'Mint',     base: '#a8e6cf', light: '#c9f0e0', deep: '#7fd4b5' },
  sky:      { label: 'Sky',      base: '#a8d8ff', light: '#c9e5ff', deep: '#7fbcff' },
  peach:    { label: 'Peach',    base: '#ffc9a8', light: '#ffddc9', deep: '#ffab7f' },
  coral:    { label: 'Coral',    base: '#ffa8b8', light: '#ffc9d3', deep: '#ff7f95' },
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

function showSkeletons(container, count = 12) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const s = el('div', 'skeleton');
    s.style.cssText = 'height:auto;aspect-ratio:2/3;border-radius:12px;';
    container.appendChild(s);
  }
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
function rawSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
function rawRemove(k) { try { localStorage.removeItem(k); } catch {} }

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
  root.setProperty('--accent-glow', hexToRgba(a.base, 0.25));
  root.setProperty('--accent-glow-strong', hexToRgba(a.base, 0.45));
  document.documentElement.dataset.accentHex = a.base.slice(1);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = a.base;
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
  const paint = (on) => { btn.classList.toggle('active', on); btn.textContent = on ? '♥' : '♡'; };
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

/* Poster card used in horizontal rows */
function makeCard(item, type = typeOf(item)) {
  const title = titleOf(item);
  const poster = imgUrl(item.poster_path);
  const card = el('div', 'card', `
    ${poster
      ? `<img src="${poster}" alt="${esc(title)}" loading="lazy" />`
      : '<div class="card-fallback">🎬</div>'}
    <div class="card-info">
      <div class="card-title">${esc(title)}</div>
      <div class="card-meta">${esc([yearOf(item), type === 'tv' ? 'TV' : 'Movie'].filter(Boolean).join(' · '))}</div>
    </div>
  `);
  card.appendChild(favButton(item, type));
  card.onclick = () => play(type, item.id, title);
  attachHover(card, type, item);
  return card;
}

/* Larger poster card used in grids */
function makeGridCard(item, type = typeOf(item)) {
  const title = titleOf(item);
  const year = yearOf(item);
  const poster = imgUrl(item.poster_path, 'w500');
  const card = el('div', 'random-card', `
    <div class="random-poster">
      ${poster
        ? `<img src="${poster}" alt="${esc(title)}" loading="lazy" />`
        : '<div class="poster-fallback">🎬</div>'}
      <div class="rating-pill"><span class="star">★</span> ${(item.vote_average || 0).toFixed(1)}</div>
    </div>
    <div class="random-info">
      <div class="random-title">${esc(title)}</div>
      <div class="random-meta">
        ${year ? `<span>${esc(year)}</span><span class="dot"></span>` : ''}
        <span>${type === 'tv' ? 'TV' : `${(item.vote_count || 0).toLocaleString()} votes`}</span>
      </div>
      <p class="random-overview">${esc(item.overview || 'No description available.')}</p>
    </div>
  `);
  card.querySelector('.random-poster').appendChild(favButton(item, type));
  card.onclick = () => play(type, item.id, title);
  attachHover(card, type, item);
  return card;
}

function fillGrid(container, items, msg = 'No results found.') {
  container.innerHTML = '';
  if (!items.length) { showEmpty(container, msg); return; }
  items.forEach(item => container.appendChild(makeGridCard(item)));
}

/* Horizontal row with scroll arrows. `cards` is an array of elements. */
function makeRow(titleText, cards, className = '') {
  const row = el('div', 'row' + (className ? ' ' + className : ''));
  const heading = el('h2', 'row-title');
  heading.textContent = titleText;
  row.appendChild(heading);

  const wrapper = el('div', 'row-wrapper');
  const left = el('button', 'row-arrow row-arrow-left', '&#8249;');
  const right = el('button', 'row-arrow row-arrow-right', '&#8250;');
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

function makeSkeletonRow(titleText) {
  const row = el('div', 'row');
  const heading = el('h2', 'row-title');
  heading.textContent = titleText;
  const scroll = el('div', 'row-scroll');
  for (let i = 0; i < 8; i++) scroll.appendChild(el('div', 'skeleton'));
  row.append(heading, scroll);
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
}

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
        <button class="hc-play">▶ Play</button>
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
const genreBarEl = $('genreBar');
const personalRowsEl = $('personalRows');
const mainRowsEl = $('mainRows');
const searchResultsEl = $('searchResults');
const searchInput = $('search');
let homeLoaded = false;

/* ---------- Hero carousel ---------- */
const heroState = { items: [], index: 0, timer: null };

function renderHeroItem(idx) {
  const item = heroState.items[idx];
  if (!item) return;
  heroState.index = idx;
  const title = titleOf(item);
  const year = yearOf(item);
  const type = typeOf(item);
  const backdrop = imgUrl(item.backdrop_path, 'original');
  heroEl.style.setProperty('--hero-img', backdrop ? `url("${backdrop}")` : 'none');
  heroEl.innerHTML = `
    <div class="hero-content">
      <div class="hero-badge">✦ Featured ${type === 'tv' ? 'Series' : 'Film'}</div>
      <h1 class="hero-title">${esc(title)}</h1>
      <div class="hero-meta">
        ${year ? `<span>${esc(year)}</span><span class="dot"></span>` : ''}
        <span>★ ${(item.vote_average || 0).toFixed(1)}</span>
        <span class="dot"></span>
        <span>${type === 'tv' ? 'TV Show' : 'Movie'}</span>
      </div>
      <p class="hero-overview">${esc(item.overview || 'No description available.')}</p>
      <div class="hero-actions">
        <button class="btn-primary" data-hero="play">▶ Play Now</button>
        <button class="btn-ghost" data-hero="play">More Info</button>
      </div>
      ${heroState.items.length > 1 ? `<div class="hero-dots">
        ${heroState.items.map((_, i) => `<span class="hero-dot${i === idx ? ' active' : ''}" data-idx="${i}"></span>`).join('')}
      </div>` : ''}
    </div>
  `;
  heroEl.querySelectorAll('[data-hero="play"]').forEach(b => { b.onclick = () => play(type, item.id, title); });
  heroEl.querySelectorAll('.hero-dot').forEach(dot => {
    dot.onclick = (e) => {
      e.stopPropagation();
      renderHeroItem(Number(dot.dataset.idx));
      startHeroTimer();
    };
  });
}

function startHeroTimer() {
  clearInterval(heroState.timer);
  if (heroState.items.length < 2) return;
  heroState.timer = setInterval(() => {
    if ($('home-view').classList.contains('hidden')) return;
    renderHeroItem((heroState.index + 1) % heroState.items.length);
  }, 8000);
}

function buildHero(items) {
  heroState.items = items.filter(r => r.backdrop_path && r.overview).slice(0, 5);
  if (!heroState.items.length) { heroEl.innerHTML = ''; return; }
  renderHeroItem(0);
  startHeroTimer();
}

/* ---------- Main rows ---------- */
async function loadHome() {
  homeLoaded = true;
  heroEl.innerHTML = '';
  mainRowsEl.innerHTML = '';
  const placeholders = HOME_ROWS.map(def => {
    const sk = makeSkeletonRow(def.title);
    mainRowsEl.appendChild(sk);
    return sk;
  });

  const results = await Promise.allSettled(HOME_ROWS.map(async (def, i) => {
    const data = await tmdb(def.path);
    const items = kidsFilter(data.results || []).filter(x => x.poster_path).slice(0, 20);
    if (i === 0) buildHero(kidsFilter(data.results || []));
    if (items.length) placeholders[i].replaceWith(makeRow(def.title, items.map(it => makeCard(it))));
    else placeholders[i].remove();
  }));

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length === results.length) {
    mainRowsEl.innerHTML = '';
    mainRowsEl.appendChild(errorPanel("Couldn't load the home page", failed[0].reason?.message, loadHome));
  } else {
    failed.forEach((_, i) => placeholders[i].isConnected && placeholders[i].remove());
  }
  refreshPersonalRows();
}

/* ---------- Continue Watching & Watchlist rows ---------- */
function makeContinueCard(entry) {
  const pct = entry.duration ? Math.min(100, (entry.time / entry.duration) * 100) : 0;
  const poster = imgUrl(entry.poster_path);
  const card = el('div', 'card', `
    ${poster ? `<img src="${poster}" alt="${esc(entry.title)}" loading="lazy" />` : '<div class="card-fallback">🎬</div>'}
    ${entry.duration ? `<div class="progress-strip"><span style="width:${pct}%"></span></div>` : ''}
    <div class="card-info">
      <div class="card-title">${esc(entry.title || 'Untitled')}</div>
      <div class="card-meta">
        ${entry.type === 'tv' ? `S${entry.season} · E${entry.episode}` : 'Movie'} · ${entry.duration ? `${Math.round(pct)}%` : 'Started'}
      </div>
    </div>
  `);
  card.style.position = 'relative';
  const rm = el('button', 'remove-btn', '✕');
  rm.title = 'Remove from Continue Watching';
  rm.onclick = (e) => {
    e.stopPropagation();
    removeProgressForTitle(entry.type, entry.id);
    refreshPersonalRows();
  };
  card.appendChild(rm);
  card.onclick = () => play(entry.type, entry.id, entry.title, entry.season, entry.episode);
  return card;
}

function makeWatchlistCard(fav) {
  const poster = imgUrl(fav.poster_path);
  const card = el('div', 'card', `
    ${poster ? `<img src="${poster}" alt="${esc(fav.title)}" loading="lazy" />` : '<div class="card-fallback">🎬</div>'}
    <div class="card-info">
      <div class="card-title">${esc(fav.title)}</div>
      <div class="card-meta">${esc([fav.year, fav.type === 'tv' ? 'TV' : 'Movie'].filter(Boolean).join(' · '))}</div>
    </div>
  `);
  card.style.position = 'relative';
  const rm = el('button', 'remove-btn', '✕');
  rm.title = 'Remove from Watchlist';
  rm.onclick = (e) => {
    e.stopPropagation();
    store.set('zs_favourites', getFavourites().filter(x => !(x.type === fav.type && x.id === fav.id)));
    refreshPersonalRows();
  };
  card.appendChild(rm);
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
    if (e.poster_path) return e;
    try { return { ...e, poster_path: (await fetchDetails(e.type, e.id)).poster_path }; }
    catch { return e; }
  }));
  if (gen !== personalRowsGen) return;

  const favs = getFavourites();
  personalRowsEl.innerHTML = '';
  if (enriched.length) personalRowsEl.appendChild(makeRow('▶️ Continue Watching', enriched.map(makeContinueCard), 'row-personal'));
  if (favs.length) personalRowsEl.appendChild(makeRow('♥ Your Watchlist', favs.map(makeWatchlistCard), 'row-personal'));
}

function showHome() {
  showView('home-view');
  setDocTitle('');
  heroEl.classList.remove('hidden');
  genreBarEl.classList.remove('hidden');
  personalRowsEl.classList.remove('hidden');
  mainRowsEl.classList.remove('hidden');
  searchResultsEl.classList.add('hidden');
  if (!homeLoaded) loadHome();
  else refreshPersonalRows();
}

/* ---------- Search results ---------- */
async function showSearch(q) {
  showView('home-view');
  if (!homeLoaded) loadHome();
  heroEl.classList.add('hidden');
  genreBarEl.classList.add('hidden');
  personalRowsEl.classList.add('hidden');
  mainRowsEl.classList.add('hidden');
  searchResultsEl.classList.remove('hidden');
  setDocTitle(`Search: ${q}`);
  if (searchInput.value.trim() !== q) searchInput.value = q;

  searchResultsEl.innerHTML = `<div class="row"><h2 class="row-title">Searching "${esc(q)}"…</h2><div class="random-grid"></div></div>`;
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

function runSearch(q = searchInput.value.trim()) {
  if (!q) return;
  addSearchHistory(q);
  hideSuggestions();
  historyEl.classList.add('hidden');
  searchInput.blur();
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
  hideSuggestions();
  searchInput.value = '';
  searchInput.blur();
  play(typeOf(item), item.id, titleOf(item));
}

function renderSuggestions(items, q) {
  suggest.items = items;
  suggest.index = items.length ? 0 : -1;
  suggestionsEl.innerHTML = items.length
    ? items.map((it, i) => {
        const year = yearOf(it);
        const poster = imgUrl(it.poster_path, 'w92');
        return `
          <div class="suggest-item${i === 0 ? ' active' : ''}" data-idx="${i}">
            <div class="suggest-poster">${poster ? `<img src="${poster}" alt="" />` : '🎬'}</div>
            <div class="suggest-info">
              <div class="suggest-title">${esc(titleOf(it))}</div>
              <div class="suggest-meta">
                <span class="suggest-badge">${typeOf(it) === 'tv' ? 'TV' : 'Movie'}</span>
                ${year ? `<span>${esc(year)}</span>` : ''}
                ${it.vote_average ? `<span>★ ${it.vote_average.toFixed(1)}</span>` : ''}
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
    ${h.map(q => `<div class="sh-item" data-q="${esc(q)}">🔎 ${esc(q)}</div>`).join('')}
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
  $('searchBtn').onclick = () => runSearch();

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
      hideSuggestions();
      historyEl.classList.add('hidden');
    }
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length >= 2) fetchSuggestions(searchInput.value);
    else if (!searchInput.value.trim()) renderSearchHistory();
  });

  document.addEventListener('click', (e) => {
    if (e.target === searchInput) return;
    if (!suggestionsEl.contains(e.target)) hideSuggestions();
    if (!historyEl.contains(e.target)) historyEl.classList.add('hidden');
  });

  window.addEventListener('scroll', () => {
    if (!suggestionsEl.classList.contains('hidden')) hideSuggestions();
  }, { passive: true });
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
  const title = titleOf(item);
  const year = yearOf(item);
  const poster = imgUrl(item.poster_path);
  const score = item.__imdb > 0 ? item.__imdb.toFixed(1) : null;
  const card = el('div', 'top100-card', `
    <div class="top100-poster">
      ${poster ? `<img src="${poster}" alt="${esc(title)}" loading="lazy" />` : '<div class="poster-fallback">🎬</div>'}
      <div class="rank-badge">${rank}</div>
      <div class="imdb-badge${score ? '' : ' empty'}"><span class="star">★</span> ${score || '—'}</div>
    </div>
    <div class="top100-info">
      <div class="top100-title">${esc(title)}</div>
      <div class="top100-meta">${year ? esc(year) + ' · ' : ''}${type === 'tv' ? 'TV' : 'Movie'}</div>
    </div>
  `);
  card.onclick = () => play(type, item.id, title);
  attachHover(card, type, item);
  return card;
}

async function loadTop100Page(page) {
  top100State.page = page;
  const grid = $('top100Grid');
  const sub = $('top100Sub');
  const type = top100State.type;
  showSkeletons(grid, 20);
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
nextEpisodeBtn.onclick = async () => {
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
};

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

    const active = tvPickerRoot.querySelector('.ep-card.active');
    if (active) setTimeout(() => active.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 100);
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
      <div class="pp-brand"><span class="brand-dot"></span><span>${esc(APP_NAME)}</span></div>
      <h1 class="pp-title">${profiles.length ? "Who's watching?" : 'Create your profile'}</h1>
      <p class="pp-sub">${profiles.length ? 'Pick a profile to continue' : 'Set up a profile to get started'}</p>
      <div class="pp-grid"></div>
      ${profiles.length ? `<button class="pp-manage">${pickerManageMode ? 'Done' : 'Manage Profiles'}</button>` : ''}
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

  if (!profiles.length) setTimeout(() => openProfileEditor(null), 120);
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

function route() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = raw.split('?');
  const q = new URLSearchParams(queryPart || '');
  const [top, a, b] = pathPart.split('/').filter(Boolean);

  hideHoverCard();
  hideSuggestions();
  closeMenus();
  if (top !== 'watch') leavePlayer();

  switch (top) {
    case undefined:    return showHome();
    case 'search':     return q.get('q') ? showSearch(q.get('q')) : location.replace('#/');
    case 'watch':
      if ((a === 'movie' || a === 'tv') && Number(b)) {
        return openPlayer(a, Number(b), Number(q.get('s')) || 1, Number(q.get('e')) || 1, q.get('t') || '');
      }
      break;
    case 'random':     return openRandom();
    case 'discover':   return openDiscover();
    case 'top100':     return openTop100(q.get('type') || 'movie');
    case 'settings':   return openSettings();
    case 'genre':      if (Number(a)) return openGenre(Number(a), q.get('name') || ''); break;
    case 'person':     if (Number(a)) return openPerson(Number(a)); break;
    case 'collection': if (Number(a)) return openCollection(Number(a), q.get('name') || ''); break;
  }
  location.replace('#/');
}

function closeMenus() {
  $('browseMenu').classList.add('hidden');
  $('browseBtn').setAttribute('aria-expanded', 'false');
  $('profileMenu')?.remove();
}

function wireHeader() {
  $('brandBtn').onclick = () => go('#/');
  $('settingsBtn').onclick = () => go('#/settings');
  $('profileBtn').onclick = (e) => { e.stopPropagation(); toggleProfileMenu(e.currentTarget); };

  const browseBtn = $('browseBtn');
  const browseMenu = $('browseMenu');
  browseBtn.onclick = (e) => {
    e.stopPropagation();
    if (!browseMenu.classList.contains('hidden')) { closeMenus(); return; }
    closeMenus();
    const rect = browseBtn.getBoundingClientRect();
    browseMenu.style.top = rect.bottom + 8 + 'px';
    browseMenu.style.left = Math.min(rect.left, window.innerWidth - 240) + 'px';
    browseMenu.classList.remove('hidden');
    browseBtn.setAttribute('aria-expanded', 'true');
  };
  browseMenu.querySelectorAll('.browse-item').forEach(item => {
    item.onclick = () => { closeMenus(); go(item.dataset.href); };
  });
  document.addEventListener('click', (e) => {
    if (!browseMenu.contains(e.target) && !$('profileMenu')?.contains(e.target)) closeMenus();
  });
  window.addEventListener('resize', closeMenus);
  window.addEventListener('scroll', closeMenus, { passive: true });

  // Hard refresh: drop service-worker caches, then reload with a cache-buster
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
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    installBtn.classList.remove('hidden');
  });
  installBtn.onclick = async () => {
    if (!deferredInstall) return;
    try {
      deferredInstall.prompt();
      const choice = await deferredInstall.userChoice;
      if (choice?.outcome === 'accepted') toast('Installing…');
    } catch {}
    deferredInstall = null;
    installBtn.classList.add('hidden');
  };
  window.addEventListener('appinstalled', () => {
    installBtn.classList.add('hidden');
    toast('Installed ⭐');
  });
}

function wireViews() {
  document.querySelectorAll('[data-back]').forEach(btn => { btn.onclick = () => go('#/'); });

  const mainGenre = $('mainGenreSelect');
  mainGenre.innerHTML = genreOptions('Select a genre...');
  mainGenre.onchange = () => {
    const id = mainGenre.value;
    if (!id) return;
    const name = mainGenre.options[mainGenre.selectedIndex].textContent;
    mainGenre.value = '';
    go(`#/genre/${id}?name=${encodeURIComponent(name)}`);
  };

  randomGenreEl.innerHTML = genreOptions('All Genres');
  randomGenreEl.onchange = refreshRandomGrid;
  refreshRandomBtn.onclick = refreshRandomGrid;

  $('top100Toggle').querySelectorAll('.toggle-btn').forEach(btn => {
    btn.onclick = () => go(btn.dataset.type === 'tv' ? '#/top100?type=tv' : '#/top100');
  });
}

function boot() {
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

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
    });
  }
}

boot();
