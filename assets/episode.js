const TAG_LABELS = {
  gastro: 'Gastronomía',
  cine: 'Cine',
  historia: 'Historia',
  ciencia: 'Ciencia',
  mundo: 'Mundo'
};

function tagHtml(tags) {
  return tags.map(t => `<span class="tag tag-${t}">${TAG_LABELS[t] || t}</span>`).join('');
}

function paragraphs(text) {
  return text.split(/\n\n+/).filter(Boolean).map(p => `<p>${p.trim()}</p>`).join('');
}

function render(ep) {
  document.title = `${ep.title} — El Archivo de Bolito`;
  document.getElementById('breadcrumb-title').textContent = ep.title;

  const audioBlock = ep.audioFile ? `
    <div class="audio-block">
      <span class="audio-label">Escuchar episodio</span>
      <audio controls preload="metadata">
        <source src="audio/${ep.audioFile}" type="audio/ogg; codecs=opus">
        <source src="audio/${ep.audioFile}" type="audio/mp4">
        Tu navegador no soporta audio HTML5.
      </audio>
    </div>
  ` : '';

  const transcriptBlock = ep.transcript ? `
    <div class="transcript-section">
      <button class="transcript-toggle" id="transcript-toggle">Leer transcripción completa</button>
      <div class="transcript-body" id="transcript-body">
        ${paragraphs(ep.transcript)}
      </div>
    </div>
  ` : '';

  document.getElementById('episode-page').innerHTML = `
    <div class="ep-tags" style="margin-bottom:1rem">${tagHtml(ep.tags)}</div>
    <h1>${ep.title}</h1>
    <p class="episode-meta">${ep.date}</p>

    ${audioBlock}

    <div class="summary-section">
      <span class="section-label">Resumen</span>
      <div class="lang-tabs">
        <button class="lang-tab active" data-lang="es">Español</button>
        <button class="lang-tab" data-lang="en">English</button>
      </div>
      <div class="lang-tab-content active" id="summary-es">
        <div class="summary-text">${paragraphs(ep.summaryEs)}</div>
      </div>
      <div class="lang-tab-content" id="summary-en">
        <div class="summary-text">${paragraphs(ep.summaryEn)}</div>
      </div>
    </div>

    ${transcriptBlock}

    <div style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--border);">
      <a href="index.html" style="font-size:15px;color:var(--text-muted);">← Volver a todos los episodios</a>
    </div>
  `;

  // Lang tabs
  document.querySelectorAll('.lang-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.lang-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`summary-${tab.dataset.lang}`).classList.add('active');
    });
  });

  // Transcript toggle
  const toggleBtn = document.getElementById('transcript-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const body = document.getElementById('transcript-body');
      body.classList.toggle('open');
      toggleBtn.textContent = body.classList.contains('open')
        ? 'Ocultar transcripción'
        : 'Leer transcripción completa';
    });
  }
}

// Get episode id from URL
const params = new URLSearchParams(window.location.search);
const id = params.get('id');

if (!id) {
  document.getElementById('episode-page').innerHTML =
    '<p class="no-results">Episodio no encontrado. <a href="index.html">Volver al inicio</a></p>';
} else {
  fetch(`episodes/${id}.json`)
    .then(r => {
      if (!r.ok) throw new Error('Not found');
      return r.json();
    })
    .then(render)
    .catch(() => {
      document.getElementById('episode-page').innerHTML =
        '<p class="no-results">Episodio no encontrado. <a href="index.html">Volver al inicio</a></p>';
    });
}
