const ORIGIN = 'https://cinesrc.st';
const TMDB_KEY = '29582cf7448083efc74052a8ee4864fa';
const OMDB_KEY = 'f0691d6c';

const iframe = document.getElementById('player');
const status = document.getElementById('status');
const homeView = document.getElementById('home-view');
const playerView = document.getElementById('player-view');
const heroEl = document.getElementById('hero');
const rowsEl = document.getElementById('rows');
const playerTitleEl = document.getElementById('player-title');
const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('searchBtn');
const hoverCard = document.getElementById('hover-card');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
const ALL_VIEW_IDS = ['home-view', 'player-view', 'random-view', 'genre-view', 'top100-view',
  'discover-view', 'person-view', 'collection-view', 'settings-view'];
function hideEveryView() {
  ALL_VIEW_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

function showHome() {
  homeView.classList.remove('hidden');
  playerView.classList.add('hidden');
  iframe.src = 'about:blank';
  document.title = "Zara's Movies";
}
function showPlayer() {
  hideEveryView();
  playerView.classList.remove('hidden');
}
function buildUrl(type, id, season, episode) {
  return type === 'movie'
    ? `${ORIGIN}/embed/movie/${id}?back=close&color=%23ffb6d9`
    : `${ORIGIN}/embed/tv/${id}?s=${season}&e=${episode}&back=close&color=%23ffb6d9`;
}
function loadPlayer(type, id, season, episode, title) {
  iframe.src = buildUrl(type, id, season, episode);
  playerTitleEl.textContent = title || '';
  status.textContent = 'Loading…';
  document.title = title ? `${title} — Zara's Movies` : "Zara's Movies";
  showPlayer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function sendCommand(command, args = []) {
  iframe.contentWindow.postMessage({ type: 'cinesrc:command', command, args }, ORIGIN);
}
document.getElementById('backHome').onclick = () => window.showHome();
document.getElementById('brandBtn').onclick = () => window.showHome();
document.getElementById('load').onclick = () => {
  const type = document.getElementById('type').value;
  const id = document.getElementById('tmdbId').value.trim();
  const s = document.getElementById('season').value;
  const e = document.getElementById('episode').value;
  if (id) loadPlayer(type, id, s, e, '');
};
document.getElementById('play').onclick = () => sendCommand('play');
document.getElementById('pause').onclick = () => sendCommand('pause');

async function tmdb(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`https://api.themoviedb.org/3${path}${sep}api_key=${TMDB_KEY}`);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}
function posterUrl(path, size = 'w342') { return path ? `https://image.tmdb.org/t/p/${size}${path}` : null; }
function backdropUrl(path) { return path ? `https://image.tmdb.org/t/p/original${path}` : null; }

function makeCard(item, typeOverride) {
  const type = typeOverride
    || (item.media_type === 'tv' ? 'tv'
      : item.media_type === 'movie' ? 'movie'
      : (item.first_air_date ? 'tv' : 'movie'));
  const title = item.title || item.name || 'Untitled';
  const date = (item.release_date || item.first_air_date || '').slice(0, 4);
  const poster = posterUrl(item.poster_path);

  const card = document.createElement('div');
  card.className = 'card';

  if (poster) {
    const img = document.createElement('img');
    img.src = poster; img.alt = title; img.loading = 'lazy';
    card.appendChild(img);
  } else {
    const fb = document.createElement('div');
    fb.className = 'card-fallback'; fb.textContent = '🎬';
    card.appendChild(fb);
  }

  const info = document.createElement('div');
  info.className = 'card-info';
  const t = document.createElement('div');
  t.className = 'card-title'; t.textContent = title;
  const m = document.createElement('div');
  m.className = 'card-meta';
  m.textContent = [date, type === 'tv' ? 'TV' : 'Movie'].filter(Boolean).join(' · ');
  info.appendChild(t); info.appendChild(m);
  card.appendChild(info);

  card.onclick = () => loadPlayer(type, item.id, 1, 1, title);
  card.addEventListener('mouseenter', () => handleCardHover(card, type, item));
  card.addEventListener('mouseleave', scheduleHide);
  return card;
}

function makeRow(titleText, items) {
  const row = document.createElement('div');
  row.className = 'row';
  const heading = document.createElement('h2');
  heading.className = 'row-title'; heading.textContent = titleText;
  row.appendChild(heading);
  const scroll = document.createElement('div');
  scroll.className = 'row-scroll';
  items.forEach(item => scroll.appendChild(makeCard(item)));
  row.appendChild(scroll);
  return row;
}

function makeSkeletonRow(titleText) {
  const row = document.createElement('div');
  row.className = 'row';
  const heading = document.createElement('h2');
  heading.className = 'row-title'; heading.textContent = titleText;
  row.appendChild(heading);
  const scroll = document.createElement('div');
  scroll.className = 'row-scroll';
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton';
    scroll.appendChild(s);
  }
  row.appendChild(scroll);
  return row;
}

function renderHero(item) {
  const title = item.title || item.name || 'Featured';
  const date = (item.release_date || item.first_air_date || '').slice(0, 4);
  const type = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie';
  const backdrop = backdropUrl(item.backdrop_path);
  heroEl.style.setProperty('--hero-img', backdrop ? `url("${backdrop}")` : 'none');
  heroEl.innerHTML = `
    <div class="hero-content">
      <div class="hero-badge">✦ Featured ${type === 'tv' ? 'Series' : 'Film'}</div>
      <h1 class="hero-title">${esc(title)}</h1>
      <div class="hero-meta">
        ${date ? `<span>${date}</span><span class="dot"></span>` : ''}
        <span>★ ${(item.vote_average || 0).toFixed(1)}</span>
        <span class="dot"></span>
        <span>${type === 'tv' ? 'TV Show' : 'Movie'}</span>
      </div>
      <p class="hero-overview">${esc(item.overview || 'No description available.')}</p>
      <div class="hero-actions">
        <button class="btn-primary" id="heroPlay">▶ Play Now</button>
        <button class="btn-ghost" id="heroInfo">More Info</button>
      </div>
    </div>
  `;
  document.getElementById('heroPlay').onclick = () => loadPlayer(type, item.id, 1, 1, title);
  document.getElementById('heroInfo').onclick = () => loadPlayer(type, item.id, 1, 1, title);
}

async function loadHome() {
  heroEl.innerHTML = '';
  rowsEl.innerHTML = '';
  const sections = [
    { title: '🔥 Trending This Week', path: '/trending/all/week' },
    { title: '🎬 Popular Movies',     path: '/movie/popular' },
    { title: '📺 Popular TV Shows',   path: '/tv/popular' },
    { title: '⭐ Top Rated Movies',   path: '/movie/top_rated' },
  ];
  sections.forEach(s => rowsEl.appendChild(makeSkeletonRow(s.title)));
  try {
    const trending = await tmdb(sections[0].path);
    const featured = (trending.results || []).filter(r => r.backdrop_path && r.overview)[0]
      || trending.results?.[0];
    if (featured) renderHero(featured);
    const rest = await Promise.all(
      sections.slice(1).map(s => tmdb(s.path).catch(() => ({ results: [] })))
    );
    rowsEl.innerHTML = '';
    rowsEl.appendChild(makeRow(sections[0].title, (trending.results || []).slice(0, 20)));
    rest.forEach((data, i) => {
      rowsEl.appendChild(makeRow(sections[i + 1].title, (data.results || []).slice(0, 20)));
    });
  } catch (err) {
    rowsEl.innerHTML = `<div class="row"><div class="row-title">Error</div><div style="color:var(--muted)">${esc(err.message)}</div></div>`;
    console.error(err);
  }
}

async function runSearch() {
  const q = searchInput.value.trim();
  const type = document.getElementById('type').value;
  if (!q) return;
  heroEl.innerHTML = '';
  rowsEl.innerHTML = '';
  rowsEl.appendChild(makeSkeletonRow(`Searching "${q}"...`));
  try {
    const data = await tmdb(`/search/${type}?query=${encodeURIComponent(q)}`);
    rowsEl.innerHTML = '';
    if (!data.results || data.results.length === 0) {
      rowsEl.innerHTML = `<div class="row"><h2 class="row-title">No results</h2><div style="color:var(--muted)">Nothing matched "${esc(q)}".</div></div>`;
      return;
    }
    rowsEl.appendChild(makeRow(`Results for "${q}"`, data.results));
  } catch (err) {
    rowsEl.innerHTML = `<div class="row"><h2 class="row-title">Error</h2><div style="color:var(--muted)">${esc(err.message)}</div></div>`;
    console.error(err);
  }
}
searchBtn.onclick = runSearch;
searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });

window.addEventListener('message', (event) => {
  if (event.origin !== ORIGIN) return;
  const { type, ...data } = event.data;
  if (type === 'cinesrc:ready') status.textContent = 'Ready';
  if (type === 'cinesrc:play') status.textContent = 'Playing';
  if (type === 'cinesrc:pause') status.textContent = 'Paused';
  if (type === 'cinesrc:timeupdate')
    status.textContent = `${data.currentTime.toFixed(0)}s / ${data.duration.toFixed(0)}s`;
  if (type === 'cinesrc:error') status.textContent = 'Error: ' + JSON.stringify(data.error);
  if (type === 'cinesrc:close') showHome();
});

/* ---------- HOVER CARD ---------- */
const detailCache = new Map();
const imdbCache = new Map();
let hoverTimer = null;
let hideTimer = null;
let activeCard = null;

function cancelHide() {
  clearTimeout(hideTimer);
  hideTimer = null;
}
function scheduleHide() {
  cancelHide();
  hideTimer = setTimeout(() => {
    if (hoverCard.matches(':hover')) return;
    activeCard = null;
    hoverCard.classList.add('hidden');
  }, 200);
}
function hideHoverCardNow() {
  cancelHide();
  activeCard = null;
  hoverCard.classList.add('hidden');
}

async function tmdbWithRetry(path, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await tmdb(path);
    } catch (err) {
      const isRate = /429/.test(err.message);
      if (!isRate || i === attempts - 1) throw err;
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
}

async function fetchDetails(type, id) {
  const key = `${type}:${id}`;
  if (detailCache.has(key)) return detailCache.get(key);
  const [details, external] = await Promise.all([
    tmdbWithRetry(`/${type}/${id}`),
    tmdbWithRetry(`/${type}/${id}/external_ids`).catch(() => ({}))
  ]);
  const merged = { ...details, imdb_id: external.imdb_id || null };
  detailCache.set(key, merged);
  return merged;
}

async function fetchImdbRating(imdbId) {
  if (!imdbId) return null;
  if (imdbCache.has(imdbId)) return imdbCache.get(imdbId);
  if (!OMDB_KEY || OMDB_KEY.startsWith('YOUR_')) {
    imdbCache.set(imdbId, null);
    return null;
  }
  try {
    const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`);
    const data = await res.json();
    const result = data && data.Response === 'True'
      ? { rating: data.imdbRating, votes: data.imdbVotes, rated: data.Rated }
      : null;
    imdbCache.set(imdbId, result);
    return result;
  } catch {
    imdbCache.set(imdbId, null);
    return null;
  }
}

function renderHoverCard(data, imdb, type, position, loading = false) {
  const title   = data.title || data.name || 'Untitled';
  const year    = (data.release_date || data.first_air_date || '').slice(0, 4);
  const tmdbRating = (data.vote_average || 0).toFixed(1);
  const genres  = (data.genres || []).map(g => g.name).slice(0, 3);
  const runtime = data.runtime
    ? `${data.runtime} min`
    : data.number_of_seasons
      ? `${data.number_of_seasons} season${data.number_of_seasons > 1 ? 's' : ''}`
      : '';
  const overview = data.overview || 'No description available.';
  const backdrop = data.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}`
    : data.poster_path
      ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
      : '';
  const imdbRating = imdb?.rating && imdb.rating !== 'N/A' ? imdb.rating : null;
  const imdbVotes  = imdb?.votes  && imdb.votes  !== 'N/A' ? imdb.votes  : null;
  const rated      = imdb?.rated  && imdb.rated  !== 'N/A' ? imdb.rated  : null;

  hoverCard.innerHTML = `
    ${backdrop ? `<div class="hc-backdrop" style="background-image:url('${backdrop}')"></div>` : ''}
    <div class="hc-body">
      <h3 class="hc-title">${esc(title)}</h3>
      <div class="hc-meta">
        ${year ? `<span>${year}</span>` : ''}
        ${runtime ? `<span class="hc-dot"></span><span>${runtime}</span>` : ''}
        ${rated ? `<span class="hc-dot"></span><span>${esc(rated)}</span>` : ''}
        ${loading ? `<span class="hc-dot"></span><span style="color:var(--accent)">loading…</span>` : ''}
      </div>
      <div class="hc-ratings">
        <div class="hc-rating">
          <span class="hc-rating-label">IMDb</span>
          <span class="hc-rating-value">${esc(imdbRating ?? '—')}</span>
          ${imdbVotes ? `<span class="hc-rating-votes">${esc(imdbVotes)}</span>` : ''}
        </div>
        <div class="hc-rating">
          <span class="hc-rating-label">TMDB</span>
          <span class="hc-rating-value">${tmdbRating}</span>
        </div>
      </div>
      ${genres.length ? `<div class="hc-genres">${genres.map(g => `<span class="hc-genre">${esc(g)}</span>`).join('')}</div>` : ''}
      <p class="hc-overview">${esc(overview)}</p>
      <div class="hc-actions">
        <button class="hc-play" id="hcPlayBtn">▶ Play</button>
      </div>
    </div>
  `;
  hoverCard.style.left = position.left + 'px';
  hoverCard.style.top  = position.top  + 'px';
  hoverCard.classList.remove('hidden');

  const playBtn = document.getElementById('hcPlayBtn');
  if (playBtn) {
    playBtn.onclick = (e) => {
      e.stopPropagation();
      hideHoverCardNow();
      loadPlayer(type, data.id, type === 'tv' ? 1 : undefined, type === 'tv' ? 1 : undefined, title);
    };
  }
}

function computePosition(cardEl) {
  const rect = cardEl.getBoundingClientRect();
  const cardWidth = 320;
  const cardHeight = 380;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let left = rect.left + rect.width / 2 - cardWidth / 2;
  left = Math.max(12, Math.min(left, viewportW - cardWidth - 12));

  const spaceAbove = rect.top;
  const spaceBelow = viewportH - rect.bottom;

  let top;
  if (spaceAbove >= cardHeight + 20) {
    top = rect.top - cardHeight - 10;
  } else if (spaceBelow >= cardHeight + 20) {
    top = rect.bottom + 10;
  } else {
    top = Math.max(12, Math.min(rect.top - 40, viewportH - cardHeight - 12));
  }
  return { left, top };
}

async function handleCardHover(cardEl, type, item) {
  cancelHide();
  if (activeCard === cardEl && !hoverCard.classList.contains('hidden')) return;
  activeCard = cardEl;
  clearTimeout(hoverTimer);

  hoverTimer = setTimeout(async () => {
    const pos = computePosition(cardEl);
    renderHoverCard(item, null, type, pos, true);
    try {
      const details = await fetchDetails(type, item.id);
      if (activeCard !== cardEl && hoverCard.classList.contains('hidden')) return;
      const imdb = await fetchImdbRating(details.imdb_id);
      if (activeCard !== cardEl && hoverCard.classList.contains('hidden')) return;
      renderHoverCard(details, imdb, type, computePosition(cardEl), false);
    } catch (err) {
      console.error('Hover fetch failed:', err);
      const meta = hoverCard.querySelector('.hc-meta');
      if (meta) meta.innerHTML += `<span class="hc-dot"></span><span style="color:var(--accent)">failed</span>`;
    }
  }, 200);
}

hoverCard.addEventListener('mouseenter', cancelHide);
hoverCard.addEventListener('mouseleave', scheduleHide);

window.addEventListener('scroll', () => {
  if (!hoverCard.matches(':hover')) scheduleHide();
}, { passive: true });

window.addEventListener('resize', scheduleHide);

/* ---------- BOOT ---------- */
loadHome();

/* ---------- RANDOM VIEW ---------- */
const randomView   = document.getElementById('random-view');
const randomGrid   = document.getElementById('randomGrid');
const refreshRandom = document.getElementById('refreshRandom');

function showRandom() {
  homeView.classList.add('hidden');
  playerView.classList.add('hidden');
  randomView.classList.remove('hidden');
  document.title = "Random Picks — Zara's Movies";
}

function showHomeView() {
  randomView.classList.add('hidden');
  homeView.classList.remove('hidden');
  playerView.classList.add('hidden');
  iframe.src = 'about:blank';
  document.title = "Zara's Movies";
}

/* Override original showHome to also hide random view */
window.showHome = function () {
  randomView.classList.add('hidden');
  homeView.classList.remove('hidden');
  playerView.classList.add('hidden');
  iframe.src = 'about:blank';
  document.title = "Zara's Movies";
};

async function pickRandomMovie() {
  // Grab a random page from discover, then pick a random item.
  // Retry a couple times if we get an empty page.
  for (let attempt = 0; attempt < 3; attempt++) {
    const page = Math.floor(Math.random() * 500) + 1;
    try {
      const data = await tmdb(
        `/discover/movie?sort_by=popularity.desc&vote_count.gte=200&vote_average.gte=6&page=${page}`
      );
      const results = data.results || [];
      if (results.length) {
        return results[Math.floor(Math.random() * results.length)];
      }
    } catch (err) {
      console.error('pickRandomMovie attempt failed:', err);
    }
  }
  return null;
}

function makeRandomCard(item) {
  const card = document.createElement('div');
  card.className = 'random-card';

  const title = item.title || item.name || 'Untitled';
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = (item.vote_average || 0).toFixed(1);
  const votes = item.vote_count || 0;
  const overview = item.overview || 'No description available.';
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;

  card.innerHTML = `
    <div class="random-poster">
      ${poster
        ? `<img src="${poster}" alt="${esc(title)}" loading="lazy" />`
        : `<div class="poster-fallback">🎬</div>`}
      <div class="rating-pill">
        <span class="star">★</span> ${rating}
      </div>
    </div>
    <div class="random-info">
      <div class="random-title">${esc(title)}</div>
      <div class="random-meta">
        ${year ? `<span>${year}</span>` : ''}
        ${year ? `<span class="dot"></span>` : ''}
        <span>${votes.toLocaleString()} votes</span>
      </div>
      <p class="random-overview">${esc(overview)}</p>
    </div>
  `;

  card.onclick = () => loadPlayer('movie', item.id, 1, 1, title);

  // Reuse existing hover card
  card.addEventListener('mouseenter', () => handleCardHover(card, 'movie', item));
  card.addEventListener('mouseleave', scheduleHide);

  return card;
}

function renderRandomSkeletons() {
  randomGrid.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton';
    s.style.cssText = 'height:auto;aspect-ratio:2/3;border-radius:12px;';
    randomGrid.appendChild(s);
  }
}

async function refreshRandomGrid() {
  if (!refreshRandom) return;
  refreshRandom.disabled = true;
  refreshRandom.classList.remove('spin');
  void refreshRandom.offsetWidth;
  refreshRandom.classList.add('spin');

  renderRandomSkeletons();

  try {
    // Pick 8 unique movies
    const seen = new Set();
    const picks = [];
    let guard = 0;
    while (picks.length < 8 && guard < 30) {
      guard++;
      const m = await pickRandomMovie();
      if (m && !seen.has(m.id)) {
        seen.add(m.id);
        picks.push(m);
      }
    }

    randomGrid.innerHTML = '';
    if (!picks.length) {
      randomGrid.innerHTML = '<div class="random-empty">Couldn\'t fetch any picks. Try again.</div>';
      return;
    }
    picks.forEach(item => randomGrid.appendChild(makeRandomCard(item)));
  } catch (err) {
    console.error('refreshRandomGrid failed:', err);
    randomGrid.innerHTML = '<div class="random-empty">Something went wrong. Try again.</div>';
  } finally {
    setTimeout(() => {
      refreshRandom.disabled = false;
      refreshRandom.classList.remove('spin');
    }, 500);
  }
}

/* Wire up the header Random button to swap into the random view */
function wireRandomButton() {
  const header = document.querySelector('header');
  if (!header || document.getElementById('randomBtn')) return;

  const btn = document.createElement('button');
  btn.id = 'randomBtn';
  btn.className = 'random-btn';
  btn.title = 'Show random picks';
  btn.innerHTML = '<span class="rb-icon">🎲</span> <span class="rb-label">Random</span>';
  btn.onclick = () => {
    showRandom();
    refreshRandomGrid();
  };
  header.appendChild(btn);
}

wireRandomButton();
if (refreshRandom) refreshRandom.onclick = refreshRandomGrid;

/* If user navigates home via brand / backHome, ensure random view is hidden */
document.addEventListener('DOMContentLoaded', () => {});

/* ---------- GENRES ---------- */
const GENRES = [
  { id: 28,    name: 'Action' },
  { id: 12,    name: 'Adventure' },
  { id: 16,    name: 'Animation' },
  { id: 35,    name: 'Comedy' },
  { id: 80,    name: 'Crime' },
  { id: 99,    name: 'Documentary' },
  { id: 18,    name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14,    name: 'Fantasy' },
  { id: 36,    name: 'History' },
  { id: 27,    name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648,  name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878,   name: 'Sci-Fi' },
  { id: 53,    name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37,    name: 'Western' },
];

/* --- Random page genre dropdown --- */
const randomGenreSelect = document.getElementById('randomGenre');
if (randomGenreSelect) {
  randomGenreSelect.innerHTML = '<option value="">All Genres</option>'
    + GENRES.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
  randomGenreSelect.addEventListener('change', () => {
    if (typeof refreshRandomGrid === 'function') refreshRandomGrid();
  });
}

