const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic();

const TRANSCRIPTS_DIR = '/Users/dcazares/Desktop/WhatsApp Audio/120363318556235233@g.us';
const OUTPUT_DIR = '/Users/dcazares/Desktop/Dad Podcasts';
const MIN_SIZE = 3000;

function cleanTranscript(text) {
  const lines = text.split('\n');
  const cleaned = [];
  const seen = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const noTimestamp = trimmed.replace(/\[\d+:\d+\.\d+ --> \d+:\d+\.\d+\]\s*/g, '').trim();
    if (!noTimestamp) continue;

    const count = (seen.get(noTimestamp) || 0) + 1;
    seen.set(noTimestamp, count);
    if (count <= 3) {
      cleaned.push(noTimestamp);
    }
  }

  return cleaned.join('\n');
}

async function summarize(transcript, filename) {
  const stats = fs.statSync(path.join(TRANSCRIPTS_DIR, filename.replace('_summary.txt', '.txt')));
  const date = new Date(stats.mtime).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `This is a transcript of a weekly podcast-style audio message shared by a father with his family. It was auto-transcribed from Spanish audio so it may have run-on sentences, filler words, or awkward phrasing.

First, identify the main topic or title of this episode from the content.

Format your response exactly like this:

TÍTULO / TITLE: [a short descriptive title for this episode]

FECHA / DATE: ${date}

---

RESUMEN (Español):
[2-3 paragraph summary in Spanish capturing the key points and wisdom shared]

SUMMARY (English):
[2-3 paragraph summary in English capturing the key points and wisdom shared]

---

TRANSCRIPCIÓN LIMPIA / CLEAN TRANSCRIPT:
[Rewrite the transcript so it flows naturally as readable prose. Keep every idea, fact, and the speaker's authentic voice and warmth. Fix run-on sentences, remove filler words like "bueno", "este", "verdad", "o sea" where they add no meaning, and break into clean paragraphs by topic. Do not summarize — preserve all the detail. Write in Spanish since that is the original language.]

Transcript:
${transcript}`
    }]
  });
  return response.content[0].text;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs.readdirSync(TRANSCRIPTS_DIR)
    .filter(f => f.endsWith('.txt'))
    .map(f => ({ 
      name: f, 
      path: path.join(TRANSCRIPTS_DIR, f), 
      size: fs.statSync(path.join(TRANSCRIPTS_DIR, f)).size,
      mtime: fs.statSync(path.join(TRANSCRIPTS_DIR, f)).mtime
    }))
    .filter(f => f.size >= MIN_SIZE)
    .sort((a, b) => a.mtime - b.mtime);

  console.log(`Found ${files.length} podcast transcripts to process\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const outputPath = path.join(OUTPUT_DIR, file.name.replace('.txt', '_summary.txt'));

    if (fs.existsSync(outputPath)) {
      console.log(`[${i+1}/${files.length}] Skipping (already done): ${file.name}`);
      continue;
    }

    console.log(`[${i+1}/${files.length}] Summarizing: ${file.name}`);
    const raw = fs.readFileSync(file.path, 'utf8');
    const transcript = cleanTranscript(raw);

    try {
      const summary = await summarize(transcript, file.name);
      fs.writeFileSync(outputPath, summary);
      console.log(`    ✓ Saved`);
    } catch (err) {
      console.error(`    ✗ Error: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nDone! All summaries saved to:', OUTPUT_DIR);
}

main();
