const fs = require('fs');
const path = require('path');

const TRANSCRIPTS_DIR = '/Users/dcazares/Desktop/WhatsApp Audio/120363318556235233@g.us';
const PODCASTS_DIR = '/Users/dcazares/Desktop/Dad Podcasts';

const summaries = fs.readdirSync(PODCASTS_DIR).filter(f => f.endsWith('_summary.txt'));

for (const summary of summaries) {
  const base = summary.replace('_summary.txt', '');
  
  // Try all audio extensions
  const extensions = ['.opus', '.m4a', '.mp4'];
  let audioPath = null;
  for (const ext of extensions) {
    const candidate = path.join(TRANSCRIPTS_DIR, base + ext);
    if (fs.existsSync(candidate)) {
      audioPath = candidate;
      break;
    }
  }

  if (!audioPath) {
    console.log(`No matching audio for ${summary}, skipping`);
    continue;
  }

  const birthtime = fs.statSync(audioPath).birthtime;
  const date = birthtime.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const summaryPath = path.join(PODCASTS_DIR, summary);
  let content = fs.readFileSync(summaryPath, 'utf8');
  content = content.replace(/FECHA \/ DATE:.*/, `FECHA / DATE: ${date}`);
  fs.writeFileSync(summaryPath, content);
  console.log(`✓ ${summary} → ${date}`);
}