/* --- Override pickRandomMovie to respect genre filter --- */
pickRandomMovie = async function () {
  const genre = randomGenreSelect ? randomGenreSelect.value : '';
  const genreParam = genre ? `&with_genres=${genre}` : '';

  for (let attempt = 0; attempt < 4; attempt++) {
    const page = Math.floor(Math.random() * 400) + 1;
    try {
      const data = await tmdb(
        `/discover/movie?sort_by=popularity.desc&vote_count.gte=100&vote_average.gte=5.5${genreParam}&page=${page}`
      );
      const results = data.results || [];
      if (results.length) {
        return results[Math.floor(Math.random() * results.length)];
      }
    } catch (err) {
      console.error('pickRandomMovie attempt failed:', err);
    }
  }
  return null;
};

/* --- Main page genre chips --- */
const genreChipsEl = document.getElementById('genre-chips');
if (genreChipsEl) {
  genreChipsEl.innerHTML = GENRES.map(g =>
    `<button class="genre-chip" data-id="${g.id}">${g.name}</button>`
  ).join('');
  genreChipsEl.querySelectorAll('.genre-chip').forEach(chip => {
    chip.onclick = () => openGenreView(Number(chip.dataset.id), chip.textContent);
  });
}

/* --- Genre view --- */
const genreView    = document.getElementById('genre-view');
const genreGrid    = document.getElementById('genreGrid');
const genreTitle   = document.getElementById('genreTitle');
const genreSub     = document.getElementById('genreSub');
const genreBackBtn = document.getElementById('genreBack');

async function openGenreView(genreId, genreName) {
  hideEveryView();
  genreView.classList.remove('hidden');
  genreTitle.textContent = genreName;
  genreSub.textContent = 'Top rated in this genre';
  document.title = `${genreName} — Zara's Movies`;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  genreGrid.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton';
    s.style.cssText = 'height:auto;aspect-ratio:2/3;border-radius:12px;';
    genreGrid.appendChild(s);
  }

  try {
    // Fetch 2 pages in parallel for a fuller grid
    const [p1, p2] = await Promise.all([
      tmdb(`/discover/movie?sort_by=vote_average.desc&vote_count.gte=500&with_genres=${genreId}&page=1`),
      tmdb(`/discover/movie?sort_by=vote_average.desc&vote_count.gte=500&with_genres=${genreId}&page=2`).catch(() => ({ results: [] }))
    ]);
    const results = [...(p1.results || []), ...(p2.results || [])];
    const seen = new Set();
    const unique = results.filter(r => !seen.has(r.id) && seen.add(r.id)).slice(0, 18);

    genreGrid.innerHTML = '';
    if (!unique.length) {
      genreGrid.innerHTML = '<div class="random-empty">No titles found.</div>';
      return;
    }
    unique.forEach(item => genreGrid.appendChild(makeRandomCard(item)));
  } catch (err) {
    console.error('Genre view failed:', err);
    genreGrid.innerHTML = '<div class="random-empty">Something went wrong.</div>';
  }
}

if (genreBackBtn) {
  genreBackBtn.onclick = () => {
    genreView.classList.add('hidden');
    homeView.classList.remove('hidden');
    document.title = "Zara's Movies";
  };
}

/* --- Make sure other nav paths hide the genre view too --- */
const _origShowHome = window.showHome;
window.showHome = function () {
  genreView.classList.add('hidden');
  randomView.classList.add('hidden');
  homeView.classList.remove('hidden');
  playerView.classList.add('hidden');
  iframe.src = 'about:blank';
  document.title = "Zara's Movies";
};

const _origShowRandom = showRandom;
showRandom = function () {
  genreView.classList.add('hidden');
  homeView.classList.add('hidden');
  playerView.classList.add('hidden');
  randomView.classList.remove('hidden');
  document.title = "Random Picks — Zara's Movies";
};

/* ---------- Row arrows (click to scroll) ---------- */
makeRow = function (titleText, items) {
  const row = document.createElement('div');
  row.className = 'row';

  const heading = document.createElement('h2');
  heading.className = 'row-title';
  heading.textContent = titleText;
  row.appendChild(heading);

  const wrapper = document.createElement('div');
  wrapper.className = 'row-wrapper';

  const leftBtn = document.createElement('button');
  leftBtn.className = 'row-arrow row-arrow-left';
  leftBtn.innerHTML = '&#8249;'; // ‹
  leftBtn.setAttribute('aria-label', 'Scroll left');

  const rightBtn = document.createElement('button');
  rightBtn.className = 'row-arrow row-arrow-right';
  rightBtn.innerHTML = '&#8250;'; // ›
  rightBtn.setAttribute('aria-label', 'Scroll right');

  const scroll = document.createElement('div');
  scroll.className = 'row-scroll';
  items.forEach(item => scroll.appendChild(makeCard(item)));

  wrapper.appendChild(leftBtn);
  wrapper.appendChild(scroll);
  wrapper.appendChild(rightBtn);
  row.appendChild(wrapper);

  const step = () => Math.max(scroll.clientWidth * 0.8, 320);

  leftBtn.onclick = () => scroll.scrollBy({ left: -step(), behavior: 'smooth' });
  rightBtn.onclick = () => scroll.scrollBy({ left:  step(), behavior: 'smooth' });

  const updateArrows = () => {
    const atStart = scroll.scrollLeft <= 4;
    const atEnd = scroll.scrollLeft + scroll.clientWidth >= scroll.scrollWidth - 4;
    leftBtn.classList.toggle('disabled', atStart);
    rightBtn.classList.toggle('disabled', atEnd);
  };

  scroll.addEventListener('scroll', updateArrows, { passive: true });
  requestAnimationFrame(updateArrows);
  setTimeout(updateArrows, 400);
  window.addEventListener('resize', updateArrows, { passive: true });

  return row;
};

/* ---------- Main page genre dropdown (replaces chips) ---------- */
(function setupMainGenreDropdown() {
  const sel = document.getElementById('mainGenreSelect');
  if (!sel) return;

  // Populate options
  sel.innerHTML = '<option value="">Select a genre...</option>'
    + GENRES.map(g => `<option value="${g.id}">${g.name}</option>`).join('');

  sel.addEventListener('change', () => {
    const id = sel.value;
    if (!id) return;
    const name = sel.options[sel.selectedIndex].textContent;
    openGenreView(Number(id), name);
    // reset so picking the same option again still triggers change
    setTimeout(() => { sel.value = ''; }, 400);
  });
})();

/* ============================================================
   TOP 100 — highest rated movies / TV
   ============================================================ */

const top100View    = document.getElementById('top100-view');
const top100Grid    = document.getElementById('top100Grid');
const top100Title   = document.getElementById('top100Title');
const top100Sub     = document.getElementById('top100Sub');
const top100Pagi    = document.getElementById('top100Pagination');
const top100BackBtn = document.getElementById('top100Back');
const top100Toggle  = document.getElementById('top100Toggle');

let top100State = { type: 'movie', page: 1 };

/* -------- IMDb lookup queue (throttled, cached) -------- */
const imdbQueue = [];
let imdbProcessing = false;

function enqueueImdbJob(job) {
  imdbQueue.push(job);
  processImdbQueue();
}

async function processImdbQueue() {
  if (imdbProcessing) return;
  imdbProcessing = true;

  while (imdbQueue.length) {
    const job = imdbQueue.shift();
    try {
      const details = await fetchDetails(job.type, job.id);
      if (details.imdb_id) {
        const imdb = await fetchImdbRating(details.imdb_id);
        if (imdb && imdb.rating) {
          job.onRating(imdb.rating);
        } else {
          job.onRating(null);
        }
      } else {
        job.onRating(null);
      }
    } catch (err) {
      job.onRating(null);
    }
    // small gap to stay well under TMDB/OMDb rate limits
    await new Promise(r => setTimeout(r, 220));
  }

  imdbProcessing = false;
}

/* -------- Fetch a page of top rated from TMDB -------- */
async function fetchTop100(type, page) {
  // Higher vote_count floor = only well-established titles
  const minVotes = type === 'movie' ? 10000 : 2000;
  const path = `/discover/${type}?sort_by=vote_average.desc&vote_count.gte=${minVotes}&page=${page}`;
  const data = await tmdb(path);
  return data.results || [];
}

/* -------- Build a Top 100 card -------- */
function makeTop100Card(item, rank, type) {
  const card = document.createElement('div');
  card.className = 'top100-card';

  const title = item.title || item.name || 'Untitled';
  const year  = (item.release_date || item.first_air_date || '').slice(0, 4);
  const tmdb  = (item.vote_average || 0).toFixed(1);
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : null;

  card.innerHTML = `
    <div class="top100-poster">
      ${poster
        ? `<img src="${poster}" alt="${esc(title)}" loading="lazy" />`
        : `<div class="poster-fallback">🎬</div>`}
      <div class="rank-badge">${rank}</div>
      <div class="rating-stack">
        <div class="rating-badge imdb loading" data-imdb>
          <span class="lbl">IMDb</span> <span data-imdb-val>…</span>
        </div>
        <div class="rating-badge tmdb">
          <span class="lbl">TMDB</span> ${tmdb}
        </div>
      </div>
    </div>
    <div class="top100-info">
      <div class="top100-title">${esc(title)}</div>
      <div class="top100-meta">${year || ''}${year ? ' · ' : ''}${type === 'tv' ? 'TV' : 'Movie'}</div>
    </div>
  `;

  card.onclick = () => loadPlayer(type, item.id, 1, 1, title);
  card.addEventListener('mouseenter', () => handleCardHover(card, type, item));
  card.addEventListener('mouseleave', scheduleHide);

  // Kick off IMDb rating lookup (fills in when ready)
  const imdbBadge = card.querySelector('[data-imdb]');
  const imdbVal   = card.querySelector('[data-imdb-val]');

  enqueueImdbJob({
    type,
    id: item.id,
    onRating: (rating) => {
      imdbBadge.classList.remove('loading');
      if (rating) {
        imdbVal.textContent = rating;
      } else {
        imdbBadge.style.display = 'none';
      }
    }
  });

  return card;
}

/* -------- Pagination -------- */
function renderPagination(totalPages) {
  top100Pagi.innerHTML = '';
  const { page } = top100State;

  const mk = (label, target, opts = {}) => {
    const b = document.createElement('button');
    b.className = 'page-btn' + (opts.active ? ' active' : '');
    b.textContent = label;
    b.disabled = !!opts.disabled;
    b.onclick = () => { if (!opts.disabled && !opts.active) loadTop100Page(target); };
    return b;
  };

  top100Pagi.appendChild(mk('‹', page - 1, { disabled: page <= 1 }));

  // Always show pages 1..5 with dots if needed (100 items = 5 pages)
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  if (totalPages <= 7) {
    pages.forEach(n => top100Pagi.appendChild(mk(n, n, { active: n === page })));
  } else {
    // compact: 1 2 3 ... last
    const show = new Set([1, 2, 3, page, totalPages]);
    const sorted = [...show].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
    let last = 0;
    sorted.forEach(n => {
      if (n - last > 1) {
        const d = document.createElement('span');
        d.className = 'page-dots';
        d.textContent = '…';
        top100Pagi.appendChild(d);
      }
      top100Pagi.appendChild(mk(n, n, { active: n === page }));
      last = n;
    });
  }

  top100Pagi.appendChild(mk('›', page + 1, { disabled: page >= totalPages }));
}

/* -------- Load & render a page -------- */
async function loadTop100Page(page) {
  top100State.page = page;
  top100Grid.innerHTML = '';

  for (let i = 0; i < 20; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton';
    s.style.cssText = 'height:auto;aspect-ratio:2/3;border-radius:12px;';
    top100Grid.appendChild(s);
  }

  try {
    const items = await fetchTop100(top100State.type, page);
    top100Grid.innerHTML = '';

    if (!items.length) {
      top100Grid.innerHTML = '<div class="random-empty">No titles found.</div>';
      return;
    }

    // rank = ((page-1) * 20) + index + 1
    items.forEach((item, i) => {
      const rank = (page - 1) * 20 + i + 1;
      top100Grid.appendChild(makeTop100Card(item, rank, top100State.type));
    });

    // TMDB discover gives ~5 usable pages (100 items)
    renderPagination(5);
  } catch (err) {
    console.error('Top 100 failed:', err);
    top100Grid.innerHTML = '<div class="random-empty">Something went wrong.</div>';
  }
}

/* -------- Open the view -------- */
async function openTop100(type = 'movie') {
  top100State.type = type;
  top100State.page = 1;

  hideEveryView();
  top100View.classList.remove('hidden');

  const isTV = type === 'tv';
  top100Title.textContent = isTV ? 'Top 100 TV Shows' : 'Top 100 Movies';
  top100Sub.textContent = isTV
    ? 'Highest rated series of all time'
    : 'Highest rated films of all time';
  document.title = (isTV ? 'Top 100 TV Shows' : 'Top 100 Movies') + " — Zara's Movies";

  // Toggle active state
  top100Toggle.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  await loadTop100Page(1);
}

/* -------- Wire up toggle + back -------- */
if (top100Toggle) {
  top100Toggle.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.onclick = () => openTop100(btn.dataset.type);
  });
}
if (top100BackBtn) {
  top100BackBtn.onclick = () => {
    top100View.classList.add('hidden');
    homeView.classList.remove('hidden');
    document.title = "Zara's Movies";
  };
}

/* -------- Add header button -------- */
(function injectTop100Button() {
  const header = document.querySelector('header');
  if (!header || document.getElementById('top100Btn')) return;

  const btn = document.createElement('button');
  btn.id = 'top100Btn';
  btn.className = 'top100-btn';
  btn.title = 'Top 100 highest rated';
  btn.innerHTML = '<span class="t100-icon">🏆</span> <span class="t100-label">Top 100</span>';
  btn.onclick = () => openTop100('movie');
  header.appendChild(btn);
})();

/* -------- Make sure nav paths hide the top100 view too -------- */
const _priorShowHome = window.showHome;
window.showHome = function () {
  top100View.classList.add('hidden');
  genreView.classList.add('hidden');
  randomView.classList.add('hidden');
  homeView.classList.remove('hidden');
  playerView.classList.add('hidden');
  iframe.src = 'about:blank';
  document.title = "Zara's Movies";
};

const _priorShowRandom = showRandom;
showRandom = function () {
  top100View.classList.add('hidden');
  genreView.classList.add('hidden');
  homeView.classList.add('hidden');
  playerView.classList.add('hidden');
  randomView.classList.remove('hidden');
  document.title = "Random Picks — Zara's Movies";
};

/* ============================================================
   ZARA'S CUSTOM LAYER — watchlist, continue watching, accent, TV picker
   ============================================================ */
