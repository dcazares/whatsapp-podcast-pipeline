/**
 * add_episode.js
 * 
 * Reads a summary txt file, generates a bolito-NNN.json episode file,
 * updates episodes/data.json, copies the audio file, and pushes to GitHub.
 *
 * Usage: node add_episode.js <summary_file.txt> [--private]
 * Example: node add_episode.js ~/Desktop/Dad\ Podcasts/abc123_summary.txt
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_DIR = '/Users/dcazares/personal-projects/whatsapp-podcast-pipeline';
const PODCASTS_DIR = '/Users/dcazares/Desktop/Dad Podcasts';
const AUDIO_SOURCE = '/Users/dcazares/Desktop/WhatsApp Audio/120363318556235233@g.us';
const EPISODES_DIR = path.join(REPO_DIR, 'episodes');
const AUDIO_DIR = path.join(REPO_DIR, 'audio');
const DATA_FILE = path.join(EPISODES_DIR, 'data.json');

const args = process.argv.slice(2);
const isPrivate = args.includes('--private');
const summaryArg = args.find(a => !a.startsWith('--'));

if (!summaryArg) {
  // No argument — process all untracked summaries
  processAll();
} else {
  const summaryPath = summaryArg.startsWith('/') ? summaryArg : path.join(PODCASTS_DIR, summaryArg);
  processSingle(summaryPath, isPrivate);
}

function detectTags(title) {
  const t = title.toLowerCase();
  const tags = [];
  if (/gastronom|cantina|bar|bebida|comida|restaurante|pulque|cerveza|cocina|aliment|botana|porfiriato/.test(t)) tags.push('gastro');
  if (/cine|película|actor|actriz|director|cinemat|época de oro|armendáriz|cantinflas/.test(t)) tags.push('cine');
  if (/historia|independencia|revolución|colonial|virrein|moreno|mina|cleopatra/.test(t)) tags.push('historia');
  if (/nobel|tesla|médico|enfermera|ciencia|inventor|industri/.test(t)) tags.push('ciencia');
  if (/mundial|fútbol|soccer|mundo|egipto|sueco|serbio/.test(t)) tags.push('mundo');
  return tags.length ? tags : ['historia'];
}

function parseSummary(content) {
  const titleMatch = content.match(/TÍTULO \/ TITLE:\s*(.+)/);
  const dateMatch = content.match(/FECHA \/ DATE:\s*(.+)/);
  const esMatch = content.match(/RESUMEN \(Español\):\s*([\s\S]+?)(?=SUMMARY \(English\)|---)/);
  const enMatch = content.match(/SUMMARY \(English\):\s*([\s\S]+?)(?=---|TRANSCRIPCIÓN)/);
  const transcriptMatch = content.match(/TRANSCRIPCIÓN LIMPIA \/ CLEAN TRANSCRIPT:\s*([\s\S]+)$/);

  return {
    title: titleMatch ? titleMatch[1].trim() : 'Sin título',
    date: dateMatch ? dateMatch[1].trim() : '',
    summaryEs: esMatch ? esMatch[1].trim() : '',
    summaryEn: enMatch ? enMatch[1].trim() : '',
    transcript: transcriptMatch ? transcriptMatch[1].trim() : ''
  };
}

function nextId() {
  fs.mkdirSync(EPISODES_DIR, { recursive: true });
  const existing = fs.readdirSync(EPISODES_DIR)
    .filter(f => f.match(/^bolito-\d+\.json$/))
    .map(f => parseInt(f.match(/\d+/)[0]))
    .sort((a, b) => a - b);
  const next = existing.length ? existing[existing.length - 1] + 1 : 1;
  return String(next).padStart(3, '0');
}

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  return [];
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function findAudioFile(summaryPath) {
  const base = path.basename(summaryPath).replace('_summary.txt', '');
  for (const ext of ['.opus', '.m4a', '.mp4']) {
    const candidate = path.join(AUDIO_SOURCE, base + ext);
    if (fs.existsSync(candidate)) return { src: candidate, ext };
  }
  return null;
}

function processSingle(summaryPath, isPrivate) {
  if (!fs.existsSync(summaryPath)) {
    console.error(`File not found: ${summaryPath}`);
    process.exit(1);
  }

  // Check if already tracked
  const data = loadData();
  const summaryName = path.basename(summaryPath);
  if (data.find(ep => ep.sourceFile === summaryName)) {
    console.log(`Already tracked: ${summaryName}`);
    return;
  }

  const content = fs.readFileSync(summaryPath, 'utf8');
  const parsed = parseSummary(content);
  const id = nextId();
  const epId = `bolito-${id}`;

  // Copy audio file
  let audioFile = null;
  const audio = findAudioFile(summaryPath);
  if (audio) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
    const dest = path.join(AUDIO_DIR, `${epId}${audio.ext}`);
    fs.copyFileSync(audio.src, dest);
    audioFile = `${epId}${audio.ext}`;
    console.log(`Copied audio → audio/${audioFile}`);
  } else {
    console.log(`No audio file found for ${summaryName}`);
  }

  // Build episode JSON
  const episode = {
    id: epId,
    title: parsed.title,
    date: parsed.date,
    tags: detectTags(parsed.title),
    summaryEs: parsed.summaryEs,
    summaryEn: parsed.summaryEn,
    transcript: parsed.transcript,
    audioFile,
    private: isPrivate,
    sourceFile: summaryName,
    addedAt: new Date().toISOString()
  };

  // Save individual episode JSON
  fs.writeFileSync(path.join(EPISODES_DIR, `${epId}.json`), JSON.stringify(episode, null, 2));
  console.log(`Created episodes/${epId}.json`);

  // Update data.json (lightweight index — no transcript)
  const index = { ...episode };
  delete index.transcript;
  data.push(index);
  saveData(data);
  console.log(`Updated episodes/data.json (${data.length} total)`);

  // Push to GitHub
  try {
    execSync(
      `git add episodes/ audio/ && git commit -m "Add episode: ${parsed.title}" && git push`,
      { cwd: REPO_DIR, stdio: 'inherit' }
    );
    console.log(`\nLive at: https://dcazares.github.io/whatsapp-podcast-pipeline/episode.html?id=${epId}`);
  } catch(e) {
    console.log('Git push failed or nothing to commit');
  }
}

function processAll() {
  const data = loadData();
  const tracked = new Set(data.map(ep => ep.sourceFile));

  const summaries = fs.readdirSync(PODCASTS_DIR)
    .filter(f => f.endsWith('_summary.txt'))
    .filter(f => !tracked.has(f));

  if (!summaries.length) {
    console.log('All summaries already tracked. Nothing to add.');
    return;
  }

  console.log(`Found ${summaries.length} new summaries to add\n`);
  for (const summary of summaries) {
    console.log(`Processing: ${summary}`);
    processSingle(path.join(PODCASTS_DIR, summary), false);
    console.log('');
  }
}
