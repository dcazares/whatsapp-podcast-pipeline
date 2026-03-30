const TAG_LABELS = {
  gastro: 'Gastronomía',
  cine: 'Cine',
  historia: 'Historia',
  ciencia: 'Ciencia',
  mundo: 'Mundo'
};

let allEpisodes = [];
let activeFilter = 'all';

function tagHtml(tags) {
  return tags.map(t => `<span class="tag tag-${t}">${TAG_LABELS[t] || t}</span>`).join('');
}

function render() {
  const query = document.getElementById('search').value.toLowerCase();
  const list = document.getElementById('episode-list');

  const filtered = allEpisodes
    .filter(ep => !ep.private)
    .filter(ep => activeFilter === 'all' || ep.tags.includes(activeFilter))
    .filter(ep => {
      if (!query) return true;
      return ep.title.toLowerCase().includes(query) ||
             ep.summaryEs.toLowerCase().includes(query) ||
             ep.summaryEn.toLowerCase().includes(query);
    });

  if (!filtered.length) {
    list.innerHTML = '<p class="no-results">No se encontraron episodios.</p>';
    return;
  }

  // Show newest first
  const sorted = [...filtered].reverse();

  list.innerHTML = sorted.map((ep, i) => `
    <a class="episode-card" href="episode.html?id=${ep.id}">
      <div class="ep-num">${String(sorted.length - i).padStart(2, '0')}</div>
      <div>
        <div class="ep-tags">${tagHtml(ep.tags)}</div>
        <div class="ep-title">${ep.title}</div>
        <p class="ep-excerpt">${ep.summaryEs}</p>
        <p class="ep-date">${ep.date}</p>
      </div>
    </a>
  `).join('');
}

function renderSidebar(episodes) {
  const pub = episodes.filter(e => !e.private);
  document.getElementById('header-count').textContent = `${pub.length} episodios en el archivo`;
  document.getElementById('stat-total').textContent = pub.length;

  // Earliest date
  const dates = pub.map(e => e.date).filter(Boolean).sort();
  if (dates.length) {
    const year = dates[0].match(/\d{4}/)?.[0] || '2025';
    document.getElementById('stat-since').textContent = year;
  }

  // Series counts
  const counts = {};
  pub.forEach(ep => ep.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));

  document.getElementById('series-list').innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, n]) => `
      <div class="series-item" onclick="setFilter('${tag}')">
        <span class="series-name">${TAG_LABELS[tag] || tag}</span>
        <span class="series-count">${n} ep.</span>
      </div>
    `).join('');
}

function setFilter(tag) {
  activeFilter = tag;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === tag);
  });
  render();
}

// Wire up filters
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

document.getElementById('search').addEventListener('input', render);

// Load data
fetch('episodes/data.json')
  .then(r => r.json())
  .then(data => {
    allEpisodes = data;
    renderSidebar(data);
    render();
  })
  .catch(() => {
    document.getElementById('episode-list').innerHTML =
      '<p class="no-results">No se pudieron cargar los episodios.</p>';
  });