(function () {
  if (window.__zsCustomV2) return;
  window.__zsCustomV2 = true;

  /* ---------- Storage ---------- */
  const LS_FAV = 'zs_favourites';
  const LS_PROGRESS = 'zs_progress';
  const LS_ACCENT = 'zs_accent';

  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  /* ---------- Favourites ---------- */
  function getFavourites() { return lsGet(LS_FAV, []); }
  function setFavourites(arr) { lsSet(LS_FAV, arr); }

  function favKey(type, id) { return `${type}:${id}`; }

  function isFavourite(type, id) {
    return getFavourites().some(f => f.type === type && f.id === id);
  }

  function toggleFavourite(item, type) {
    const favs = getFavourites();
    const idx = favs.findIndex(f => f.type === type && f.id === item.id);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.unshift({
        id: item.id,
        type,
        title: item.title || item.name || 'Untitled',
        poster_path: item.poster_path || null,
        year: (item.release_date || item.first_air_date || '').slice(0, 4),
        addedAt: Date.now(),
      });
    }
    setFavourites(favs);
    return idx < 0;
  }

  /* ---------- Heart button helper ---------- */
  function attachHeart(cardEl, item, type) {
    const btn = document.createElement('button');
    btn.className = 'fav-btn' + (isFavourite(type, item.id) ? ' active' : '');
    btn.innerHTML = isFavourite(type, item.id) ? '♥' : '♡';
    btn.setAttribute('aria-label', 'Toggle watchlist');
    btn.onclick = (e) => {
      e.stopPropagation();
      const added = toggleFavourite(item, type);
      btn.classList.toggle('active', added);
      btn.innerHTML = added ? '♥' : '♡';
      // refresh home rows so watchlist row updates next time we go home
      if (typeof window.refreshPersonalRows === 'function') {
        window.refreshPersonalRows();
      }
    };
    cardEl.appendChild(btn);
  }

  /* ---------- Progress storage ---------- */
  function getProgressStore() { return lsGet(LS_PROGRESS, {}); }
  function setProgressStore(store) { lsSet(LS_PROGRESS, store); }

  function progressKey(type, id, season, episode) {
    if (type === 'tv' && season && episode) return `${type}:${id}:${season}:${episode}`;
    return `${type}:${id}`;
  }

  let lastProgressSave = 0;
  let currentPlaying = null;

  function saveProgress(time, duration) {
    if (!currentPlaying) return;
    const now = Date.now();
    if (now - lastProgressSave < 4000) return;
    lastProgressSave = now;

    const { type, id, season, episode, title } = currentPlaying;
    const store = getProgressStore();
    const key = progressKey(type, id, season, episode);

    // Skip if too early or almost done
    if (!duration || time < 5 || time / duration > 0.92) {
      if (store[key]) {
        delete store[key];
        setProgressStore(store);
      }
      return;
    }

    store[key] = {
      type, id, season, episode, title,
      time, duration,
      updatedAt: now,
    };
    setProgressStore(store);
  }

  /* ---------- Wrap loadPlayer to remember what's playing + handle TV picker ---------- */
  const _origLoadPlayer = loadPlayer;
  loadPlayer = function (type, id, season, episode, title) {
    currentPlaying = { type, id, season: season || 1, episode: episode || 1, title };
    lastProgressSave = 0;
    _origLoadPlayer(type, id, season, episode, title);
    // Episode picker is handled by v12 — the legacy one here is no longer rendered.
  };

  /* ---------- Continue Watching row ---------- */
  function makeContinueCard(entry) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.position = 'relative';

    const posterUrl = entry.poster_path
      ? `https://image.tmdb.org/t/p/w342${entry.poster_path}`
      : null;

    const imgHtml = posterUrl
      ? `<img src="${posterUrl}" alt="${esc(entry.title)}" loading="lazy" />`
      : `<div class="card-fallback">🎬</div>`;

    const pct = entry.duration ? Math.min(100, (entry.time / entry.duration) * 100) : 0;

    card.innerHTML = `
      ${imgHtml}
      <div class="progress-strip"><span style="width:${pct}%"></span></div>
      <div class="card-info">
        <div class="card-title">${esc(entry.title || 'Untitled')}</div>
        <div class="card-meta">
          ${entry.type === 'tv' ? `S${entry.season} · E${entry.episode}` : 'Movie'}
          ${entry.duration ? ` · ${Math.round(pct)}%` : ''}
        </div>
      </div>
    `;

    // Remove button
    const rm = document.createElement('button');
    rm.className = 'remove-btn';
    rm.innerHTML = '✕';
    rm.title = 'Remove from Continue Watching';
    rm.onclick = (e) => {
      e.stopPropagation();
      const store = getProgressStore();
      const key = progressKey(entry.type, entry.id, entry.season, entry.episode);
      delete store[key];
      setProgressStore(store);
      card.parentElement && card.parentElement.removeChild(card);
      if (!card.parentElement || !card.parentElement.children.length) {
        const rowEl = card.closest('.row');
        rowEl && rowEl.remove();
      }
    };
    card.appendChild(rm);

    card.onclick = () => loadPlayer(entry.type, entry.id, entry.season, entry.episode, entry.title);
    return card;
  }

  async function buildContinueWatchingRow() {
    const store = getProgressStore();
    const entries = Object.values(store)
      .filter(e => e.updatedAt)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 12);

    if (!entries.length) return null;

    // Enrich with posters via fetchDetails (uses existing cache)
    const enriched = await Promise.all(entries.map(async (e) => {
      if (e.poster_path) return e;
      try {
        const details = await fetchDetails(e.type, e.id);
        return { ...e, poster_path: details.poster_path };
      } catch { return e; }
    }));

    const row = document.createElement('div');
    row.className = 'row row-personal';
    const heading = document.createElement('h2');
    heading.className = 'row-title';
    heading.textContent = '▶️ Continue Watching';
    row.appendChild(heading);

    const scroll = document.createElement('div');
    scroll.className = 'row-scroll';
    enriched.forEach(e => scroll.appendChild(makeContinueCard(e)));
    row.appendChild(scroll);
    return row;
  }

  /* ---------- Watchlist row ---------- */
  function buildWatchlistRow() {
    const favs = getFavourites();
    if (!favs.length) return null;

    const row = document.createElement('div');
    row.className = 'row row-personal';
    const heading = document.createElement('h2');
    heading.className = 'row-title';
    heading.textContent = '♥ Your Watchlist';
    row.appendChild(heading);

    const scroll = document.createElement('div');
    scroll.className = 'row-scroll';

    favs.forEach(fav => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.position = 'relative';

      const posterUrl = fav.poster_path
        ? `https://image.tmdb.org/t/p/w342${fav.poster_path}`
        : null;
      const imgHtml = posterUrl
        ? `<img src="${posterUrl}" alt="${esc(fav.title)}" loading="lazy" />`
        : `<div class="card-fallback">🎬</div>`;

      card.innerHTML = `
        ${imgHtml}
        <div class="card-info">
          <div class="card-title">${esc(fav.title)}</div>
          <div class="card-meta">${fav.year || ''}${fav.year ? ' · ' : ''}${fav.type === 'tv' ? 'TV' : 'Movie'}</div>
        </div>
      `;

      const rm = document.createElement('button');
      rm.className = 'remove-btn';
      rm.innerHTML = '✕';
      rm.title = 'Remove from Watchlist';
      rm.onclick = (e) => {
        e.stopPropagation();
        const list = getFavourites().filter(x => !(x.type === fav.type && x.id === fav.id));
        setFavourites(list);
        card.parentElement && card.parentElement.removeChild(card);
        if (!card.parentElement || !card.parentElement.children.length) {
          const rowEl = card.closest('.row');
          rowEl && rowEl.remove();
        }
      };
      card.appendChild(rm);

      card.onclick = () => loadPlayer(fav.type, fav.id, 1, 1, fav.title);
      scroll.appendChild(card);
    });

    row.appendChild(scroll);
    return row;
  }

  /* ---------- Inject personal rows into home view ---------- */
  let personalRowsGen = 0;
  async function injectPersonalRows() {
    const gen = ++personalRowsGen;
    const watchlistRow = buildWatchlistRow();
    const continueRow = await buildContinueWatchingRow();
    if (gen !== personalRowsGen) return; // a newer refresh superseded this one

    // Remove existing personal rows if any
    rowsEl.querySelectorAll('.row-personal').forEach(el => el.remove());
    const firstRow = rowsEl.firstChild;

    // Insert so order is: Continue Watching, Watchlist, then the rest
    if (watchlistRow) {
      if (firstRow) rowsEl.insertBefore(watchlistRow, firstRow);
      else rowsEl.appendChild(watchlistRow);
    }
    if (continueRow) {
      if (firstRow) rowsEl.insertBefore(continueRow, firstRow);
      else rowsEl.appendChild(continueRow);
    }
  }

  // Wrap loadHome so personal rows appear after the trending/popular rows load
  const _origLoadHome = loadHome;
  loadHome = async function () {
    await _origLoadHome();
    try { await injectPersonalRows(); } catch (e) { console.error('personal rows failed', e); }
  };

  // Expose so hearts can trigger a refresh
  window.refreshPersonalRows = injectPersonalRows;

  /* ---------- Heart overlay on all existing cards (MutationObserver) ---------- */
  // Existing card builders don't know about favorites — we detect new cards and add hearts.
  const heartObserver = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.classList && node.classList.contains('card') && !node.querySelector('.fav-btn')) {
          const title = node.querySelector('.card-title')?.textContent || '';
          const meta = node.querySelector('.card-meta')?.textContent || '';
          const type = /TV/.test(meta) ? 'tv' : 'movie';
          const id = node.__zsItemId;
          const posterImg = node.querySelector('img');
          const posterPath = posterImg
            ? posterImg.src.replace('https://image.tmdb.org/t/p/w342', '').replace('https://image.tmdb.org/t/p/w500', '')
            : null;
          // Only add heart if we know the id (attached by patched builders below)
          if (id) {
            attachHeart(node, {
              id,
              title,
              poster_path: posterPath,
              release_date: (meta.match(/\b(19|20)\d{2}\b/) || [''])[0],
            }, type);
          }
        }
      });
    });
  });
  heartObserver.observe(rowsEl, { childList: true, subtree: false });
  heartObserver.observe(document.getElementById('randomGrid') || document.body, { childList: true, subtree: false });
  heartObserver.observe(document.getElementById('top100Grid') || document.body, { childList: true, subtree: false });
  heartObserver.observe(document.getElementById('genreGrid') || document.body, { childList: true, subtree: false });

  /* ---------- Patch card builders to stamp the TMDB id ---------- */
  const _origMakeCard = window.makeCard;
  if (typeof _origMakeCard === 'function') {
    window.makeCard = function (item, typeOverride) {
      const card = _origMakeCard(item, typeOverride);
      card.__zsItemId = item.id;
      const type = typeOverride
        || (item.media_type === 'tv' ? 'tv'
          : item.media_type === 'movie' ? 'movie'
          : (item.first_air_date ? 'tv' : 'movie'));
      if (!card.querySelector('.fav-btn')) attachHeart(card, item, type);
      return card;
    };
    makeCard = window.makeCard;
  }

  /* ---------- ACCENT PICKER ---------- */
  const ACCENTS = {
    pink:     { label: 'Pink',     base: '#ffb6d9', light: '#ffd1e6', deep: '#ff8fc7' },
    lavender: { label: 'Lavender', base: '#c9b6ff', light: '#e0d1ff', deep: '#a88fff' },
    mint:     { label: 'Mint',     base: '#a8e6cf', light: '#c9f0e0', deep: '#7fd4b5' },
    sky:      { label: 'Sky',      base: '#a8d8ff', light: '#c9e5ff', deep: '#7fbcff' },
    peach:    { label: 'Peach',    base: '#ffc9a8', light: '#ffddc9', deep: '#ffab7f' },
    coral:    { label: 'Coral',    base: '#ffa8b8', light: '#ffc9d3', deep: '#ff7f95' },
  };

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function applyAccent(key) {
    const a = ACCENTS[key] || ACCENTS.pink;
    const root = document.documentElement;
    root.style.setProperty('--accent', a.base);
    root.style.setProperty('--accent-2', a.light);
    root.style.setProperty('--accent-deep', a.deep);
    root.style.setProperty('--accent-glow', hexToRgba(a.base, 0.25));
    root.style.setProperty('--accent-glow-strong', hexToRgba(a.base, 0.45));
    root.dataset.accentHex = a.base.replace('#', '');
    lsSet(LS_ACCENT, key);
  }

  // Init accent from storage
  applyAccent(lsGet(LS_ACCENT, 'pink'));

  // Patch buildUrl so CineSrc player color follows accent
  const _origBuildUrl = buildUrl;
  buildUrl = function (type, id, season, episode) {
    const hex = document.documentElement.dataset.accentHex || 'ffb6d9';
    return type === 'movie'
      ? `${ORIGIN}/embed/movie/${id}?back=close&color=%23${hex}`
      : `${ORIGIN}/embed/tv/${id}?s=${season}&e=${episode}&back=close&color=%23${hex}`;
  };

  /* Build the picker UI in the header */
  function buildAccentPicker() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('accentBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'accentBtn';
    btn.className = 'icon-btn';
    btn.title = 'Change accent colour';
    btn.innerHTML = '🎨';
    header.appendChild(btn);

    let popover = null;

    btn.onclick = (e) => {
      e.stopPropagation();
      if (popover) { popover.remove(); popover = null; return; }

      popover = document.createElement('div');
      popover.className = 'accent-popover';
      popover.innerHTML = `<h4>Accent</h4>
        <div class="accent-swatches">
          ${Object.entries(ACCENTS).map(([key, a]) => `
            <div class="accent-swatch${lsGet(LS_ACCENT, 'pink') === key ? ' active' : ''}"
                 data-key="${key}" title="${a.label}"
                 style="background:${a.base}"></div>
          `).join('')}
        </div>`;
      document.body.appendChild(popover);

      popover.querySelectorAll('.accent-swatch').forEach(sw => {
        sw.onclick = (ev) => {
          ev.stopPropagation();
          applyAccent(sw.dataset.key);
          popover.querySelectorAll('.accent-swatch').forEach(s => s.classList.remove('active'));
          sw.classList.add('active');
        };
      });
    };

    document.addEventListener('click', () => {
      if (popover) { popover.remove(); popover = null; }
    });
  }
  buildAccentPicker();

  /* ---------- TV EPISODE PICKER ---------- */
  function ensureTVPicker() {
    let picker = document.getElementById('tv-picker');
    if (picker) return picker;
    picker = document.createElement('div');
    picker.id = 'tv-picker';
    picker.className = 'tv-picker hidden';
    const playerView = document.getElementById('player-view');
    const statusEl = document.getElementById('status');
    playerView.insertBefore(picker, statusEl);
    return picker;
  }

  function hideTVPicker() {
    const p = document.getElementById('tv-picker');
    if (p) p.classList.add('hidden');
  }

  let tvState = { id: null, season: 1, episode: 1 };

  async function renderTVPicker(tvId, season, episode) {
    tvState = { id: tvId, season, episode };
    const picker = ensureTVPicker();
    picker.classList.remove('hidden');
    picker.innerHTML = '<div class="tv-picker-empty">Loading episodes…</div>';

    try {
      const show = await fetchDetails('tv', tvId);
      const seasons = (show.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0);
      if (!seasons.length) {
        picker.innerHTML = '<div class="tv-picker-empty">No episodes found.</div>';
        return;
      }

      // if current season not in list, pick first
      if (!seasons.some(s => s.season_number === season)) season = seasons[0].season_number;

      picker.innerHTML = `
        <div class="tv-picker-head">
          <h3>${esc(show.name || 'Episodes')} <span>· S${season}</span></h3>
          <select class="season-select" id="tvSeasonSelect">
            ${seasons.map(s => `
              <option value="${s.season_number}" ${s.season_number === season ? 'selected' : ''}>
                ${esc(s.name || `Season ${s.season_number}`)} (${s.episode_count})
              </option>
            `).join('')}
          </select>
        </div>
        <div class="episode-grid" id="tvEpisodeGrid">
          <div class="episode-empty">Loading episodes…</div>
        </div>
      `;

      picker.querySelector('#tvSeasonSelect').onchange = (e) => {
        renderTVPicker(tvId, Number(e.target.value), 1);
      };

      const seasonData = await tmdbWithRetry(`/tv/${tvId}/season/${season}`);
      const episodes = seasonData.episodes || [];
      const grid = picker.querySelector('#tvEpisodeGrid');
      grid.innerHTML = '';

      if (!episodes.length) {
        grid.innerHTML = '<div class="episode-empty">No episodes in this season.</div>';
        return;
      }

      episodes.forEach(ep => {
        const card = document.createElement('div');
        card.className = 'episode-card' + (ep.episode_number === episode ? ' active' : '');

        const still = ep.still_path
          ? `<img src="https://image.tmdb.org/t/p/w300${ep.still_path}" alt="" loading="lazy" />`
          : '';
        const meta = [
          ep.air_date || '',
          ep.runtime ? `${ep.runtime} min` : '',
        ].filter(Boolean).join(' · ');

        card.innerHTML = `
          <div class="episode-still">
            ${still}
            <span class="ep-num">E${ep.episode_number}</span>
          </div>
          <div class="episode-info">
            <div class="episode-title">${esc(ep.name || `Episode ${ep.episode_number}`)}</div>
            <div class="episode-meta">${meta}</div>
          </div>
        `;

        card.onclick = () => {
          picker.querySelectorAll('.episode-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          loadPlayer('tv', tvId, season, ep.episode_number, show.name || '');
        };

        grid.appendChild(card);
      });

      // scroll active card into view
      const activeCard = grid.querySelector('.episode-card.active');
      if (activeCard) {
        activeCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

    } catch (err) {
      console.error('TV picker failed:', err);
      picker.innerHTML = '<div class="tv-picker-empty">Couldn\'t load episodes.</div>';
    }
  }

  /* ---------- Hook into player messages for progress ---------- */
  window.addEventListener('message', (event) => {
    if (event.origin !== ORIGIN) return;
    const data = event.data;
    if (!data || data.type !== 'cinesrc:timeupdate') return;
    try { saveProgress(data.currentTime, data.duration); } catch {}
  });

  /* ---------- Update showHome to hide TV picker ---------- */
  const _priorShowHome2 = window.showHome;
  window.showHome = function () {
    _priorShowHome2();
    hideTVPicker();
    currentPlaying = null;
    // refresh personal rows on returning home
    setTimeout(() => { try { injectPersonalRows(); } catch {} }, 100);
  };

  /* ---------- Boot: refresh personal rows after home loads ---------- */
  setTimeout(() => { try { injectPersonalRows(); } catch {} }, 800);

  console.log('[ZS] Custom layer v2 loaded — watchlist, continue watching, accent picker, TV picker');
})();

/* ============================================================
   DISCOVERY v3 — discover hub, decades, services, top-by-genre,
                  person pages, similar titles, collections
   ============================================================ */
