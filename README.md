# WhatsApp Podcast Pipeline

Automatically syncs, transcribes, and summarizes WhatsApp audio messages from my dad's weekly podcast group.

## What it does

1. **Syncs** new audio files (`.opus`, `.m4a`, `.mp4`) from WhatsApp on Mac, organized by chat ID
2. **Transcribes** each audio file locally using MLX Whisper (runs on Apple Silicon, fully private)
3. **Summarizes** podcast-style recordings using Claude API — bilingual (Spanish + English), with a clean transcript

Runs automatically every hour via launchd.

## Output structure
cat > README.md << 'EOF'
# WhatsApp Podcast Pipeline

Automatically syncs, transcribes, and summarizes WhatsApp audio messages from my dad's weekly podcast group.

## What it does

1. **Syncs** new audio files (`.opus`, `.m4a`, `.mp4`) from WhatsApp on Mac, organized by chat ID
2. **Transcribes** each audio file locally using MLX Whisper (runs on Apple Silicon, fully private)
3. **Summarizes** podcast-style recordings using Claude API — bilingual (Spanish + English), with a clean transcript

Runs automatically every hour via launchd.

## Output structure
```
~/Desktop/WhatsApp Audio/
  120363318556235233@g.us/     ← dad's podcast group
    audio.opus
    audio.txt                  ← raw transcript
  ...

~/Desktop/Dad Podcasts/
    audio_summary.txt          ← title, date, bilingual summary, clean transcript
```

## Scripts

| File | Purpose |
|------|---------|
| `whatsapp_audio_sync.sh` | Main hourly script — syncs audio, runs transcription and summarization |
| `backfill.js` | Node.js script — sends transcripts to Claude API and generates summaries |

## Setup

### Requirements
- Mac with Apple Silicon (M1/M2/M3/M4)
- Homebrew
- Node.js
- WhatsApp desktop app with chat history

### Install dependencies
```bash
pip3 install mlx-whisper --break-system-packages
brew install ffmpeg
npm install
```

### Configure
```bash
cp .env.example .env
# Add your Anthropic API key to .env
```

### Run manually
```bash
bash whatsapp_audio_sync.sh
```

### Schedule (runs hourly automatically)
```bash
cp com.dcazares.whatsapp-audio-sync.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.dcazares.whatsapp-audio-sync.plist
```

## Logs
```bash
cat /tmp/whatsapp-audio-sync.log
cat /tmp/whatsapp-audio-sync-error.log
```

## Dad's Podcast Group
Chat ID: `120363318556235233@g.us`
Language: Spanish
Format: Weekly podcast-style audio messages on history, culture, and life lessons