(function () {
  if (window.__zsCustomV3) return;
  window.__zsCustomV3 = true;

  /* ---------- Small storage helpers (independent from v2) ---------- */
  function lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
  }

  /* ---------- Constants ---------- */
  const DECADES = [
    { key: '2020', label: '2020s', gte: '2020-01-01', lte: '2029-12-31' },
    { key: '2010', label: '2010s', gte: '2010-01-01', lte: '2019-12-31' },
    { key: '2000', label: '2000s', gte: '2000-01-01', lte: '2009-12-31' },
    { key: '1990', label: '1990s', gte: '1990-01-01', lte: '1999-12-31' },
    { key: '1980', label: '1980s', gte: '1980-01-01', lte: '1989-12-31' },
    { key: '1970', label: '1970s', gte: '1970-01-01', lte: '1979-12-31' },
    { key: '1960', label: '1960s', gte: '1960-01-01', lte: '1969-12-31' },
    { key: '1950', label: '1950s', gte: '1950-01-01', lte: '1959-12-31' },
  ];

  const SERVICES = [
    { id: 8,    label: 'Netflix' },
    { id: 9,    label: 'Amazon Prime' },
    { id: 337,  label: 'Disney+' },
    { id: 15,   label: 'Hulu' },
    { id: 1899, label: 'Max' },
    { id: 350,  label: 'Apple TV+' },
    { id: 531,  label: 'Paramount+' },
    { id: 386,  label: 'Peacock' },
    { id: 283,  label: 'Crunchyroll' },
  ];

  const DISCOVER_FILTERS = [
    { key: 'new',       label: '🎬 New Releases' },
    { key: 'upcoming',  label: '📅 Upcoming' },
    { key: 'airing',    label: '📺 Airing Today' },
    { key: 'trending',  label: '🔥 Trending' },
    { key: 'decade',    label: '📆 By Decade' },
    { key: 'service',   label: '📡 By Service' },
    { key: 'top-genre', label: '🏆 Top 100 by Genre' },
  ];

  /* ---------- Element refs ---------- */
  const discoverView   = document.getElementById('discover-view');
  const discoverSub    = document.getElementById('discoverSub');
  const discoverFilters= document.getElementById('discoverFilters');
  const discoverCtrls  = document.getElementById('discoverControls');
  const discoverGrid   = document.getElementById('discoverGrid');
  const discoverPagi   = document.getElementById('discoverPagination');
  const discoverBack   = document.getElementById('discoverBack');

  const personView   = document.getElementById('person-view');
  const personHeader = document.getElementById('personHeader');
  const personGrid   = document.getElementById('personGrid');
  const personBack   = document.getElementById('personBack');

  const collectionView   = document.getElementById('collection-view');
  const collectionBanner = document.getElementById('collectionBanner');
  const collectionGrid   = document.getElementById('collectionGrid');
  const collectionBack   = document.getElementById('collectionBack');

  const similarSection = document.getElementById('similar-section');
  const similarGrid    = document.getElementById('similarGrid');

  /* ---------- Caches ---------- */
  const v3DetailCache  = new Map();
  const v3CreditsCache = new Map();
  const v3SimilarCache = new Map();

  async function v3Details(type, id) {
    const key = `${type}:${id}`;
    if (v3DetailCache.has(key)) return v3DetailCache.get(key);
    const data = await tmdb(`/${type}/${id}`);
    v3DetailCache.set(key, data);
    return data;
  }
  async function v3Credits(type, id) {
    const key = `${type}:${id}`;
    if (v3CreditsCache.has(key)) return v3CreditsCache.get(key);
    try {
      const data = await tmdb(`/${type}/${id}/credits`);
      v3CreditsCache.set(key, data);
      return data;
    } catch { v3CreditsCache.set(key, { cast: [], crew: [] }); return { cast: [], crew: [] }; }
  }
  async function v3Similar(type, id) {
    const key = `${type}:${id}`;
    if (v3SimilarCache.has(key)) return v3SimilarCache.get(key);
    try {
      const data = await tmdb(`/${type}/${id}/similar`);
      const results = data.results || [];
      v3SimilarCache.set(key, results);
      return results;
    } catch { v3SimilarCache.set(key, []); return []; }
  }

  /* ---------- View switcher ---------- */
  function hideAllViews() {
    hideEveryView();
  }

  function wireBackHandlers() {
    const anyBackToList = [
      [discoverBack, discoverView, 'CineSrc'],
      [personBack,   personView,   'CineSrc'],
      [collectionBack, collectionView, 'CineSrc'],
    ];
    anyBackToList.forEach(([btn, view, title]) => {
      if (!btn || !view) return;
      btn.onclick = () => {
        view.classList.add('hidden');
        homeView.classList.remove('hidden');
        document.title = "Zara's Movies";
      };
    });
  }

  /* ---------- Build a simple grid card (uses makeRandomCard + hearts) ---------- */
  function gridCard(item) {
    const type = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie';
    // makeRandomCard produces a nice aspect-ratio poster card; reuse it
    const card = makeRandomCard(item);
    // stash the item so hover card can pick it up
    card.__zsItem = item;
    card.__zsType = type;
    return card;
  }

  function fillGrid(container, items) {
    container.innerHTML = '';
    if (!items.length) {
      container.innerHTML = '<div class="random-empty">No results found.</div>';
      return;
    }
    items.forEach(item => container.appendChild(gridCard(item)));
  }

  function showSkeletons(container, count = 12) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'skeleton';
      s.style.cssText = 'height:auto;aspect-ratio:2/3;border-radius:12px;';
      container.appendChild(s);
    }
  }

  /* ---------- Pagination ---------- */
  function renderPager(container, current, total, onPage) {
    container.innerHTML = '';
    const mk = (label, target, opts = {}) => {
      const b = document.createElement('button');
      b.className = 'page-btn' + (opts.active ? ' active' : '');
      b.textContent = label;
      b.disabled = !!opts.disabled;
      b.onclick = () => { if (!opts.disabled && !opts.active) onPage(target); };
      return b;
    };
    container.appendChild(mk('‹', current - 1, { disabled: current <= 1 }));
    for (let i = 1; i <= total; i++) {
      container.appendChild(mk(i, i, { active: i === current }));
    }
    container.appendChild(mk('›', current + 1, { disabled: current >= total }));
  }

  /* ========================================================
     DISCOVER VIEW
     ======================================================== */
  let discoverState = { filter: 'new', page: 1, decade: DECADES[0].key, service: SERVICES[0].id, genre: 28 };

  function buildDiscoverFilters() {
    discoverFilters.innerHTML = '';
    DISCOVER_FILTERS.forEach(f => {
      const pill = document.createElement('button');
      pill.className = 'filter-pill' + (f.key === discoverState.filter ? ' active' : '');
      pill.textContent = f.label;
      pill.onclick = () => {
        discoverState.filter = f.key;
        discoverState.page = 1;
        discoverFilters.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        buildDiscoverControls();
        loadDiscoverPage(1);
      };
      discoverFilters.appendChild(pill);
    });
  }

  function buildDiscoverControls() {
    discoverCtrls.innerHTML = '';
    const sel = document.createElement('select');
    sel.className = 'genre-select';

    if (discoverState.filter === 'decade') {
      sel.innerHTML = DECADES.map(d => `<option value="${d.key}" ${d.key===discoverState.decade?'selected':''}>${d.label}</option>`).join('');
      sel.onchange = () => { discoverState.decade = sel.value; loadDiscoverPage(1); };
      discoverCtrls.appendChild(sel);
    } else if (discoverState.filter === 'service') {
      sel.innerHTML = SERVICES.map(s => `<option value="${s.id}" ${s.id===discoverState.service?'selected':''}>${s.label}</option>`).join('');
      sel.onchange = () => { discoverState.service = Number(sel.value); loadDiscoverPage(1); };
      discoverCtrls.appendChild(sel);
    } else if (discoverState.filter === 'top-genre') {
      sel.innerHTML = GENRES.map(g => `<option value="${g.id}" ${g.id===discoverState.genre?'selected':''}>${g.name}</option>`).join('');
      sel.onchange = () => { discoverState.genre = Number(sel.value); loadDiscoverPage(1); };
      discoverCtrls.appendChild(sel);
    }
  }

  function discoverPathFor(filter, page, state) {
    switch (filter) {
      case 'new':      return { path: `/movie/now_playing?page=${page}`,          label: 'New Releases' };
      case 'upcoming': return { path: `/movie/upcoming?page=${page}`,             label: 'Upcoming Movies' };
      case 'airing':   return { path: `/tv/airing_today?page=${page}`,            label: 'Airing Today' };
      case 'trending': return { path: `/trending/all/week?page=${page}`,          label: 'Trending This Week' };
      case 'decade': {
        const d = DECADES.find(x => x.key === state.decade) || DECADES[0];
        return {
          path: `/discover/movie?sort_by=popularity.desc&vote_count.gte=200&primary_release_date.gte=${d.gte}&primary_release_date.lte=${d.lte}&page=${page}`,
          label: `Top ${d.label} Movies`
        };
      }
      case 'service': {
        const s = SERVICES.find(x => x.id === state.service) || SERVICES[0];
        return {
          path: `/discover/movie?sort_by=popularity.desc&vote_count.gte=100&with_watch_providers=${s.id}&watch_region=US&page=${page}`,
          label: `On ${s.label}`
        };
      }
      case 'top-genre': {
        const g = GENRES.find(x => x.id === state.genre) || GENRES[0];
        return {
          path: `/discover/movie?sort_by=vote_average.desc&vote_count.gte=500&with_genres=${g.id}&page=${page}`,
          label: `Top 100 ${g.name}`
        };
      }
      default:
        return { path: `/trending/all/week?page=${page}`, label: 'Discover' };
    }
  }

  async function loadDiscoverPage(page) {
    discoverState.page = page;
    showSkeletons(discoverGrid, 12);
    discoverPagi.innerHTML = '';
    try {
      const { path, label } = discoverPathFor(discoverState.filter, page, discoverState);
      discoverSub.textContent = label;
      const data = await tmdb(path);
      fillGrid(discoverGrid, (data.results || []).filter(x => x.poster_path));
      const totalPages = Math.min(data.total_pages || 1, 8);
      renderPager(discoverPagi, page, totalPages, loadDiscoverPage);
    } catch (err) {
      console.error('Discover load failed:', err);
      discoverGrid.innerHTML = '<div class="random-empty">Couldn\'t load. Try again.</div>';
    }
  }

  function openDiscover() {
    hideAllViews();
    discoverView.classList.remove('hidden');
    document.title = "Discover — Zara's Movies";
    window.scrollTo({ top: 0, behavior: 'smooth' });
    buildDiscoverFilters();
    buildDiscoverControls();
    loadDiscoverPage(1);
  }

  /* ========================================================
     PERSON VIEW
     ======================================================== */
  async function openPersonView(personId) {
    hideAllViews();
    personView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    personHeader.innerHTML = '<div class="person-photo"><div class="photo-fallback">👤</div></div>';
    showSkeletons(personGrid, 12);

    try {
      const person = await tmdb(`/person/${personId}`);
      document.title = `${person.name} — Zara's Movies`;

      const photo = person.profile_path
        ? `<img src="https://image.tmdb.org/t/p/w300${person.profile_path}" alt="${esc(person.name)}" />`
        : `<div class="photo-fallback">👤</div>`;

      const birthday = person.birthday || '';
      const place = person.place_of_birth || '';
      const dept = person.known_for_department || '';
      const bio = person.biography || '';

      personHeader.innerHTML = `
        <div class="person-photo">${photo}</div>
        <div class="person-info">
          <h1 class="person-name">${esc(person.name)}</h1>
          <div class="person-meta">
            ${dept ? `<span><strong>Known for</strong>${esc(dept)}</span>` : ''}
            ${birthday ? `<span><strong>Born</strong>${esc(birthday)}</span>` : ''}
            ${place ? `<span><strong>From</strong>${esc(place)}</span>` : ''}
          </div>
          ${bio ? `<p class="person-bio collapsed" id="personBio">${esc(bio)}</p>
                   <button class="bio-toggle" id="bioToggle">Read more</button>` : ''}
        </div>
      `;

      const bioEl = document.getElementById('personBio');
      const bioBtn = document.getElementById('bioToggle');
      if (bioEl && bioBtn) {
        bioBtn.onclick = () => {
          bioEl.classList.toggle('collapsed');
          bioBtn.textContent = bioEl.classList.contains('collapsed') ? 'Read more' : 'Show less';
        };
      }

      // Filmography
      const credits = await tmdb(`/person/${personId}/combined_credits`);
      const seen = new Set();
      const items = (credits.cast || [])
        .filter(c => c.poster_path && (c.media_type === 'movie' || c.media_type === 'tv'))
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .filter(c => {
          const key = `${c.media_type}:${c.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 40);

      fillGrid(personGrid, items);
    } catch (err) {
      console.error('Person load failed:', err);
      personHeader.innerHTML = '<div class="random-empty">Couldn\'t load person.</div>';
      personGrid.innerHTML = '';
    }
  }

  /* ========================================================
     COLLECTION VIEW
     ======================================================== */
  async function openCollectionView(collectionId, fallbackName) {
    hideAllViews();
    collectionView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    collectionBanner.classList.add('hidden');
    showSkeletons(collectionGrid, 10);

    try {
      const data = await tmdb(`/collection/${collectionId}`);
      document.title = `${data.name || fallbackName || 'Collection'} — Zara's Movies`;

      const backdrop = data.backdrop_path
        ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
        : (data.parts?.[0]?.backdrop_path
          ? `https://image.tmdb.org/t/p/original${data.parts[0].backdrop_path}`
          : '');

      collectionBanner.classList.remove('hidden');
      collectionBanner.innerHTML = `
        ${backdrop ? `<div class="cb-bg" style="background-image:url('${backdrop}')"></div>` : ''}
        <div class="cb-content">
          <h1>${esc(data.name || fallbackName || 'Collection')}</h1>
          <p>${esc(data.overview || '')}</p>
        </div>
      `;

      const parts = (data.parts || [])
        .filter(p => p.poster_path)
        .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));

      fillGrid(collectionGrid, parts);
    } catch (err) {
      console.error('Collection load failed:', err);
      collectionGrid.innerHTML = '<div class="random-empty">Couldn\'t load collection.</div>';
    }
  }

  /* ========================================================
     SIMILAR TITLES (player view)
     ======================================================== */
  let similarRequestId = 0;
  async function loadSimilar(type, id) {
    if (!similarSection || !similarGrid) return;
    const reqId = ++similarRequestId;
    similarSection.classList.remove('hidden');
    showSkeletons(similarGrid, 8);
    try {
      const items = (await v3Similar(type, id)).filter(x => x.poster_path).slice(0, 12);
      if (reqId !== similarRequestId) return; // stale
      if (!items.length) {
        similarSection.classList.add('hidden');
        return;
      }
      fillGrid(similarGrid, items);
    } catch (err) {
      console.error('Similar load failed:', err);
      similarSection.classList.add('hidden');
    }
  }

  function hideSimilar() {
    if (similarSection) similarSection.classList.add('hidden');
    if (similarGrid) similarGrid.innerHTML = '';
  }

  /* ========================================================
     PATCH loadPlayer to load similar titles
     ======================================================== */
  const _prevLoadPlayer = loadPlayer;
  loadPlayer = function (type, id, season, episode, title) {
    _prevLoadPlayer(type, id, season, episode, title);
    loadSimilar(type, id);
  };

  /* ========================================================
     ENRICH HOVER CARD — cast + collection
     ======================================================== */
  const hoverCardEl = document.getElementById('hover-card');
  const v3LastHovered = { item: null, type: null };
  let v3CastFetchKey = null;

  // Patch makeCard to record last hovered
  const _prevMakeCard = makeCard;
  makeCard = function (item, typeOverride) {
    const card = _prevMakeCard(item, typeOverride);
    const type = typeOverride
      || (item.media_type === 'tv' ? 'tv'
        : item.media_type === 'movie' ? 'movie'
        : (item.first_air_date ? 'tv' : 'movie'));
    card.addEventListener('mouseenter', () => {
      v3LastHovered.item = item;
      v3LastHovered.type = type;
    });
    return card;
  };

  // Patch makeRandomCard similarly
  const _prevMakeRandomCard = makeRandomCard;
  makeRandomCard = function (item, typeOverride) {
    const card = _prevMakeRandomCard(item, typeOverride);
    const type = typeOverride || (item.first_air_date ? 'tv' : 'movie');
    card.addEventListener('mouseenter', () => {
      v3LastHovered.item = item;
      v3LastHovered.type = type;
    });
    return card;
  };

  if (hoverCardEl) {
    const observer = new MutationObserver(() => {
      if (!v3LastHovered.item) return;
      const body = hoverCardEl.querySelector('.hc-body');
      if (!body || body.querySelector('.hc-cast')) return;

      const { item, type } = v3LastHovered;
      const key = `${type}:${item.id}`;
      if (v3CastFetchKey === key) return;
      v3CastFetchKey = key;

      Promise.all([
        v3Credits(type, item.id).catch(() => null),
        v3Details(type, item.id).catch(() => null),
      ]).then(([credits, details]) => {
        v3CastFetchKey = null;
        const body2 = hoverCardEl.querySelector('.hc-body');
        if (!body2 || body2.querySelector('.hc-cast')) return;

        // Cast row
        const cast = (credits?.cast || []).slice(0, 5);
        if (cast.length) {
          const castRow = document.createElement('div');
          castRow.className = 'hc-cast';
          castRow.innerHTML = '<div class="hc-cast-title">Cast</div>' + cast.map(c => {
            const img = c.profile_path
              ? `<img src="https://image.tmdb.org/t/p/w92${c.profile_path}" alt="" />`
              : `<div class="cast-fallback">${esc((c.name || '?').slice(0,1))}</div>`;
            return `<div class="cast-chip" data-person="${c.id}">
              ${img}<span>${esc(c.name || '')}</span>
            </div>`;
          }).join('');
          body2.appendChild(castRow);
          castRow.querySelectorAll('.cast-chip').forEach(chip => {
            chip.onclick = (e) => {
              e.stopPropagation();
              const pc = document.getElementById('hover-card');
              if (pc) pc.classList.add('hidden');
              openPersonView(Number(chip.dataset.person));
            };
          });
        }

        // Collection button
        if (details?.belongs_to_collection) {
          const actions = body2.querySelector('.hc-actions');
          if (actions && !actions.querySelector('.hc-collection')) {
            const btn = document.createElement('button');
            btn.className = 'hc-collection';
            btn.textContent = '🎬 Collection';
            btn.onclick = (e) => {
              e.stopPropagation();
              if (hoverCardEl) hoverCardEl.classList.add('hidden');
              openCollectionView(details.belongs_to_collection.id, details.belongs_to_collection.name);
            };
            actions.appendChild(btn);
          }
        }
      });
    });
    observer.observe(hoverCardEl, { childList: true, subtree: true });
  }

  /* ========================================================
     HEADER BUTTONS — Discover
     ======================================================== */
  (function injectDiscoverButton() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('discoverBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'discoverBtn';
    btn.className = 'discover-btn';
    btn.title = 'Discover categories';
    btn.innerHTML = '<span class="disc-icon">🧭</span> <span class="disc-label">Discover</span>';
    btn.onclick = openDiscover;
    header.appendChild(btn);
  })();

  /* ========================================================
     Also add New Releases / Upcoming / Airing Today rows to HOME
     ======================================================== */
  async function injectDiscoverRows() {
    const rowsEl = document.getElementById('rows');
    if (!rowsEl) return;
    // avoid duplicates
    rowsEl.querySelectorAll('.row-discover').forEach(el => el.remove());

    const defs = [
      { title: '🎬 New Releases', path: '/movie/now_playing' },
      { title: '📅 Coming Soon',  path: '/movie/upcoming' },
      { title: '📺 Airing Today', path: '/tv/airing_today' },
    ];

    const insertAfter = rowsEl.querySelectorAll('.row')[3] || rowsEl.lastElementChild;
    let anchor = insertAfter ? insertAfter.nextSibling : null;

    for (const def of defs) {
      try {
        const data = await tmdb(def.path);
        const items = (data.results || []).filter(x => x.poster_path).slice(0, 20);
        if (!items.length) continue;
        const row = makeRow(def.title, items);
        row.classList.add('row-discover');
        if (anchor) rowsEl.insertBefore(row, anchor);
        else rowsEl.appendChild(row);
        anchor = row.nextSibling;
      } catch (err) {
        console.error('discover row failed:', def.title, err);
      }
    }
  }

  // chain onto loadHome (which v2 already chains to inject personal rows)
  const _prevLoadHome = loadHome;
  loadHome = async function () {
    await _prevLoadHome();
    try { await injectDiscoverRows(); } catch (e) { console.error('discover rows failed', e); }
  };

  /* ========================================================
     Make sure ALL view switching hides the new views
     ======================================================== */
  const _priorShowHomeV3 = window.showHome;
  window.showHome = function () {
    hideAllViews();
    homeView.classList.remove('hidden');
    iframe.src = 'about:blank';
    document.title = "Zara's Movies";
    hideSimilar();
    setTimeout(() => { try { if (typeof window.refreshPersonalRows === 'function') window.refreshPersonalRows(); } catch {} }, 100);
  };

  const _priorShowRandomV3 = showRandom;
  showRandom = function () {
    hideAllViews();
    randomView.classList.remove('hidden');
    document.title = "Random Picks — Zara's Movies";
    hideSimilar();
  };

  wireBackHandlers();

  console.log('[ZS] Discovery v3 loaded — Discover hub, person pages, similar titles, collections');
})();

/* ============================================================
   ZARA'S CUSTOM v4 — auto-next, auto-skip intro,
                    remove "Airing Today" + "By Decade"
   ============================================================ */
(function () {
  if (window.__zsCustomV4) return;
  window.__zsCustomV4 = true;

  /* ---------- 1. Auto-next + auto-skip intro on TV embeds ---------- */
  const _prevBuildUrlV4 = buildUrl;
  buildUrl = function (type, id, season, episode) {
    const hex = document.documentElement.dataset.accentHex || 'ffb6d9';
    if (type === 'movie') {
      return `${ORIGIN}/embed/movie/${id}?back=close&color=%23${hex}`;
    }
    // autonext=true  → auto-plays next episode when current ends
    // autoskip=true  → auto-skips intro/recap when detected
    return `${ORIGIN}/embed/tv/${id}?s=${season}&e=${episode}&back=close&color=%23${hex}&autonext=true&autoskip=true`;
  };

  /* ---------- 2. Strip Airing Today + By Decade from Discover filters ---------- */
  const discoverFiltersEl = document.getElementById('discoverFilters');
  if (discoverFiltersEl) {
    const stripFilters = () => {
      discoverFiltersEl.querySelectorAll('.filter-pill').forEach(pill => {
        const t = (pill.textContent || '').trim();
        if (/Airing Today/i.test(t) || /By Decade/i.test(t)) {
          pill.remove();
        }
      });
    };
    const filtersObs = new MutationObserver(stripFilters);
    filtersObs.observe(discoverFiltersEl, { childList: true, subtree: true });
    stripFilters();
  }

  /* ---------- 3. Strip the "Airing Today" row from home ---------- */
  const rowsEl = document.getElementById('rows');
  if (rowsEl) {
    const stripHomeRows = () => {
      rowsEl.querySelectorAll('.row').forEach(row => {
        const t = row.querySelector('.row-title')?.textContent || '';
        if (/Airing Today/i.test(t)) {
          row.remove();
        }
      });
    };
    const rowsObs = new MutationObserver(stripHomeRows);
    rowsObs.observe(rowsEl, { childList: true, subtree: true });
    stripHomeRows();
  }

  /* ---------- 4. Also hide the "Airing Today" toggle if you ever add one ---------- */
  document.querySelectorAll('.filter-pill, .toggle-btn, .row-title').forEach(el => {
    const t = (el.textContent || '').trim();
    if (/Airing Today|By Decade/i.test(t)) el.remove();
  });

  console.log('[ZS] v4 — auto-next + auto-skip enabled, "Airing Today" + "By Decade" removed');
})();

/* ============================================================
   ZARA'S CUSTOM v5 — Settings page + Search autocomplete
   ============================================================ */
(function () {
  if (window.__zsCustomV5) return;
  window.__zsCustomV5 = true;

  function lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
  }
  function lsSet(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }

  /* ---------- ACCENTS (shared) ---------- */
  const ACCENTS = {
    pink:     { label: 'Pink',     base: '#ffb6d9', light: '#ffd1e6', deep: '#ff8fc7' },
    lavender: { label: 'Lavender', base: '#c9b6ff', light: '#e0d1ff', deep: '#a88fff' },
    mint:     { label: 'Mint',     base: '#a8e6cf', light: '#c9f0e0', deep: '#7fd4b5' },
    sky:      { label: 'Sky',      base: '#a8d8ff', light: '#c9e5ff', deep: '#7fbcff' },
    peach:    { label: 'Peach',    base: '#ffc9a8', light: '#ffddc9', deep: '#ffab7f' },
    coral:    { label: 'Coral',    base: '#ffa8b8', light: '#ffc9d3', deep: '#ff7f95' },
  };

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function applyAccent(key) {
    const a = ACCENTS[key] || ACCENTS.pink;
    const root = document.documentElement;
    root.style.setProperty('--accent', a.base);
    root.style.setProperty('--accent-2', a.light);
    root.style.setProperty('--accent-deep', a.deep);
    root.style.setProperty('--accent-glow', hexToRgba(a.base, 0.25));
    root.style.setProperty('--accent-glow-strong', hexToRgba(a.base, 0.45));
    root.dataset.accentHex = a.base.replace('#', '');
    lsSet('zs_accent', key);
  }

  /* Settings storage */
  const SETTINGS_KEY = 'zs_settings';
  function getSettings() {
    return Object.assign({
      autonext: true,
      autoskip: true,
      autoplay: true,
    }, lsGet(SETTINGS_KEY, {}));
  }
  function saveSettings(s) { lsSet(SETTINGS_KEY, s); }

  /* ---------- Remove old accent popover button from header if present ---------- */
  const oldAccentBtn = document.getElementById('accentBtn');
  if (oldAccentBtn) oldAccentBtn.remove();

  /* ---------- Patch buildUrl to respect settings toggles ---------- */
  const _prevBuildUrlV5 = buildUrl;
  buildUrl = function (type, id, season, episode) {
    const hex = document.documentElement.dataset.accentHex || 'ffb6d9';
    const s = getSettings();

    if (type === 'movie') {
      const extra = s.autoplay ? '' : '&autoplay=false';
      return `${ORIGIN}/embed/movie/${id}?back=close&color=%23${hex}${extra}`;
    }

    const params = new URLSearchParams();
    params.set('s', season);
    params.set('e', episode);
    params.set('back', 'close');
    params.set('color', '#' + hex);
    params.set('autonext', s.autonext ? 'true' : 'false');
    params.set('autoskip', s.autoskip ? 'true' : 'false');
    if (!s.autoplay) params.set('autoplay', 'false');

    return `${ORIGIN}/embed/tv/${id}?${params.toString()}`;
  };

  /* ---------- SETTINGS VIEW ---------- */
  const settingsView   = document.getElementById('settings-view');
  const settingsBack   = document.getElementById('settingsBack');
  const accentGrid     = document.getElementById('accentGrid');
  const setAutonext    = document.getElementById('setAutonext');
  const setAutoskip    = document.getElementById('setAutoskip');
  const setAutoplay    = document.getElementById('setAutoplay');
  const clearProgress  = document.getElementById('clearProgress');
  const clearWatchlist = document.getElementById('clearWatchlist');
  const resetAll       = document.getElementById('resetAll');

  function hideAllViewsForSettings() {
    hideEveryView();
  }

  function buildAccentGrid() {
    if (!accentGrid) return;
    const current = lsGet('zs_accent', 'pink');
    accentGrid.innerHTML = Object.entries(ACCENTS).map(([key, a]) => `
      <div class="accent-item">
        <div class="accent-swatch-lg${current === key ? ' active' : ''}"
             data-key="${key}"
             title="${a.label}"
             style="background:${a.base}"></div>
        <div class="accent-swatch-label">${a.label}</div>
      </div>
    `).join('');

    accentGrid.querySelectorAll('.accent-swatch-lg').forEach(sw => {
      sw.onclick = () => {
        applyAccent(sw.dataset.key);
        accentGrid.querySelectorAll('.accent-swatch-lg').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
      };
    });
  }

  function loadSettingsUI() {
    const s = getSettings();
    if (setAutonext)    setAutonext.checked = s.autonext;
    if (setAutoskip)    setAutoskip.checked = s.autoskip;
    if (setAutoplay)    setAutoplay.checked = s.autoplay;
    buildAccentGrid();
  }

  function openSettings() {
    hideAllViewsForSettings();
    settingsView.classList.remove('hidden');
    document.title = "Settings — Zara's Movies";
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadSettingsUI();
  }

  if (settingsBack) {
    settingsBack.onclick = () => {
      settingsView.classList.add('hidden');
      homeView.classList.remove('hidden');
      document.title = "Zara's Movies";
    };
  }

  // Toggle wiring
  [setAutonext, setAutoskip, setAutoplay].forEach(el => {
    if (!el) return;
    el.addEventListener('change', () => {
      const s = getSettings();
      if (el === setAutonext) s.autonext = el.checked;
      if (el === setAutoskip) s.autoskip = el.checked;
      if (el === setAutoplay) s.autoplay = el.checked;
      saveSettings(s);
    });
  });

  if (clearProgress) {
    clearProgress.onclick = () => {
      localStorage.removeItem('zs_progress');
      clearProgress.textContent = 'Cleared ✓';
      setTimeout(() => { clearProgress.textContent = 'Clear'; }, 1600);
      setTimeout(() => { try { if (typeof window.refreshPersonalRows === 'function') window.refreshPersonalRows(); } catch {} }, 100);
    };
  }
  if (clearWatchlist) {
    clearWatchlist.onclick = () => {
      localStorage.removeItem('zs_favourites');
      clearWatchlist.textContent = 'Cleared ✓';
      setTimeout(() => { clearWatchlist.textContent = 'Clear'; }, 1600);
      setTimeout(() => { try { if (typeof window.refreshPersonalRows === 'function') window.refreshPersonalRows(); } catch {} }, 100);
    };
  }
  if (resetAll) {
    resetAll.onclick = () => {
      if (!confirm('Reset all settings and data?')) return;
      ['zs_favourites','zs_progress','zs_accent','zs_settings'].forEach(k => localStorage.removeItem(k));
      applyAccent('pink');
      loadSettingsUI();
      resetAll.textContent = 'Reset ✓';
      setTimeout(() => { resetAll.textContent = 'Reset'; }, 1600);
    };
  }

  /* ---------- Add settings button to header ---------- */
  (function injectSettingsButton() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('settingsBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'settingsBtn';
    btn.className = 'settings-btn';
    btn.title = 'Settings';
    btn.innerHTML = '⚙️';
    btn.onclick = openSettings;
    header.appendChild(btn);
  })();

  /* ---------- Make sure showHome / other nav hides settings view ---------- */
  const _priorShowHomeV5 = window.showHome;
  window.showHome = function () {
    settingsView.classList.add('hidden');
    _priorShowHomeV5();
  };

  /* ---------- Ensure view toggling from other modules hides settings ---------- */
  const _priorShowRandomV5 = showRandom;
  showRandom = function () {
    settingsView.classList.add('hidden');
    _priorShowRandomV5();
  };

  /* ============================================================
     SEARCH AUTOCOMPLETE
     ============================================================ */
  const searchInput   = document.getElementById('search');
  const suggestionsEl = document.getElementById('searchSuggestions');

  let suggestDebounce = null;
  let suggestAbort = null;
  let suggestItems = [];
  let suggestIndex = -1;
  let suggestCache = new Map();

  function hideSuggestions() {
    if (!suggestionsEl) return;
    suggestionsEl.classList.add('hidden');
    suggestionsEl.innerHTML = '';
    suggestItems = [];
    suggestIndex = -1;
  }

  function renderSuggestions(items, query) {
    if (!suggestionsEl) return;
    suggestItems = items;
    suggestIndex = items.length ? 0 : -1;

    if (!items.length) {
      suggestionsEl.innerHTML = `<div class="suggest-empty">No matches for "${esc(query)}"</div>`;
    } else {
      suggestionsEl.innerHTML = items.map((it, i) => {
        const title = it.title || it.name || 'Untitled';
        const year = (it.release_date || it.first_air_date || '').slice(0, 4);
        const type = it.media_type === 'tv' || it.first_air_date ? 'TV' : 'Movie';
        const rating = it.vote_average ? it.vote_average.toFixed(1) : '';
        const poster = it.poster_path
          ? `https://image.tmdb.org/t/p/w92${it.poster_path}`
          : '';
        return `
          <div class="suggest-item${i === 0 ? ' active' : ''}" data-idx="${i}">
            <div class="suggest-poster">${poster ? `<img src="${poster}" alt="" />` : '🎬'}</div>
            <div class="suggest-info">
              <div class="suggest-title">${esc(title)}</div>
              <div class="suggest-meta">
                <span class="suggest-badge">${type}</span>
                ${year ? `<span>${year}</span>` : ''}
                ${rating ? `<span>★ ${rating}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    suggestionsEl.classList.remove('hidden');

    suggestionsEl.querySelectorAll('.suggest-item').forEach(el => {
      el.onmouseenter = () => setActive(Number(el.dataset.idx));
      el.onclick = () => pickSuggestion(Number(el.dataset.idx));
    });
  }

  function setActive(i) {
    if (!suggestionsEl) return;
    suggestIndex = i;
    suggestionsEl.querySelectorAll('.suggest-item').forEach(el => {
      el.classList.toggle('active', Number(el.dataset.idx) === i);
    });
    const active = suggestionsEl.querySelector('.suggest-item.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function pickSuggestion(i) {
    const item = suggestItems[i];
    if (!item) return;
    const type = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie';
    const title = item.title || item.name || 'Untitled';
    hideSuggestions();
    searchInput.blur();
    searchInput.value = '';
    loadPlayer(type, item.id, 1, 1, title);
  }

  async function fetchSuggestions(query) {
    const q = query.trim();
    if (q.length < 2) {
      hideSuggestions();
      return;
    }

    // Use cache
    if (suggestCache.has(q)) {
      renderSuggestions(suggestCache.get(q), q);
      return;
    }

    if (suggestionsEl) {
      suggestionsEl.innerHTML = '<div class="suggest-loading">Searching…</div>';
      suggestionsEl.classList.remove('hidden');
    }

    if (suggestAbort) suggestAbort.abort();
    suggestAbort = new AbortController();

    try {
      const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`;
      const res = await fetch(url, { signal: suggestAbort.signal });
      if (!res.ok) throw new Error('TMDB ' + res.status);
      const data = await res.json();
      const items = (data.results || [])
        .filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path)
        .slice(0, 8);
      suggestCache.set(q, items);
      renderSuggestions(items, q);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Autocomplete failed:', err);
      if (suggestionsEl) {
        suggestionsEl.innerHTML = '<div class="suggest-empty">Couldn\'t search right now</div>';
      }
    }
  }

  if (searchInput && suggestionsEl) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value;
      clearTimeout(suggestDebounce);
      if (!q.trim()) { hideSuggestions(); return; }
      suggestDebounce = setTimeout(() => fetchSuggestions(q), 200);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (suggestionsEl.classList.contains('hidden')) return;
      const count = suggestItems.length;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (count) setActive((suggestIndex + 1) % count);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (count) setActive((suggestIndex - 1 + count) % count);
      } else if (e.key === 'Enter') {
        if (suggestIndex >= 0 && suggestItems[suggestIndex]) {
          e.preventDefault();
          e.stopPropagation();
          pickSuggestion(suggestIndex);
        }
      } else if (e.key === 'Escape') {
        hideSuggestions();
      }
    }, true); // capture so it runs before other Enter handlers

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length >= 2) {
        fetchSuggestions(searchInput.value);
      }
    });

    // Click outside closes
    document.addEventListener('click', (e) => {
      if (!suggestionsEl.contains(e.target) && e.target !== searchInput) {
        hideSuggestions();
      }
    });

    // Close on scroll of page
    window.addEventListener('scroll', () => {
      if (!suggestionsEl.classList.contains('hidden')) hideSuggestions();
    }, { passive: true });
  }

  console.log('[ZS] v5 — Settings page + autocomplete ready');
})();

/* ============================================================
   ZARA'S CUSTOM v6
   — consolidated header, URL routing, PWA install
   ============================================================ */
(function () {
  if (window.__zsCustomV6) return;
  window.__zsCustomV6 = true;

  /* ------------------------------------------------------------
     1. CONSOLIDATED HEADER — Browse dropdown
     ------------------------------------------------------------ */
  function injectBrowseButton() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('browseBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'browseBtn';
    btn.className = 'browse-btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="bi-icon">🧭</span> <span class="browse-label">Browse</span> <span class="caret">▾</span>';
    header.appendChild(btn);

    const menu = document.createElement('div');
    menu.id = 'browseMenu';
    menu.className = 'browse-menu hidden';
    menu.innerHTML = `
      <div class="browse-item" data-action="discover">
        <span class="bi-icon">🧭</span> Discover
        <span class="bi-desc">Categories</span>
      </div>
      <div class="browse-item" data-action="top100">
        <span class="bi-icon">🏆</span> Top 100
        <span class="bi-desc">Highest rated</span>
      </div>
      <div class="browse-item" data-action="random">
        <span class="bi-icon">🎲</span> Random
        <span class="bi-desc">Surprise me</span>
      </div>
    `;
    document.body.appendChild(menu);

    function openMenu() {
      const rect = btn.getBoundingClientRect();
      menu.style.top  = (rect.bottom + 8) + 'px';
      menu.style.left = Math.min(rect.left, window.innerWidth - 240) + 'px';
      menu.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.onclick = (e) => {
      e.stopPropagation();
      if (menu.classList.contains('hidden')) openMenu();
      else closeMenu();
    };

    menu.querySelectorAll('.browse-item').forEach(item => {
      item.onclick = () => {
        closeMenu();
        const action = item.dataset.action;
        if (action === 'discover' && typeof openDiscover === 'function') openDiscover();
        else if (action === 'top100' && typeof openTop100 === 'function') openTop100('movie');
        else if (action === 'random' && typeof showRandom === 'function') {
          showRandom();
          if (typeof refreshRandomGrid === 'function') refreshRandomGrid();
        }
      };
    });

    document.addEventListener('click', closeMenu);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, { passive: true });
  }
  injectBrowseButton();

  /* ------------------------------------------------------------
     2. URL ROUTING (hash-based, back button works)
     ------------------------------------------------------------ */

  // prevent routing loops
  let suppressRoute = false;

  function setHash(hash, { replace = false } = {}) {
    suppressRoute = true;
    const current = location.hash || '#/';
    if (current !== hash) {
      if (replace) history.replaceState(null, '', hash);
      else history.pushState(null, '', hash);
    }
    // release the flag after the microtask so the popstate/hashchange fires and sees it
    setTimeout(() => { suppressRoute = false; }, 0);
  }

  /* --- Patch navigation entrypoints --- */
  const _prevLoadPlayerV6  = loadPlayer;
  const _prevShowHomeV6    = window.showHome;
  const _prevShowRandomV6  = showRandom;
  const _prevOpenDiscover  = typeof openDiscover === 'function' ? openDiscover : null;
  const _prevOpenTop100    = typeof openTop100 === 'function' ? openTop100 : null;
  const _prevOpenGenre     = typeof openGenreView === 'function' ? openGenreView : null;
  const _prevOpenPerson    = typeof openPersonView === 'function' ? openPersonView : null;
  const _prevOpenColl      = typeof openCollectionView === 'function' ? openCollectionView : null;
  const _prevOpenSettings  = typeof openSettings === 'function' ? openSettings : null;

  loadPlayer = function (type, id, season, episode, title) {
    _prevLoadPlayerV6(type, id, season, episode, title);
    const q = new URLSearchParams();
    if (type === 'tv') {
      q.set('s', season || 1);
      q.set('e', episode || 1);
    }
    if (title) q.set('t', title);
    setHash(`#/watch/${type}/${id}${q.toString() ? '?' + q.toString() : ''}`);
  };

  window.showHome = function () {
    _prevShowHomeV6();
    setHash('#/');
  };

  showRandom = function () {
    _prevShowRandomV6();
    setHash('#/random');
  };

  if (_prevOpenDiscover) {
    openDiscover = function () {
      _prevOpenDiscover();
      setHash('#/discover');
    };
  }

  if (_prevOpenTop100) {
    openTop100 = function (type) {
      _prevOpenTop100(type);
      setHash(`#/top100${type && type !== 'movie' ? '?type=' + type : ''}`);
    };
  }

  if (_prevOpenGenre) {
    openGenreView = function (id, name) {
      _prevOpenGenre(id, name);
      const q = name ? `?name=${encodeURIComponent(name)}` : '';
      setHash(`#/genre/${id}${q}`);
    };
  }

  if (_prevOpenPerson) {
    openPersonView = function (id) {
      _prevOpenPerson(id);
      setHash(`#/person/${id}`);
    };
  }

  if (_prevOpenColl) {
    openCollectionView = function (id, name) {
      _prevOpenColl(id, name);
      const q = name ? `?name=${encodeURIComponent(name)}` : '';
      setHash(`#/collection/${id}${q}`);
    };
  }

  if (_prevOpenSettings) {
    openSettings = function () {
      _prevOpenSettings();
      setHash('#/settings');
    };
  }

  /* --- Router --- */
  async function routeFromHash() {
    if (suppressRoute) return;
    const raw = location.hash.replace(/^#/, '') || '/';
    const [pathPart, queryPart] = raw.split('?');
    const q = new URLSearchParams(queryPart || '');
    const segments = pathPart.split('/').filter(Boolean);

    try {
      if (segments.length === 0) {
        window.showHome();
        return;
      }

      const [top, a, b] = segments;

      if (top === 'watch' && a && b) {
        const type = a;
        const id = Number(b);
        const s = Number(q.get('s') || 1);
        const e = Number(q.get('e') || 1);
        const title = q.get('t') || '';
        _prevLoadPlayerV6(type, id, s, e, title);
        // also load similar + tv picker (the v6 wrapper did the URL push; here we
        // bypass loadPlayer so we don't push again)
        if (typeof window.__zsPostLoad === 'function') window.__zsPostLoad(type, id, s, e, title);
        return;
      }

      if (top === 'random')   { _prevShowRandomV6(); if (typeof refreshRandomGrid === 'function') refreshRandomGrid(); return; }
      if (top === 'discover') { if (_prevOpenDiscover) _prevOpenDiscover(); return; }
      if (top === 'top100')   { const t = q.get('type') || 'movie'; if (_prevOpenTop100) _prevOpenTop100(t); return; }
      if (top === 'settings') { if (_prevOpenSettings) _prevOpenSettings(); return; }
      if (top === 'genre' && a)      { if (_prevOpenGenre) _prevOpenGenre(Number(a), q.get('name') || ''); return; }
      if (top === 'person' && a)     { if (_prevOpenPerson) _prevOpenPerson(Number(a)); return; }
      if (top === 'collection' && a) { if (_prevOpenColl) _prevOpenColl(Number(a), q.get('name') || ''); return; }

      // unknown
      window.showHome();
    } catch (err) {
      console.error('Route failed:', err);
      window.showHome();
    }
  }

  /* expose post-load helper so the router can trigger similar + TV picker without re-pushing hash */
  window.__zsPostLoad = function (type, id, s, e, title) {
    try {
      if (type === 'tv' && typeof renderTVPicker === 'function') renderTVPicker(id, s || 1, e || 1);
      else if (typeof hideTVPicker === 'function') hideTVPicker();
      if (typeof loadSimilar === 'function') loadSimilar(type, id);
    } catch (err) { console.warn('post-load failed', err); }
    try { currentPlaying = { type, id, season: s || 1, episode: e || 1, title }; } catch {}
  };

  window.addEventListener('hashchange', routeFromHash);
  window.addEventListener('popstate', routeFromHash);

  /* Re-wire v3's back buttons (they bypass showHome and therefore the router) */
  const pairBacks = [
    ['genreBack'],
    ['top100Back'],
    ['discoverBack'],
    ['personBack'],
    ['collectionBack'],
    ['settingsBack'],
  ];
  pairBacks.forEach(([id]) => {
    const el = document.getElementById(id);
    if (el) el.onclick = () => window.showHome();
  });

  /* Run the initial route once everything is loaded */
  setTimeout(routeFromHash, 250);

  /* ------------------------------------------------------------
     3. PWA — register service worker + install prompt
     ------------------------------------------------------------ */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then((reg) => console.log('[PWA] SW registered:', reg.scope))
        .catch((err) => console.warn('[PWA] SW failed:', err));
    });
  }

  /* Tiny toast helper (also used by settings later) */
  window.zsToast = function (msg) {
    const el = document.createElement('div');
    el.className = 'zs-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 2200);
  };

  /* Save settings via toast feedback (the raw localStorage writes in v5 stay the same) */
  const origSave = window.saveSettings;
  // no-op if not exposed

  console.log('[ZS] v6 — Browse menu + routing + PWA ready');
  console.log('[ZS] Tip: bookmark #/watch/tv/1396?s=1&e=1 and refresh to jump straight into an episode.');
})();


/* ============================================================
   ZARA'S CUSTOM v9 — Polish pack
   - 13 Next episode button
   - 14 Resume prompt
   - 15 Rotating hero
   - 17 Accent-tinted hero (CSS only, already applied)
   - 19 Toasts everywhere
   - 20 Search history dropdown
   - 22 Error boundary UI
   - 24 TMDB request queue
   - 33 Console audit
   ============================================================ */
(function () {
  if (window.__zsCustomV9) return;
  window.__zsCustomV9 = true;

  /* ------------------------------------------------------------
     33. Console cleanup — silence old [ZS] logs
     ------------------------------------------------------------ */
  const _origLog = console.log.bind(console);
  console.log = function (...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].startsWith('[ZS]')) return;
    return _origLog(...args);
  };

  /* ------------------------------------------------------------
     24. TMDB global request queue
     ------------------------------------------------------------ */
  const TMDB_MAX_CONCURRENT = 3;
  const TMDB_MIN_GAP = 250;   // 4 req/sec — safely under TMDB's 40/10s cap
  const tmdbQueue = [];
  let tmdbActive = 0;
  let tmdbLastStart = 0;

  function friendlyTmdbError(status) {
    if (status === 401) return 'TMDB rejected the API key';
    if (status === 404) return 'Not found on TMDB';
    if (status === 429) return 'Rate limited — slow down a moment';
    if (status >= 500) return 'TMDB is having trouble right now';
    return `TMDB error (${status})`;
  }

  async function tmdbPump() {
    if (tmdbActive >= TMDB_MAX_CONCURRENT) return;
    if (!tmdbQueue.length) return;

    const wait = Math.max(0, TMDB_MIN_GAP - (Date.now() - tmdbLastStart));
    if (wait > 0) { setTimeout(tmdbPump, wait); return; }

    const job = tmdbQueue.shift();
    tmdbActive++;
    tmdbLastStart = Date.now();

    try {
      const sep = job.path.includes('?') ? '&' : '?';
      const url = `https://api.themoviedb.org/3${job.path}${sep}api_key=${TMDB_KEY}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = new Error(friendlyTmdbError(res.status));
        err.status = res.status;
        throw err;
      }
      job.resolve(await res.json());
    } catch (e) {
      job.reject(e);
    } finally {
      tmdbActive--;
      tmdbPump();
    }
  }

  // Replace global tmdb
  tmdb = function (path) {
    return new Promise((resolve, reject) => {
      tmdbQueue.push({ path, resolve, reject });
      tmdbPump();
    });
  };

  /* ------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------ */
  function closestEl(el, sel) {
    while (el && el.nodeType === 1) {
      if (el.matches && el.matches(sel)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function getProgressFor(type, id, season, episode) {
    try {
      const store = JSON.parse(localStorage.getItem('zs_progress') || '{}');
      const key = (type === 'tv' && season && episode)
        ? `tv:${id}:${season}:${episode}`
        : `${type}:${id}`;
      return store[key] || null;
    } catch { return null; }
  }

  /* ------------------------------------------------------------
     19. Toasts — favourite toggle
     ------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    const favBtn = closestEl(e.target, '.fav-btn');
    if (!favBtn) return;
    setTimeout(() => {
      const nowActive = favBtn.classList.contains('active');
      if (typeof window.zsToast === 'function') {
        window.zsToast(nowActive ? '♥ Added to Watchlist' : 'Removed from Watchlist');
      }
    }, 0);
  }, true);

  /* Toasts — data-clearing buttons */
  const clearButtons = [
    ['clearProgress',  'Progress cleared'],
    ['clearWatchlist', 'Watchlist cleared'],
    ['resetAll',       'Everything reset'],
  ];
  clearButtons.forEach(([id, msg]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      setTimeout(() => {
        if (typeof window.zsToast === 'function') window.zsToast(msg);
      }, 60);
    });
  });

  /* Toasts — settings toggles */
  ['setAutonext', 'setAutoskip', 'setAutoplay'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      if (typeof window.zsToast === 'function') {
        window.zsToast(el.checked ? 'Setting enabled' : 'Setting disabled');
      }
    });
  });

  /* Toasts — accent swatches */
  document.addEventListener('click', (e) => {
    const sw = closestEl(e.target, '.accent-swatch-lg');
    if (!sw) return;
    const label = (sw.title || sw.dataset.key || '').toString();
    const pretty = label.charAt(0).toUpperCase() + label.slice(1);
    if (typeof window.zsToast === 'function' && label) {
      window.zsToast('Accent: ' + pretty);
    }
  }, true);

  /* ------------------------------------------------------------
     13. Next Episode button
     ------------------------------------------------------------ */
  function ensureNextEpisodeButton() {
    let btn = document.getElementById('nextEpisodeBtn');
    if (btn) return btn;
    const playerWrap = document.getElementById('player-wrap');
    if (!playerWrap || !playerWrap.parentNode) return null;
    btn = document.createElement('button');
    btn.id = 'nextEpisodeBtn';
    btn.className = 'next-episode-btn hidden';
    btn.innerHTML = 'Next Episode →';
    playerWrap.parentNode.insertBefore(btn, playerWrap.nextSibling);
    return btn;
  }

  const nextEpisodeBtn = ensureNextEpisodeButton();

  if (nextEpisodeBtn) {
    nextEpisodeBtn.onclick = () => {
      const cp = window.currentPlaying;
      if (!cp || cp.type !== 'tv') return;
      let season = cp.season || 1;
      let nextEp = (cp.episode || 1) + 1;
      const st = window.__zsTvState;
      if (st && st.id === cp.id && st.season === season && st.seasonData) {
        const count = (st.seasonData.episodes || []).length;
        if (count && nextEp > count) {
          const later = (st.seasons || []).find(s => s.season_number > season);
          if (!later) {
            if (typeof window.zsToast === 'function') window.zsToast("That's the last episode");
            return;
          }
          season = later.season_number;
          nextEp = 1;
        }
      }
      if (typeof window.zsToast === 'function') {
        window.zsToast(`Loading S${season} E${nextEp}…`);
      }
      loadPlayer('tv', cp.id, season, nextEp, cp.title || '');
    };
  }

  /* Track currentPlaying globally */
  window.currentPlaying = null;

  /* Update on auto-next events from the player */
  window.addEventListener('message', (event) => {
    if (event.origin !== ORIGIN) return;
    const d = event.data;
    if (d && d.type === 'cinesrc:nextepisode' && window.currentPlaying) {
      if (d.season != null && d.episode != null) {
        window.currentPlaying.season = d.season;
        window.currentPlaying.episode = d.episode;
      }
    }
  });

  /* ------------------------------------------------------------
     14. Resume prompt — auto-seek URL + our own overlay
     ------------------------------------------------------------ */
  const _prevBuildUrlV9 = buildUrl;
  buildUrl = function (type, id, season, episode) {
    let url = _prevBuildUrlV9(type, id, season, episode);
    const prog = getProgressFor(type, id, season, episode);
    if (prog && prog.time > 30 && prog.duration && (prog.time / prog.duration) < 0.95) {
      const sep = url.includes('?') ? '&' : '?';
      url += `${sep}t=${Math.floor(prog.time)}&continueprompt=false`;
    }
    return url;
  };

  function seekWhenReady(time) {
    let handled = false;
    const fire = () => { if (handled) return; handled = true; try { sendCommand('seek', [time]); } catch {} };
    const handler = (event) => {
      if (event.origin !== ORIGIN) return;
      if (event.data && event.data.type === 'cinesrc:ready') {
        window.removeEventListener('message', handler);
        setTimeout(fire, 80);
      }
    };
    window.addEventListener('message', handler);
    setTimeout(() => { window.removeEventListener('message', handler); fire(); }, 6000);
  }

  function showResumePrompt(prog, onResume, onRestart) {
    const existing = document.getElementById('resumeOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'resumeOverlay';
    overlay.className = 'resume-overlay';

    const backdrop = prog.poster_path
      ? `https://image.tmdb.org/t/p/w500${prog.poster_path}`
      : (prog.backdrop_path ? `https://image.tmdb.org/t/p/w780${prog.backdrop_path}` : '');

    overlay.innerHTML = `
      <div class="resume-card">
        ${backdrop ? `<div class="resume-bg" style="background-image:url('${backdrop}')"></div>` : ''}
        <div class="resume-body">
          <div class="resume-eyebrow">Continue watching</div>
          <h3 class="resume-title">${esc(prog.title || 'Resume?')}</h3>
          <p class="resume-desc">You stopped at <strong>${formatTime(prog.time)}</strong></p>
          <div class="resume-actions">
            <button class="resume-btn resume-btn-primary" id="resumeYes">▶ Resume</button>
            <button class="resume-btn resume-btn-ghost" id="resumeNo">Start over</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#resumeYes').onclick = () => { try { onResume(); } catch {} close(); };
    overlay.querySelector('#resumeNo').onclick  = () => { try { onRestart(); } catch {} close(); };
    overlay.onclick = (e) => { if (e.target === overlay) { try { onResume(); } catch {} close(); } };
  }

  function maybeShowResumePrompt(type, id, season, episode) {
    const prog = getProgressFor(type, id, season, episode);
    if (!prog || prog.time < 30 || !prog.duration) return;
    if (prog.time / prog.duration > 0.95) return;

    setTimeout(() => {
      showResumePrompt(prog,
        () => { /* already seeks via t= parameter */ },
        () => { seekWhenReady(0); }
      );
    }, 400);
  }

  /* loadPlayer wrapper: track, show next button, show resume prompt */
  const _prevLoadPlayerV9 = loadPlayer;
  loadPlayer = function (type, id, season, episode, title) {
    window.currentPlaying = {
      type, id,
      season: season || 1,
      episode: episode || 1,
      title: title || '',
    };
    _prevLoadPlayerV9(type, id, season, episode, title);

    if (nextEpisodeBtn) {
      if (type === 'tv') nextEpisodeBtn.classList.remove('hidden');
      else nextEpisodeBtn.classList.add('hidden');
    }

    maybeShowResumePrompt(type, id, season, episode);
  };

  /* Router path also needs the hooks — patch __zsPostLoad from v6 */
  const _prevPostLoad = window.__zsPostLoad;
  window.__zsPostLoad = function (type, id, s, e, title) {
    if (typeof _prevPostLoad === 'function') _prevPostLoad(type, id, s, e, title);
    window.currentPlaying = { type, id, season: s || 1, episode: e || 1, title: title || '' };
    if (nextEpisodeBtn) {
      if (type === 'tv') nextEpisodeBtn.classList.remove('hidden');
      else nextEpisodeBtn.classList.add('hidden');
    }
    maybeShowResumePrompt(type, id, s, e);
  };

  /* ------------------------------------------------------------
     15. Rotating hero carousel
     ------------------------------------------------------------ */
  let heroState = { items: [], index: 0, timer: null };

  function buildHeroCarousel(items) {
    const heroEl = document.getElementById('hero');
    if (!heroEl || !items.length) return;

    heroState.items = items;
    heroState.index = 0;
    clearInterval(heroState.timer);

    function renderItem(idx) {
      const item = items[idx];
      const title = item.title || item.name || 'Featured';
      const date = (item.release_date || item.first_air_date || '').slice(0, 4);
      const type = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie';
      const backdrop = item.backdrop_path
        ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
        : '';

      heroEl.style.setProperty('--hero-img', backdrop ? `url("${backdrop}")` : 'none');

      heroEl.innerHTML = `
        <div class="hero-content">
          <div class="hero-badge">✦ Featured ${type === 'tv' ? 'Series' : 'Film'}</div>
          <h1 class="hero-title">${esc(title)}</h1>
          <div class="hero-meta">
            ${date ? `<span>${date}</span><span class="dot"></span>` : ''}
            <span>★ ${(item.vote_average || 0).toFixed(1)}</span>
            <span class="dot"></span>
            <span>${type === 'tv' ? 'TV Show' : 'Movie'}</span>
          </div>
          <p class="hero-overview">${esc(item.overview || 'No description available.')}</p>
          <div class="hero-actions">
            <button class="btn-primary" id="heroPlay">▶ Play Now</button>
            <button class="btn-ghost" id="heroInfo">More Info</button>
          </div>
          <div class="hero-dots">
            ${items.map((_, i) => `<span class="hero-dot${i === idx ? ' active' : ''}" data-idx="${i}"></span>`).join('')}
          </div>
        </div>
      `;

      document.getElementById('heroPlay').onclick = () => loadPlayer(type, item.id, 1, 1, title);
      document.getElementById('heroInfo').onclick = () => loadPlayer(type, item.id, 1, 1, title);

      heroEl.querySelectorAll('.hero-dot').forEach(dot => {
        dot.onclick = (e) => {
          e.stopPropagation();
          const i = Number(dot.dataset.idx);
          heroState.index = i;
          renderItem(i);
          resetTimer();
        };
      });
    }

    function advance() {
      heroState.index = (heroState.index + 1) % items.length;
      renderItem(heroState.index);
    }

    function resetTimer() {
      clearInterval(heroState.timer);
      if (items.length > 1) {
        heroState.timer = setInterval(advance, 8000);
      }
    }

    renderItem(0);
    resetTimer();
  }

  /* Wrap loadHome to build the carousel after it finishes */
  const _prevLoadHomeV9 = loadHome;
  loadHome = async function () {
    try {
      await _prevLoadHomeV9();
      try {
        const trending = await tmdb('/trending/all/week');
        const top5 = (trending.results || [])
          .filter(r => r.backdrop_path && r.overview)
          .slice(0, 5);
        if (top5.length) buildHeroCarousel(top5);
      } catch (e) { /* keep single-item hero */ }
    } catch (err) {
      const rowsEl = document.getElementById('rows');
      if (rowsEl) {
        rowsEl.innerHTML = '';
        const panel = document.createElement('div');
        panel.className = 'error-panel';
        panel.innerHTML = `
          <div class="error-icon">⚠️</div>
          <h3 class="error-title">Couldn't load the home page</h3>
          <p class="error-desc">${esc(err.message || 'Something went wrong.')}</p>
          <button class="error-retry" id="homeRetry">↻ Try again</button>
        `;
        rowsEl.appendChild(panel);
        const btn = panel.querySelector('#homeRetry');
        if (btn) btn.onclick = () => loadHome();
      }
    }
  };

  /* ------------------------------------------------------------
     22. Error boundary — upgrade ugly error rows
     ------------------------------------------------------------ */
  const rowsElForErrors = document.getElementById('rows');
  if (rowsElForErrors) {
    const errorObserver = new MutationObserver(() => {
      rowsElForErrors.querySelectorAll('.row').forEach(row => {
        const heading = row.querySelector('.row-title');
        if (!heading) return;
        if (/^Error$/i.test((heading.textContent || '').trim())) {
          const msg = (row.textContent || '').replace(/Error/i, '').trim() || 'Something went wrong';
          const panel = document.createElement('div');
          panel.className = 'error-panel';
          panel.innerHTML = `
            <div class="error-icon">⚠️</div>
            <h3 class="error-title">Something went wrong</h3>
            <p class="error-desc">${esc(msg)}</p>
            <button class="error-retry" id="rowRetry">↻ Try again</button>
          `;
          const btn = panel.querySelector('#rowRetry');
          if (btn) btn.onclick = () => loadHome();
          row.replaceWith(panel);
        }
      });
    });
    errorObserver.observe(rowsElForErrors, { childList: true, subtree: false });
  }

  /* ------------------------------------------------------------
     20. Search history dropdown
     ------------------------------------------------------------ */
  const SH_KEY = 'zs_search_history';
  const SH_MAX = 5;
  const searchInputEl = document.getElementById('search');
  let searchHistoryEl = null;

  function getSearchHistory() {
    try { return JSON.parse(localStorage.getItem(SH_KEY) || '[]'); }
    catch { return []; }
  }
  function setSearchHistory(arr) {
    try { localStorage.setItem(SH_KEY, JSON.stringify(arr.slice(0, SH_MAX))); } catch {}
  }
  function addSearchHistory(q) {
    q = (q || '').trim();
    if (!q) return;
    let h = getSearchHistory().filter(x => x.toLowerCase() !== q.toLowerCase());
    h.unshift(q);
    setSearchHistory(h);
  }

  function ensureSearchHistoryEl() {
    if (searchHistoryEl) return searchHistoryEl;
    const searchRow = document.querySelector('.search-row');
    if (!searchRow) return null;
    searchHistoryEl = document.createElement('div');
    searchHistoryEl.className = 'search-history hidden';
    searchHistoryEl.id = 'searchHistory';
    searchRow.appendChild(searchHistoryEl);
    return searchHistoryEl;
  }

  function renderSearchHistory() {
    const el = ensureSearchHistoryEl();
    if (!el) return;
    const h = getSearchHistory();
    if (!h.length) { el.classList.add('hidden'); return; }
    el.innerHTML = `
      <div class="sh-header">
        <span>Recent searches</span>
        <button class="sh-clear" id="shClear">Clear</button>
      </div>
      ${h.map(q => `<div class="sh-item" data-q="${esc(q)}">🔎 ${esc(q)}</div>`).join('')}
    `;
    el.classList.remove('hidden');

    el.querySelector('#shClear').onclick = (e) => {
      e.stopPropagation();
      setSearchHistory([]);
      el.classList.add('hidden');
    };
    el.querySelectorAll('.sh-item').forEach(item => {
      item.onclick = () => {
        const q = item.dataset.q;
        if (searchInputEl) searchInputEl.value = q;
        el.classList.add('hidden');
        const sug = document.getElementById('searchSuggestions');
        if (sug) sug.classList.add('hidden');
        if (typeof runSearch === 'function') runSearch();
      };
    });
  }

  if (searchInputEl) {
    searchInputEl.addEventListener('focus', () => {
      if (!searchInputEl.value.trim()) renderSearchHistory();
    });
    searchInputEl.addEventListener('input', () => {
      const el = ensureSearchHistoryEl();
      if (el) el.classList.add('hidden');
    });
    document.addEventListener('click', (e) => {
      const el = ensureSearchHistoryEl();
      if (!el) return;
      if (!el.contains(e.target) && e.target !== searchInputEl) {
        el.classList.add('hidden');
      }
    });
  }

  /* Record searches */
  const _prevRunSearchV9 = typeof runSearch === 'function' ? runSearch : null;
  if (_prevRunSearchV9) {
    runSearch = async function () {
      if (searchInputEl) addSearchHistory(searchInputEl.value);
      return _prevRunSearchV9();
    };
  }

  console.log('[ZS] v9 — polish pack loaded');
})();


/* ============================================================
   ZARA'S CUSTOM v12 — clean player view + reliable TV picker
   ============================================================ */
(function () {
  if (window.__zsCustomV12) return;
  window.__zsCustomV12 = true;

  /* ---------- Remove any legacy TV picker from v2 ---------- */
  const legacy = document.getElementById('tv-picker');
  if (legacy) legacy.remove();

  /* ---------- Create the new TV picker container ---------- */
  function ensureTvPickerRoot() {
    let root = document.getElementById('tvPickerRoot');
    if (root) return root;

    const playerWrap = document.getElementById('player-wrap');
    if (!playerWrap || !playerWrap.parentNode) return null;

    root = document.createElement('div');
    root.id = 'tvPickerRoot';
    root.className = 'hidden';

    // Insert right after the player-wrap (which is after the "Next Episode" button)
    playerWrap.parentNode.insertBefore(root, playerWrap.nextSibling);
    return root;
  }

  function hideTvPicker() {
    const root = document.getElementById('tvPickerRoot');
    if (root) {
      root.classList.add('hidden');
      root.innerHTML = '';
    }
  }

  /* ---------- Caches ---------- */
  const tvInfoCache = new Map();    // tvId -> full details
  const seasonCache = new Map();    // tvId:season -> season data

  async function getTvInfo(tvId) {
    if (tvInfoCache.has(tvId)) return tvInfoCache.get(tvId);
    const data = await tmdb(`/tv/${tvId}`);
    tvInfoCache.set(tvId, data);
    return data;
  }

  async function getSeason(tvId, seasonNum) {
    const key = `${tvId}:${seasonNum}`;
    if (seasonCache.has(key)) return seasonCache.get(key);
    const data = await tmdb(`/tv/${tvId}/season/${seasonNum}`);
    seasonCache.set(key, data);
    return data;
  }

  /* ---------- Render ---------- */
  let currentTvState = { id: null, season: 1, episode: 1 };

  async function renderTvPicker(tvId, season, episode) {
    currentTvState = { id: tvId, season, episode };

    const root = ensureTvPickerRoot();
    if (!root) return;
    root.classList.remove('hidden');
    root.innerHTML = '<div class="tv-picker-card"><div class="tv-picker-loading">Loading episodes…</div></div>';

    try {
      const info = await getTvInfo(tvId);
      const seasons = (info.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0);

      if (!seasons.length) {
        root.innerHTML = '<div class="tv-picker-card"><div class="tv-picker-empty">No episodes available.</div></div>';
        return;
      }

      // Snap to a valid season
      if (!seasons.some(s => s.season_number === season)) {
        season = seasons[0].season_number;
        currentTvState.season = season;
      }

      const seasonData = await getSeason(tvId, season);
      const episodes = seasonData.episodes || [];
      window.__zsTvState = { id: tvId, season, seasonData, seasons };

      root.innerHTML = `
        <div class="tv-picker-card">
          <div class="tv-picker-head">
            <h3>
              <span class="show-name">${esc(info.name || 'Episodes')}</span>
              <span class="season-label">· S${season}</span>
            </h3>
            <select id="tvSeasonSelect" aria-label="Select season">
              ${seasons.map(s => `
                <option value="${s.season_number}" ${s.season_number === season ? 'selected' : ''}>
                  ${esc(s.name || `Season ${s.season_number}`)} · ${s.episode_count} eps
                </option>
              `).join('')}
            </select>
          </div>
          <div class="episode-strip" id="tvEpisodeStrip">
            ${episodes.length ? episodes.map(ep => {
              const still = ep.still_path
                ? `<img src="https://image.tmdb.org/t/p/w300${ep.still_path}" alt="" loading="lazy" />`
                : '';
              const meta = [
                ep.air_date || '',
                ep.runtime ? `${ep.runtime} min` : '',
              ].filter(Boolean).join(' · ');
              return `
                <div class="ep-card${ep.episode_number === episode ? ' active' : ''}"
                     data-ep="${ep.episode_number}">
                  <div class="ep-thumb">
                    ${still}
                    <span class="ep-num">E${ep.episode_number}</span>
                  </div>
                  <div class="ep-body">
                    <div class="ep-title">${esc(ep.name || `Episode ${ep.episode_number}`)}</div>
                    <div class="ep-meta">${meta}</div>
                  </div>
                </div>
              `;
            }).join('') : '<div class="tv-picker-empty">No episodes in this season.</div>'}
          </div>
        </div>
      `;

      // Season dropdown
      const sel = root.querySelector('#tvSeasonSelect');
      if (sel) {
        sel.onchange = () => {
          renderTvPicker(tvId, Number(sel.value), 1);
        };
      }

      // Episode clicks
      root.querySelectorAll('.ep-card').forEach(card => {
        card.onclick = () => {
          const ep = Number(card.dataset.ep);
          root.querySelectorAll('.ep-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          // Bypass v6's hash-push by calling the underlying loader directly
          loadPlayer('tv', tvId, season, ep, info.name || '');
        };
      });

      // Scroll active into view
      const activeEl = root.querySelector('.ep-card.active');
      if (activeEl) {
        setTimeout(() => {
          activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('TV picker failed:', err);
      root.innerHTML = '<div class="tv-picker-card"><div class="tv-picker-empty">Couldn\'t load episodes.</div></div>';
    }
  }

  /* ---------- Hook into loadPlayer ---------- */
  const _prevLoadPlayerV12 = loadPlayer;
  loadPlayer = function (type, id, season, episode, title) {
    _prevLoadPlayerV12(type, id, season, episode, title);

    if (type === 'tv') {
      // small delay so the player has started rendering
      setTimeout(() => renderTvPicker(id, season || 1, episode || 1), 80);
    } else {
      hideTvPicker();
    }
  };

  /* Also patch the router's post-load hook */
  const _prevPostLoadV12 = window.__zsPostLoad;
  window.__zsPostLoad = function (type, id, s, e, title) {
    if (typeof _prevPostLoadV12 === 'function') _prevPostLoadV12(type, id, s, e, title);
    if (type === 'tv') {
      setTimeout(() => renderTvPicker(id, s || 1, e || 1), 80);
    } else {
      hideTvPicker();
    }
  };

  /* Hide picker when leaving the player */
  const _prevShowHomeV12 = window.showHome;
  window.showHome = function () {
    hideTvPicker();
    _prevShowHomeV12();
  };

  /* If a URL route loads a TV show directly, honour it on boot */
  setTimeout(() => {
    const hash = location.hash || '';
    const m = hash.match(/#\/watch\/tv\/(\d+)/);
    if (m) {
      const tvId = Number(m[1]);
      const q = new URLSearchParams((hash.split('?')[1]) || '');
      const s = Number(q.get('s') || 1);
      const e = Number(q.get('e') || 1);
      if (tvId) renderTvPicker(tvId, s, e);
    }
  }, 600);

  console.log('[ZS] v12 — clean player view + TV picker ready');
})();



/* ============================================================
   ZARA'S CUSTOM v15 — Episode tooltip (bulletproof)
   Attaches listeners DIRECTLY to each .ep-card as it appears.
   ============================================================ */
(function () {
  if (window.__zsCustomV15) return;
  window.__zsCustomV15 = true;

  const DEBUG = false;
  const log = (...a) => { if (DEBUG) console.log('[ep-tip]', ...a); };

  /* ---------- tooltip element ---------- */
  let tooltip = document.getElementById('epHover');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'epHover';
    tooltip.className = 'ep-hover hidden';
    document.body.appendChild(tooltip);
    log('created tooltip element');
  } else {
    log('reusing existing tooltip element');
  }

  let hideTimer = null;

  function hide() {
    clearTimeout(hideTimer);
    tooltip.classList.remove('show');
    hideTimer = setTimeout(() => tooltip.classList.add('hidden'), 150);
  }

  function buildData(card) {
    const state = window.__zsTvState || {};
    const epNum = Number(card.dataset.ep || 0);
    const season = state.season || 1;
    const seasonData = state.seasonData;
    const episodeData = seasonData && seasonData.episodes
      ? seasonData.episodes.find(x => x.episode_number === epNum)
      : null;

    // fallbacks from DOM
    const titleEl = card.querySelector('.ep-title');
    const metaEl  = card.querySelector('.ep-meta');

    return {
      season,
      episode: epNum,
      title: (episodeData && episodeData.name) || (titleEl && titleEl.textContent.trim()) || 'Untitled',
      overview: (episodeData && episodeData.overview) || '',
      airDate: (episodeData && episodeData.air_date) || '',
      runtime: (episodeData && episodeData.runtime) || null,
      rating: (episodeData && episodeData.vote_average) || null,
      _hadEpisodeData: !!episodeData,
    };
  }

  function showTooltip(card) {
    const data = buildData(card);
    log('show', data.season + 'x' + data.episode, data.title, data._hadEpisodeData ? '(full data)' : '(DOM fallback)');

    tooltip.innerHTML = `
      <div class="eh-head">
        <span class="eh-num">S${data.season} · E${data.episode}</span>
        ${data.rating
          ? `<span class="eh-rating">★ ${Number(data.rating).toFixed(1)}</span>`
          : `<span class="eh-rating empty">No rating</span>`}
      </div>
      <h4 class="eh-title">${esc(data.title)}</h4>
      <div class="eh-meta">
        ${data.airDate ? `<span>${data.airDate}</span>` : ''}
        ${data.airDate && data.runtime ? `<span class="dot"></span>` : ''}
        ${data.runtime ? `<span>${data.runtime} min</span>` : ''}
      </div>
      <p class="eh-overview${data.overview ? '' : ' empty'}">
        ${esc(data.overview || 'No description available.')}
      </p>
    `;

    tooltip.classList.remove('hidden');
    void tooltip.offsetWidth;

    const rect = card.getBoundingClientRect();
    const tipW = 280;
    const tipH = tooltip.offsetHeight || 200;
    const margin = 12;

    let left = rect.left + rect.width / 2 - tipW / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tipW - margin));

    let top;
    if (rect.top > tipH + 20) {
      top = rect.top - tipH - margin;
    } else {
      top = Math.min(rect.bottom + margin, window.innerHeight - tipH - margin);
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top  = top + 'px';
    tooltip.classList.add('show');
  }

  /* ---------- Attach listeners to episode cards ---------- */
  function attachToCard(card) {
    if (card.dataset.epTipAttached === '1') return;
    card.dataset.epTipAttached = '1';

    card.addEventListener('mouseenter', () => {
      log('mouseenter ep', card.dataset.ep);
      clearTimeout(hideTimer);
      showTooltip(card);
    });

    card.addEventListener('mouseleave', () => {
      log('mouseleave ep', card.dataset.ep);
      hide();
    });

    log('attached listeners to ep', card.dataset.ep);
  }

  function scanCards() {
    const cards = document.querySelectorAll('.ep-card');
    if (!cards.length) return;
    log('scan found', cards.length, 'ep-card(s)');
    cards.forEach(attachToCard);
  }

  /* Scan immediately, on DOM mutations, and after delays */
  scanCards();

  const obs = new MutationObserver(() => scanCards());
  obs.observe(document.body, { childList: true, subtree: true });

  // In case the picker renders after our observer starts observing
  setTimeout(scanCards, 400);
  setTimeout(scanCards, 1200);

  /* Global dismiss */
  window.addEventListener('scroll', () => { hide(); }, { passive: true, capture: true });
  window.addEventListener('resize', hide);
  window.addEventListener('hashchange', hide);

  log('v15 ready — observer active');
})();

/* ============================================================
   ZARA'S CUSTOM v16
   — Netflix-style profiles, IMDb-only Top 100, desktop install
   ============================================================ */
(function () {
  if (window.__zsCustomV16) return;
  window.__zsCustomV16 = true;

  /* ============================================================
     A. Per-profile storage — transparently namespace keys
     ============================================================ */
  const NAMESPACED = new Set([
    'zs_favourites', 'zs_progress', 'zs_accent', 'zs_settings', 'zs_search_history',
  ]);
  let _activeProfileId = null;

  const _lsGet = Storage.prototype.getItem;
  const _lsSet = Storage.prototype.setItem;
  const _lsRem = Storage.prototype.removeItem;

  const _nsKey = (k) => (_activeProfileId && NAMESPACED.has(k))
    ? `${k}::${_activeProfileId}`
    : k;

  Storage.prototype.getItem    = function (k)    { return _lsGet.call(this, _nsKey(k)); };
  Storage.prototype.setItem    = function (k, v) { return _lsSet.call(this, _nsKey(k), v); };
  Storage.prototype.removeItem = function (k)    { return _lsRem.call(this, _nsKey(k)); };

  /* ============================================================
     B. Profile store + helpers
     ============================================================ */
  const LS_PROFILES = 'zs_profiles';
  const LS_ACTIVE   = 'zs_active_profile';
  const SS_PICKED   = 'zs_profile_picked';

  const AVATARS = ['🌸','🦊','🐼','🌊','🎬','🌙','🦋','🍭','⭐','🎨','🐙','🌻','🍿','🎧','🚀','🐳'];

  const ACCENT_MAP = {
    pink:     { base: '#ffb6d9', light: '#ffd1e6', deep: '#ff8fc7' },
    lavender: { base: '#c9b6ff', light: '#e0d1ff', deep: '#a88fff' },
    mint:     { base: '#a8e6cf', light: '#c9f0e0', deep: '#7fd4b5' },
    sky:      { base: '#a8d8ff', light: '#c9e5ff', deep: '#7fbcff' },
    peach:    { base: '#ffc9a8', light: '#ffddc9', deep: '#ffab7f' },
    coral:    { base: '#ffa8b8', light: '#ffc9d3', deep: '#ff7f95' },
  };
  const COLOR_HEX = Object.fromEntries(
    Object.entries(ACCENT_MAP).map(([k, v]) => [k, v.base])
  );

  function loadProfiles() {
    try { return JSON.parse(_lsGet.call(localStorage, LS_PROFILES) || '[]'); }
    catch { return []; }
  }
  function saveProfiles(list) {
    try { _lsSet.call(localStorage, LS_PROFILES, JSON.stringify(list)); } catch {}
  }
  function getActiveId() {
    try { return _lsGet.call(localStorage, LS_ACTIVE); } catch { return null; }
  }
  function setActiveId(id) {
    try { _lsSet.call(localStorage, LS_ACTIVE, id || ''); } catch {}
  }
  const newId = () => 'p_' + Math.random().toString(36).slice(2, 10);
  const hexToRgba = (hex, a) => {
    const h = hex.replace('#', '');
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  };
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
  ));

  function applyProfileAccent(profile) {
    const key = (profile && profile.color) || 'pink';
    const a = ACCENT_MAP[key] || ACCENT_MAP.pink;
    const root = document.documentElement;
    root.style.setProperty('--accent', a.base);
    root.style.setProperty('--accent-2', a.light);
    root.style.setProperty('--accent-deep', a.deep);
    root.style.setProperty('--accent-glow', hexToRgba(a.base, 0.25));
    root.style.setProperty('--accent-glow-strong', hexToRgba(a.base, 0.45));
    root.dataset.accentHex = a.base.replace('#', '');
    try { localStorage.setItem('zs_accent', JSON.stringify(key)); } catch {}
  }

  /* ============================================================
     C. Profile picker overlay
     ============================================================ */
  let pickerManageMode = false;

  function showPickerOverlay() {
    pickerManageMode = false;
    const existing = document.getElementById('profilePicker');
    if (existing) existing.remove();

    const profiles = loadProfiles();
    const overlay = document.createElement('div');
    overlay.id = 'profilePicker';
    overlay.className = 'profile-picker';
    overlay.innerHTML = `
      <div class="pp-inner">
        <div class="pp-brand">
          <span class="brand-dot"></span>
          <span>Zara's Movies</span>
        </div>
        <h1 class="pp-title">${profiles.length ? "Who's watching?" : "Create your profile"}</h1>
        <p class="pp-sub">${profiles.length ? "Pick a profile to continue" : "Set up a profile to get started"}</p>
        <div class="pp-grid" id="ppGrid"></div>
        ${profiles.length > 1 ? '<button class="pp-manage" id="ppManage">Manage Profiles</button>' : ''}
      </div>
    `;
    document.body.appendChild(overlay);

    renderPickerGrid();

    const manageBtn = overlay.querySelector('#ppManage');
    if (manageBtn) {
      manageBtn.onclick = () => {
        pickerManageMode = !pickerManageMode;
        overlay.classList.toggle('manage', pickerManageMode);
        manageBtn.textContent = pickerManageMode ? 'Done' : 'Manage Profiles';
        renderPickerGrid();
      };
    }

    if (profiles.length === 0) {
      setTimeout(() => openEditor(null), 120);
    }
  }

  function renderPickerGrid() {
    const grid = document.getElementById('ppGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const profiles = loadProfiles();

    profiles.forEach(p => {
      const item = document.createElement('button');
      item.className = 'pp-item';
      item.innerHTML = `
        <div class="pp-avatar" style="--p-color:${COLOR_HEX[p.color] || COLOR_HEX.pink}">
          ${p.kids ? '<span class="pp-kids-badge">KIDS</span>' : ''}
          <span class="pp-emoji">${p.avatar || '👤'}</span>
        </div>
        <div class="pp-name">${escapeHtml(p.name)}</div>
      `;
      item.onclick = () => {
        if (pickerManageMode) openEditor(p);
        else selectProfile(p.id);
      };
      grid.appendChild(item);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'pp-item pp-add';
    addBtn.innerHTML = `
      <div class="pp-avatar pp-avatar-add"><span class="pp-emoji">＋</span></div>
      <div class="pp-name">Add Profile</div>
    `;
    addBtn.onclick = () => openEditor(null);
    grid.appendChild(addBtn);
  }

  /* ============================================================
     D. Profile editor modal
     ============================================================ */
  function openEditor(profile) {
    const existing = document.getElementById('profileModal');
    if (existing) existing.remove();

    const isNew = !profile;
    const draft = profile
      ? { ...profile }
      : { id: newId(), name: '', avatar: AVATARS[0], color: 'pink', kids: false };

    const modal = document.createElement('div');
    modal.id = 'profileModal';
    modal.className = 'profile-modal';
    modal.innerHTML = `
      <div class="pm-card">
        <h2>${isNew ? 'Add Profile' : 'Edit Profile'}</h2>
        <div class="pm-field">
          <label class="pm-label" for="pmName">Name</label>
          <input class="pm-input" id="pmName" type="text" maxlength="20"
                 placeholder="Enter a name" value="${escapeHtml(draft.name)}">
        </div>
        <div class="pm-field">
          <label class="pm-label">Avatar</label>
          <div class="pm-avatars" id="pmAvatars">
            ${AVATARS.map(a => `
              <button class="pm-avatar${a === draft.avatar ? ' active' : ''}"
                      data-avatar="${a}" type="button">${a}</button>
            `).join('')}
          </div>
        </div>
        <div class="pm-field">
          <label class="pm-label">Accent colour</label>
          <div class="pm-colors" id="pmColors">
            ${Object.entries(ACCENT_MAP).map(([k, a]) => `
              <button class="pm-color${k === draft.color ? ' active' : ''}"
                      data-color="${k}" type="button"
                      style="background:${a.base}" title="${k}"></button>
            `).join('')}
          </div>
        </div>
        <label class="pm-kids">
          <input type="checkbox" id="pmKids" ${draft.kids ? 'checked' : ''}>
          <span>Kids profile</span>
        </label>
        <div class="pm-actions">
          ${!isNew ? '<button class="pm-btn pm-btn-danger" id="pmDelete" type="button">Delete</button>' : ''}
          <button class="pm-btn pm-btn-ghost" id="pmCancel" type="button">Cancel</button>
          <button class="pm-btn pm-btn-primary" id="pmSave" type="button">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const nameInput = modal.querySelector('#pmName');
    nameInput.focus();
    nameInput.select();

    modal.querySelectorAll('.pm-avatar').forEach(btn => {
      btn.onclick = () => {
        draft.avatar = btn.dataset.avatar;
        modal.querySelectorAll('.pm-avatar').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });
    modal.querySelectorAll('.pm-color').forEach(btn => {
      btn.onclick = () => {
        draft.color = btn.dataset.color;
        modal.querySelectorAll('.pm-color').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });
    modal.querySelector('#pmKids').onchange = (e) => { draft.kids = e.target.checked; };

    modal.querySelector('#pmCancel').onclick = () => modal.remove();

    modal.querySelector('#pmSave').onclick = () => {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        nameInput.style.borderColor = '#ff8090';
        return;
      }
      draft.name = name;
      const list = loadProfiles();
      const idx = list.findIndex(p => p.id === draft.id);
      if (idx >= 0) list[idx] = draft;
      else list.push(draft);
      saveProfiles(list);
      modal.remove();

      if (list.length === 1 && !getActiveId()) {
        selectProfile(draft.id);
      } else {
        renderPickerGrid();
        refreshProfileButton();
      }
    };

    const delBtn = modal.querySelector('#pmDelete');
    if (delBtn) {
      delBtn.onclick = () => {
        if (!confirm(`Delete profile "${draft.name}"?`)) return;
        const list = loadProfiles().filter(p => p.id !== draft.id);
        saveProfiles(list);
        modal.remove();

        if (_activeProfileId === draft.id) {
          _activeProfileId = null;
          setActiveId(null);
          try { sessionStorage.removeItem(SS_PICKED); } catch {}
        }
        if (!list.length) showPickerOverlay();
        else { renderPickerGrid(); refreshProfileButton(); }
      };
    }
  }

  /* ============================================================
     E. Profile selection
     ============================================================ */
  function selectProfile(id) {
    const profiles = loadProfiles();
    const p = profiles.find(x => x.id === id);
    if (!p) return;

    _activeProfileId = id;
    setActiveId(id);
    try { sessionStorage.setItem(SS_PICKED, '1'); } catch {}

    applyProfileAccent(p);

    const picker = document.getElementById('profilePicker');
    if (picker) picker.remove();

    refreshProfileButton();

    setTimeout(() => {
      try { if (typeof loadHome === 'function') loadHome(); } catch (e) {}
      try { if (typeof window.refreshPersonalRows === 'function') window.refreshPersonalRows(); } catch {}
    }, 80);
  }

  /* ============================================================
     F. Header profile button
     ============================================================ */
  function refreshProfileButton() {
    const btn = document.getElementById('profileBtn');
    if (!btn) return;
    const profiles = loadProfiles();
    const active = profiles.find(p => p.id === _activeProfileId);
    if (!active) { btn.style.display = 'none'; return; }
    btn.style.display = '';
    btn.style.setProperty('--p-color', COLOR_HEX[active.color] || COLOR_HEX.pink);
    btn.innerHTML = `<span class="pb-avatar">${active.avatar || '👤'}</span>`;
    btn.title = `Signed in as ${active.name} · Switch profile`;
  }

  function injectProfileButton() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('profileBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'profileBtn';
    btn.className = 'profile-btn';
    btn.title = 'Switch profile';
    btn.type = 'button';
    btn.onclick = (e) => { e.stopPropagation(); showProfileMenu(btn); };

    const brand = header.querySelector('.brand');
    if (brand && brand.parentNode === header) {
      brand.insertAdjacentElement('afterend', btn);
    } else {
      header.appendChild(btn);
    }
    refreshProfileButton();
  }

  function showProfileMenu(anchor) {
    const existing = document.getElementById('profileMenu');
    if (existing) { existing.remove(); return; }

    const menu = document.createElement('div');
    menu.id = 'profileMenu';
    menu.className = 'browse-menu';
    const rect = anchor.getBoundingClientRect();
    menu.style.top = (rect.bottom + 8) + 'px';
    menu.style.left = Math.min(rect.left, window.innerWidth - 240) + 'px';
    menu.innerHTML = `
      <div class="browse-item" data-action="switch"><span class="bi-icon">👥</span> Switch Profile</div>
      <div class="browse-item" data-action="manage"><span class="bi-icon">⚙️</span> Manage Profiles</div>
    `;
    document.body.appendChild(menu);

    menu.querySelectorAll('.browse-item').forEach(item => {
      item.onclick = () => {
        const action = item.dataset.action;
        menu.remove();
        if (action === 'switch') showPickerOverlay();
        if (action === 'manage') {
          showPickerOverlay();
          pickerManageMode = true;
          const picker = document.getElementById('profilePicker');
          if (picker) {
            picker.classList.add('manage');
            const mBtn = picker.querySelector('#ppManage');
            if (mBtn) mBtn.textContent = 'Done';
            renderPickerGrid();
          }
        }
      };
    });

    setTimeout(() => {
      document.addEventListener('click', function close(ev) {
        if (!menu.contains(ev.target) && ev.target !== anchor) {
          menu.remove();
          document.removeEventListener('click', close);
        }
      });
    }, 0);
  }

  /* ============================================================
     G. Settings — Profiles card
     ============================================================ */
  function injectProfileSettingsCard() {
    const view = document.getElementById('settings-view');
    if (!view || view.querySelector('#profileSettingsCard')) return;

    const about = view.querySelector('.settings-about');
    const card = document.createElement('div');
    card.id = 'profileSettingsCard';
    card.className = 'settings-card';
    card.innerHTML = `
      <h3>Profiles</h3>
      <div class="settings-row">
        <div class="settings-label">
          <span class="lbl">Manage profiles</span>
          <span class="desc">Each profile has its own watchlist, continue-watching, search history and accent colour.</span>
        </div>
        <button class="pm-btn pm-btn-primary" id="openProfilesBtn"
                style="flex:0 0 auto;padding:10px 22px;font-size:13px;"
                type="button">Manage</button>
      </div>
    `;
    if (about && about.parentNode) about.parentNode.insertBefore(card, about);
    else view.appendChild(card);

    card.querySelector('#openProfilesBtn').onclick = () => showPickerOverlay();
  }

  (function observeSettings() {
    const view = document.getElementById('settings-view');
    if (!view) return;
    const obs = new MutationObserver(() => {
      if (!view.classList.contains('hidden')) injectProfileSettingsCard();
    });
    obs.observe(view, { attributes: true, attributeFilter: ['class'] });
    if (!view.classList.contains('hidden')) injectProfileSettingsCard();
  })();

  /* ============================================================
     H. Profile ↔ accent sync
     ============================================================ */
  document.addEventListener('click', (e) => {
    const sw = e.target.closest && e.target.closest('.accent-swatch-lg');
    if (!sw || !_activeProfileId) return;
    const key = sw.dataset.key;
    if (!key) return;
    const list = loadProfiles();
    const p = list.find(x => x.id === _activeProfileId);
    if (p && p.color !== key) {
      p.color = key;
      saveProfiles(list);
    }
  }, true);

  /* ============================================================
     I. PWA install button
     ============================================================ */
  let deferredInstall = null;
  let installBtnEl = null;

  function showInstallButton() {
    if (installBtnEl || document.getElementById('installBtn')) return;
    const header = document.querySelector('header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.id = 'installBtn';
    btn.className = 'install-btn';
    btn.type = 'button';
    btn.innerHTML = '⬇ Install App';
    btn.onclick = async () => {
      if (!deferredInstall) return;
      try {
        deferredInstall.prompt();
        const choice = await deferredInstall.userChoice;
        if (choice && choice.outcome === 'accepted' && window.zsToast) {
          window.zsToast('Installing…');
        }
      } catch {}
      deferredInstall = null;
      btn.remove();
      installBtnEl = null;
    };
    header.appendChild(btn);
    installBtnEl = btn;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    showInstallButton();
  });
  window.addEventListener('appinstalled', () => {
    if (installBtnEl) { installBtnEl.remove(); installBtnEl = null; }
    if (window.zsToast) window.zsToast('Installed ⭐');
  });

  /* ============================================================
     J. Top 100 — ranked strictly by IMDb rating
     ============================================================ */
  const top100ListCache = { movie: null, tv: null };
  const TOP100_KEY = (t) => `zs_top100_imdb_${t}`;
  const TOP100_TTL = 1000 * 60 * 60 * 24 * 7;

  async function tmdbFast(path, attempt = 0) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `https://api.themoviedb.org/3${path}${sep}api_key=${TMDB_KEY}`;
    const res = await fetch(url);
    if (res.status === 429 && attempt < 4) {
      await new Promise(r => setTimeout(r, 900 * (attempt + 1)));
      return tmdbFast(path, attempt + 1);
    }
    if (!res.ok) throw new Error('TMDB ' + res.status);
    return res.json();
  }

  async function omdbFast(imdbId) {
    if (!imdbId) return null;
    if (imdbCache && imdbCache.has && imdbCache.has(imdbId)) return imdbCache.get(imdbId);
    try {
      const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`);
      const data = await res.json();
      const result = data && data.Response === 'True'
        ? { rating: data.imdbRating, votes: data.imdbVotes, rated: data.Rated }
        : null;
      if (imdbCache && imdbCache.set) imdbCache.set(imdbId, result);
      return result;
    } catch { return null; }
  }

  async function buildTop100List(type, onProgress) {
    if (top100ListCache[type]) return top100ListCache[type];

    try {
      const raw = localStorage.getItem(TOP100_KEY(type));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.items && Date.now() - parsed.ts < TOP100_TTL) {
          top100ListCache[type] = parsed.items;
          return parsed.items;
        }
      }
    } catch {}

    const minVotes = type === 'movie' ? 20000 : 5000;
    const PAGES = [1, 2, 3, 4, 5];
    const poolRaw = await Promise.all(PAGES.map(p =>
      tmdbFast(`/discover/${type}?sort_by=vote_average.desc&vote_count.gte=${minVotes}&page=${p}`)
        .catch(() => ({ results: [] }))
    ));

    const seen = new Set();
    const pool = [];
    poolRaw.forEach(r => (r.results || []).forEach(item => {
      if (!item.poster_path) return;
      if (seen.has(item.id)) return;
      seen.add(item.id);
      pool.push(item);
    }));

    const CONC = 4;
    let cursor = 0;
    let done = 0;
    const enriched = new Array(pool.length);

    async function worker() {
      while (true) {
        const i = cursor++;
        if (i >= pool.length) return;
        const item = pool[i];
        let imdb = 0, votes = null;
        try {
          const det = await tmdbFast(`/${type}/${item.id}?append_to_response=external_ids`);
          const imdbId = det && det.external_ids && det.external_ids.imdb_id;
          if (imdbId) {
            const r = await omdbFast(imdbId);
            if (r && r.rating && r.rating !== 'N/A') {
              imdb = parseFloat(r.rating) || 0;
              votes = r.votes || null;
            }
          }
        } catch (e) {}
        enriched[i] = { ...item, __imdb: imdb, __imdbVotes: votes };
        done++;
        if (onProgress) onProgress(done, pool.length);
      }
    }

    await Promise.all(Array.from({ length: CONC }, worker));

    const sorted = enriched
      .filter(x => x && x.__imdb > 0)
      .sort((a, b) => b.__imdb - a.__imdb || (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 100);

    top100ListCache[type] = sorted;
    try { localStorage.setItem(TOP100_KEY(type), JSON.stringify({ items: sorted, ts: Date.now() })); } catch {}

    return sorted;
  }

  function makeTop100CardImdb(item, rank, type) {
    const card = document.createElement('div');
    card.className = 'top100-card';
    card.__zsItemId = item.id;

    const title = item.title || item.name || 'Untitled';
    const year  = (item.release_date || item.first_air_date || '').slice(0, 4);
    const poster = item.poster_path
      ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
      : null;
    const imdb  = item.__imdb > 0 ? item.__imdb.toFixed(1) : null;

    card.innerHTML = `
      <div class="top100-poster">
        ${poster
          ? `<img src="${poster}" alt="${escapeHtml(title)}" loading="lazy" />`
          : `<div class="poster-fallback">🎬</div>`}
        <div class="rank-badge">${rank}</div>
        <div class="imdb-badge${imdb ? '' : ' empty'}">
          <span class="star">★</span> ${imdb || '—'}
        </div>
      </div>
      <div class="top100-info">
        <div class="top100-title">${escapeHtml(title)}</div>
        <div class="top100-meta">
          ${year ? year + ' · ' : ''}${type === 'tv' ? 'TV' : 'Movie'}
        </div>
      </div>
    `;

    card.onclick = () => loadPlayer(type, item.id, 1, 1, title);
    card.addEventListener('mouseenter', () => handleCardHover(card, type, item));
    card.addEventListener('mouseleave', scheduleHide);

    return card;
  }

  loadTop100Page = async function (page) {
    top100State.page = page;
    const grid = document.getElementById('top100Grid');
    const sub  = document.getElementById('top100Sub');
    if (!grid) return;

    grid.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const s = document.createElement('div');
      s.className = 'skeleton';
      s.style.cssText = 'height:auto;aspect-ratio:2/3;border-radius:12px;';
      grid.appendChild(s);
    }

    try {
      const list = await buildTop100List(top100State.type, (done, total) => {
        if (sub) sub.textContent = `Ranking by IMDb… ${done}/${total}`;
      });

      if (sub) sub.textContent = top100State.type === 'tv'
        ? 'Ranked by IMDb rating · Series'
        : 'Ranked by IMDb rating · Films';

      grid.innerHTML = '';
      const start = (page - 1) * 20;
      const slice = list.slice(start, start + 20);

      if (!slice.length) {
        grid.innerHTML = '<div class="random-empty">No titles found.</div>';
        return;
      }

      slice.forEach((item, i) => {
        grid.appendChild(makeTop100CardImdb(item, start + i + 1, top100State.type));
      });

      const totalPages = Math.max(1, Math.ceil(list.length / 20));
      renderPagination(Math.min(totalPages, 5));
    } catch (err) {
      console.error('Top 100 failed:', err);
      grid.innerHTML = '<div class="random-empty">Something went wrong loading the list.</div>';
    }
  };

  /* ============================================================
     K. Boot
     ============================================================ */
  (function bootProfiles() {
    const profiles = loadProfiles();
    const activeId = getActiveId();
    const picked = (() => { try { return sessionStorage.getItem(SS_PICKED); } catch { return null; } })();

    if (profiles.length && picked && activeId && profiles.some(p => p.id === activeId)) {
      _activeProfileId = activeId;
      const p = profiles.find(x => x.id === activeId);
      applyProfileAccent(p);
      injectProfileButton();
    } else {
      showPickerOverlay();
      injectProfileButton();
    }
  })();

})();

/* ============================================================
   ZARA'S CUSTOM v17 — polish
   - Settings gear pinned to far right (CSS order 999 + DOM fallback)
   - Profile dropdown trimmed to "Switch Profile" only
   - Player view: strip stray debug / settings UI
   - Auto-pause the video when the page loses focus
   ============================================================ */
(function () {
  if (window.__zsCustomV17) return;
  window.__zsCustomV17 = true;

  /* ---------- 1. Pin Settings gear to the end of the header ---------- */
  function pinSettingsToEnd() {
    const header = document.querySelector('header');
    const gear   = document.getElementById('settingsBtn');
    if (!header || !gear) return;
    if (header.lastElementChild !== gear) header.appendChild(gear);
  }
  // Run a couple of times to catch late injections (install button, etc.)
  setTimeout(pinSettingsToEnd, 200);
  setTimeout(pinSettingsToEnd, 800);
  setTimeout(pinSettingsToEnd, 2000);

  /* ---------- 2. Prune "Manage Profiles" from the avatar dropdown ---------- */
  function pruneProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (!menu) return;
    const manage = menu.querySelector('[data-action="manage"]');
    if (manage) manage.remove();
  }
  new MutationObserver(() => pruneProfileMenu())
    .observe(document.body, { childList: true, subtree: false });
  pruneProfileMenu();

  /* ---------- 3. Clean the player view of debug / settings UI ---------- */
  function cleanPlayerView() {
    const pv = document.getElementById('player-view');
    if (!pv) return;

    // Kill the legacy debug row (type/id/season/episode/Load/Play/Pause)
    const controls = pv.querySelector('.controls-row');
    if (controls) controls.remove();

    // Remove any stray settings elements that ended up inside the player view.
    // Note: #settings-view is a sibling of #player-view, not a child — if it
    // somehow became a child, we'd have bigger problems. Only remove elements
    // that clearly belong to the settings UI and are sitting inside the player.
    pv.querySelectorAll('.settings-btn, .settings-card, [data-settings]').forEach(el => el.remove());
  }
  cleanPlayerView();
  setTimeout(cleanPlayerView, 500);

  const _prevLoadPlayerV17 = loadPlayer;
  loadPlayer = function (type, id, s, e, title) {
    _prevLoadPlayerV17(type, id, s, e, title);
    setTimeout(cleanPlayerView, 0);
  };

  /* ---------- 4. Auto-pause when the page loses focus ---------- */
  let playerIsPlaying = false;

  // Track whether the CineSrc player is actually playing
  window.addEventListener('message', (e) => {
    if (e.origin !== ORIGIN) return;
    const d = e.data || {};
    if      (d.type === 'cinesrc:play')  playerIsPlaying = true;
    else if (d.type === 'cinesrc:pause') playerIsPlaying = false;
    else if (d.type === 'cinesrc:close') playerIsPlaying = false;
  });

  function isPlayerViewOpen() {
    const pv = document.getElementById('player-view');
    return pv && !pv.classList.contains('hidden');
  }

  function pauseIfPlaying() {
    if (!playerIsPlaying) return;
    if (!isPlayerViewOpen()) return;
    try { sendCommand('pause'); } catch (err) {}
    playerIsPlaying = false; // optimistic — the player will also echo cinesrc:pause
  }

  // Tab / window hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') pauseIfPlaying();
  }, { passive: true });

  // Window focus lost (clicked onto another app / monitor / the desktop)
  let blurTimer = null;
  window.addEventListener('blur', () => {
    clearTimeout(blurTimer);
    blurTimer = setTimeout(() => {
      // If the user is just interacting with the cross-origin iframe,
      // activeElement will be the iframe — don't pause in that case.
      const ae = document.activeElement;
      if (ae && ae.tagName === 'IFRAME') return;
      // If the tab is hidden, visibilitychange already handled it.
      if (document.visibilityState === 'hidden') return;
      pauseIfPlaying();
    }, 250);
  });

  window.addEventListener('focus', () => {
    clearTimeout(blurTimer);
  });

})();

/* ============================================================
   ZARA'S CUSTOM v18 — site refresh button
   Hard-reloads the app, bypassing the service worker cache so
   you always get the freshest index.html / app.js / styles.css.
   ============================================================ */
(function () {
  if (window.__zsCustomV18) return;
  window.__zsCustomV18 = true;

  function injectRefreshButton() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('refreshAppBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'refreshAppBtn';
    btn.className = 'refresh-app-btn';
    btn.title = 'Refresh app';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Refresh app');
    btn.innerHTML = '<span class="ra-icon">↻</span>';

    btn.onclick = async () => {
      btn.classList.add('spinning');
      try {
        if (window.zsToast) window.zsToast('Refreshing…');

        if ('serviceWorker' in navigator) {
          try {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r =>
              caches.keys().then(keys =>
                Promise.all(keys.map(k => caches.delete(k)))
              )
            ));
          } catch (err) { /* non-fatal */ }
        }

        setTimeout(() => {
          const url = new URL(location.href);
          url.searchParams.set('_r', Date.now());
          location.replace(url.toString());
        }, 180);
      } catch (err) {
        location.reload();
      }
    };

    const gear = document.getElementById('settingsBtn');
    if (gear && gear.parentNode === header) {
      header.insertBefore(btn, gear);
    } else {
      header.appendChild(btn);
    }
  }

  injectRefreshButton();
  setTimeout(injectRefreshButton, 300);
  setTimeout(injectRefreshButton, 1200);

})();

/* ============================================================
   ZARA'S CUSTOM v19 — Kids content filter + orphan purge
   - Kids profiles get PG-13 (movies) / TV-PG (TV) certification caps,
     Horror blocked, adult titles blocked, autocomplete filtered.
   - Deleting a profile hard-purges its namespaced localStorage keys.
   - Small "Kids" pill appears next to the brand when kids mode is on.
   ============================================================ */
(function () {
  if (window.__zsCustomV19) return;
  window.__zsCustomV19 = true;

  /* ---------- 1. Read the active profile (no closure leak) ---------- */
  function getActiveProfile() {
    try {
      const id = localStorage.getItem('zs_active_profile');
      if (!id) return null;
      const list = JSON.parse(localStorage.getItem('zs_profiles') || '[]');
      return list.find(p => p.id === id) || null;
    } catch { return null; }
  }
  function isKidsMode() {
    const p = getActiveProfile();
    return !!(p && p.kids);
  }

  /* ---------- 2. Rewrite tmdb() calls when kids mode is active ---------- */
  const KID_CERT_MOVIE = 'PG-13';
  const KID_CERT_TV = 'TV-PG';
  const BLOCKED_GENRES = '27'; // Horror

  const TMDB_ENDPOINT_SWAPS = {
    '/trending/all/week': { newBase: '/discover/movie', extra: { sort_by: 'popularity.desc', 'vote_count.gte': '200' } },
    '/movie/popular':     { newBase: '/discover/movie', extra: { sort_by: 'popularity.desc', 'vote_count.gte': '500' } },
    '/movie/top_rated':   { newBase: '/discover/movie', extra: { sort_by: 'vote_average.desc', 'vote_count.gte': '2000' } },
    '/movie/upcoming':    { newBase: '/discover/movie', extra: { sort_by: 'popularity.desc', 'vote_count.gte': '50' } },
    '/movie/now_playing': { newBase: '/discover/movie', extra: { sort_by: 'popularity.desc', 'vote_count.gte': '50' } },
    '/tv/popular':        { newBase: '/discover/tv',    extra: { sort_by: 'popularity.desc', 'vote_count.gte': '200' } },
    '/tv/airing_today':   { newBase: '/discover/tv',    extra: { sort_by: 'popularity.desc' } },
  };

  const _prevTmdbV19 = tmdb;
  tmdb = function (path) {
    if (!isKidsMode()) return _prevTmdbV19(path);

    let p = path;
    const [base, query] = p.split('?');
    const params = new URLSearchParams(query || '');

    const swap = TMDB_ENDPOINT_SWAPS[base];
    if (swap) {
      const merged = Object.fromEntries(params);
      Object.assign(merged, swap.extra);
      p = swap.newBase + '?' + new URLSearchParams(merged).toString();
    }

    // Inject certification + genre blocks
    const [base2, query2] = p.split('?');
    const params2 = new URLSearchParams(query2 || '');
    const isTV = /\/tv\b|\/discover\/tv/.test(base2);

    params2.set('certification_country', 'US');
    params2.set('certification.lte', isTV ? KID_CERT_TV : KID_CERT_MOVIE);

    const existing = params2.get('without_genres');
    params2.set(
      'without_genres',
      existing ? existing + ',' + BLOCKED_GENRES : BLOCKED_GENRES
    );

    return _prevTmdbV19(base2 + '?' + params2.toString());
  };

  /* ---------- 3. Filter autocomplete results ---------- */
  const _origFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!isKidsMode() || !/search\/multi/.test(url)) {
      return _origFetch(input, init);
    }
    try {
      const res = await _origFetch(input, init);
      const data = await res.clone().json();
      data.results = (data.results || []).filter(r =>
        !r.adult && !(r.genre_ids || []).includes(27)
      );
      return new Response(JSON.stringify(data), {
        status: res.status,
        statusText: res.statusText,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return _origFetch(input, init);
    }
  };

  /* ---------- 4. Kids-mode search (filtered) ---------- */
  const _prevRunSearchV19 = runSearch;
  runSearch = async function () {
    if (!isKidsMode()) return _prevRunSearchV19();

    const q = searchInput.value.trim();
    if (!q) return;

    heroEl.innerHTML = '';
    rowsEl.innerHTML = '';
    rowsEl.appendChild(makeSkeletonRow(`Searching "${q}"...`));

    try {
      const [mov, tv] = await Promise.all([
        tmdb(`/search/movie?query=${encodeURIComponent(q)}`).catch(() => ({ results: [] })),
        tmdb(`/search/tv?query=${encodeURIComponent(q)}`).catch(() => ({ results: [] })),
      ]);
      const all = [...(mov.results || []), ...(tv.results || [])]
        .filter(r => !r.adult)
        .filter(r => !(r.genre_ids || []).includes(27))
        .filter(r => r.poster_path)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      rowsEl.innerHTML = '';
      if (!all.length) {
        rowsEl.innerHTML = `<div class="row"><h2 class="row-title">No results</h2><div style="color:var(--muted)">Nothing kid-safe matched "${esc(q)}".</div></div>`;
        return;
      }
      rowsEl.appendChild(makeRow(`Results for "${q}"`, all));
    } catch (err) {
      rowsEl.innerHTML = `<div class="row"><h2 class="row-title">Error</h2><div style="color:var(--muted)">${esc(err.message)}</div></div>`;
    }
  };

  /* ---------- 5. Hard-purge orphaned profile keys ---------- */
  function purgeOrphanedProfileKeys() {
    try {
      const profiles = JSON.parse(localStorage.getItem('zs_profiles') || '[]');
      const validIds = new Set(profiles.map(p => p.id));

      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const m = key.match(/^(zs_[a-z_]+)::(p_[a-z0-9]+)$/i);
        if (m && !validIds.has(m[2])) toRemove.push(key);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
      if (toRemove.length) {
        console.log('[ZS] Purged', toRemove.length, 'orphaned profile key(s)');
      }
    } catch (err) {
      console.warn('[ZS] Purge failed:', err);
    }
  }

  // Run on boot (after v16 has saved/loaded profiles)
  setTimeout(purgeOrphanedProfileKeys, 2000);
  setTimeout(purgeOrphanedProfileKeys, 5000);

  // Also purge right after any Delete-profile click
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'pmDelete') {
      setTimeout(purgeOrphanedProfileKeys, 150);
      setTimeout(purgeOrphanedProfileKeys, 800);
    }
  }, true);

  /* ---------- 6. Kids-mode indicator pill in the header ---------- */
  function refreshKidsPill() {
    const header = document.querySelector('header');
    if (!header) return;
    let pill = document.getElementById('kidsPill');

    if (!isKidsMode()) {
      if (pill) pill.remove();
      return;
    }

    if (!pill) {
      pill = document.createElement('span');
      pill.id = 'kidsPill';
      pill.className = 'kids-pill';
      pill.textContent = '🧒 Kids';
      pill.title = 'Kids mode active — mature content is filtered';
      const brand = header.querySelector('.brand');
      if (brand && brand.parentNode === header) {
        brand.insertAdjacentElement('afterend', pill);
      } else {
        header.appendChild(pill);
      }
    }
  }

  // Run now and also watch for profile changes
  refreshKidsPill();
  setInterval(refreshKidsPill, 1500);

  console.log('[ZS] v19 — kids filter + orphan purge active');
})();

/* ============================================================
   ZARA'S CUSTOM v20 — multi-source player with auto-fallback
   - Source picker in the player bar (CineSrc / VidSrc / 2Embed / MultiEmbed)
   - Auto-fallback from CineSrc to VidSrc if no "ready" message in 15s
   - Remembers last-chosen source in localStorage
   ============================================================ */
(function () {
  if (window.__zsCustomV20) return;
  window.__zsCustomV20 = true;

  const LS_SOURCE = 'zs_player_source';
  const READY_TIMEOUT = 15000;

  const SOURCES = [
    { key: 'cinesrc', label: 'CineSrc' },
    { key: 'vidsrc',  label: 'VidSrc' },
    { key: '2embed',  label: '2Embed' },
    { key: 'multi',   label: 'MultiEmbed' },
  ];

  function getStoredSource() {
    try { return localStorage.getItem(LS_SOURCE) || 'cinesrc'; }
    catch { return 'cinesrc'; }
  }
  function setStoredSource(key) {
    try { localStorage.setItem(LS_SOURCE, key); } catch {}
  }

  let currentRequest = null;   // { type, id, season, episode, title }
  let currentSourceKey = null;
  let fallbackTimer = null;

  // The CineSrc URL chain (accent + autoskip + resume) as it was before v20
  const cinesrcUrl = buildUrl;

  function buildForSource(key, type, id, season, episode) {
    if (key === 'cinesrc') {
      return cinesrcUrl(type, id, season, episode);
    }
    const s = season || 1, e = episode || 1;
    if (key === 'vidsrc') {
      return type === 'movie'
        ? `https://vidsrc.to/embed/movie/${id}`
        : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`;
    }
    if (key === '2embed') {
      return type === 'movie'
        ? `https://www.2embed.cc/embed/${id}`
        : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`;
    }
    if (key === 'multi') {
      return type === 'movie'
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`;
    }
    return cinesrcUrl(type, id, season, episode);
  }

  // Every loader (clicks, router, next episode) now gets the chosen source directly
  buildUrl = function (type, id, season, episode) {
    return buildForSource(getStoredSource(), type, id, season, episode);
  };

  function armFallback(req) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
    if (currentSourceKey !== 'cinesrc') return;
    fallbackTimer = setTimeout(() => {
      if (currentRequest !== req) return;
      if (currentSourceKey !== 'cinesrc') return;
      if (typeof window.zsToast === 'function') {
        window.zsToast('CineSrc slow — trying VidSrc…');
      }
      applySource('vidsrc');
    }, READY_TIMEOUT);
  }

  function applySource(key, { silent = false } = {}) {
    if (!currentRequest) return;
    currentSourceKey = key;

    const req = currentRequest;
    const url = buildForSource(key, req.type, req.id, req.season, req.episode);
    iframe.src = url;

    // Update the picker UI if present
    const sel = document.getElementById('sourceSelect');
    if (sel && sel.value !== key) sel.value = key;

    // Only CineSrc sends postMessages. Watch for its ready signal.
    armFallback(req);
  }

  /* Cancel fallback when CineSrc says it's ready */
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://cinesrc.st') return;
    const d = event.data || {};
    if (d.type === 'cinesrc:ready') {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  });

  /* Wrap loadPlayer */
  const _prevLoadPlayerV20 = loadPlayer;
  loadPlayer = function (type, id, season, episode, title) {
    _prevLoadPlayerV20(type, id, season, episode, title);
    currentRequest = {
      type, id,
      season: season || 1,
      episode: episode || 1,
      title: title || '',
    };
    // The iframe was already pointed at the chosen source via buildUrl
    currentSourceKey = getStoredSource();
    const sel = document.getElementById('sourceSelect');
    if (sel) sel.value = currentSourceKey;
    armFallback(currentRequest);
  };

  /* Source picker in the player bar */
  function injectSourcePicker() {
    const playerBar = document.querySelector('.player-bar');
    if (!playerBar || document.getElementById('sourcePicker')) return;

    const wrap = document.createElement('div');
    wrap.id = 'sourcePicker';
    wrap.className = 'source-picker';
    wrap.innerHTML = `
      <label class="sp-label" for="sourceSelect">Source</label>
      <select id="sourceSelect" class="sp-select" aria-label="Playback source">
        ${SOURCES.map(s => `
          <option value="${s.key}" ${s.key === getStoredSource() ? 'selected' : ''}>${s.label}</option>
        `).join('')}
      </select>
    `;
    playerBar.appendChild(wrap);

    wrap.querySelector('#sourceSelect').onchange = (e) => {
      const key = e.target.value;
      setStoredSource(key);
      if (typeof window.zsToast === 'function') {
        window.zsToast('Source: ' + key);
      }
      applySource(key);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSourcePicker);
  } else {
    injectSourcePicker();
  }
  setTimeout(injectSourcePicker, 400);
  setTimeout(injectSourcePicker, 1200);

  console.log('[ZS] v20 — multi-source player with auto-fallback ready');
})();

/* ============================================================
   ZARA'S CUSTOM v22 — kids playback gate
   Kids profiles can only start titles rated G/PG/PG-13 (movies)
   or up to TV-PG (TV). Covers every entry point, including
   Similar titles, person pages, collections and #/watch links.
   ============================================================ */
(function () {
  if (window.__zsCustomV22) return;
  window.__zsCustomV22 = true;

  const MOVIE_OK = new Set(['G', 'PG', 'PG-13']);
  const TV_OK = new Set(['TV-Y', 'TV-Y7', 'TV-Y7-FV', 'TV-G', 'TV-PG']);
  const verdicts = new Map();

  function isKidsMode() {
    try {
      const id = localStorage.getItem('zs_active_profile');
      if (!id) return false;
      const list = JSON.parse(localStorage.getItem('zs_profiles') || '[]');
      const p = list.find(x => x.id === id);
      return !!(p && p.kids);
    } catch { return false; }
  }

  async function isKidSafe(type, id) {
    const key = `${type}:${id}`;
    if (verdicts.has(key)) return verdicts.get(key);
    let ok = false;
    try {
      let cert = '';
      if (type === 'movie') {
        const data = await tmdb(`/movie/${id}/release_dates`);
        const us = (data.results || []).find(r => r.iso_3166_1 === 'US');
        const certs = (us?.release_dates || []).map(r => r.certification).filter(Boolean);
        cert = certs[0] || '';
        ok = cert ? MOVIE_OK.has(cert) : false;
      } else {
        const data = await tmdb(`/tv/${id}/content_ratings`);
        const us = (data.results || []).find(r => r.iso_3166_1 === 'US');
        cert = us?.rating || '';
        ok = cert ? TV_OK.has(cert) : false;
      }
      if (!cert) {
        // Unrated in the US: allow only non-adult, non-horror titles
        const d = await tmdb(`/${type}/${id}`);
        ok = !d.adult && !(d.genres || []).some(g => g.id === 27);
      }
    } catch { ok = false; }
    verdicts.set(key, ok);
    return ok;
  }

  function blocked() {
    if (typeof window.zsToast === 'function') window.zsToast('Not available on a Kids profile');
  }

  const _prevLoadPlayerV22 = loadPlayer;
  loadPlayer = function (type, id, season, episode, title) {
    if (!isKidsMode()) return _prevLoadPlayerV22(type, id, season, episode, title);
    isKidSafe(type, id).then(ok => {
      if (ok) _prevLoadPlayerV22(type, id, season, episode, title);
      else blocked();
    });
  };

  // Deep links (#/watch/...) go through the router, not loadPlayer
  async function checkWatchRoute() {
    if (!isKidsMode()) return;
    const m = (location.hash || '').match(/^#\/watch\/(movie|tv)\/(\d+)/);
    if (!m) return;
    const ok = await isKidSafe(m[1], Number(m[2]));
    if (!ok) { iframe.src = 'about:blank'; blocked(); window.showHome(); }
  }
  window.addEventListener('hashchange', checkWatchRoute);
  window.addEventListener('popstate', checkWatchRoute);
  setTimeout(checkWatchRoute, 300);
})();
