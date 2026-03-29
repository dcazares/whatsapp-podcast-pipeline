#!/bin/bash
source "$(dirname "$0")/.env"

SOURCE="/Users/dcazares/Library/Group Containers/group.net.whatsapp.WhatsApp.shared/Message/Media"
DEST="/Users/dcazares/Desktop/WhatsApp Audio"

mkdir -p "$DEST"

transcribe() {
  local file="$1"
  local txt="${file%.*}.txt"
  if [ ! -f "$txt" ]; then
    mlx_whisper --model mlx-community/whisper-large-v3-turbo "$file" --output-format txt --output-dir "$(dirname "$file")" 2>/dev/null
  fi
}

copy_and_transcribe() {
  local file="$1"
  local relative="${file#$SOURCE/}"
  local groupid=$(echo "$relative" | cut -d'/' -f1)
  mkdir -p "$DEST/$groupid"
  cp "$file" "$DEST/$groupid/"
  transcribe "$DEST/$groupid/$(basename "$file")"
}

if [ ! -f ~/.whatsapp_audio_last_run ]; then
  find "$SOURCE" \( -name "*.opus" -o -name "*.m4a" -o -name "*.mp4" \) -newermt "$(date -v-1y +%Y-%m-%d)" \
    | while IFS= read -r file; do
        copy_and_transcribe "$file"
      done
else
  find "$SOURCE" \( -name "*.opus" -o -name "*.m4a" -o -name "*.mp4" \) -newer ~/.whatsapp_audio_last_run \
    | while IFS= read -r file; do
        copy_and_transcribe "$file"
      done
fi

touch ~/.whatsapp_audio_last_run

# Auto-summarize new podcast transcripts
/opt/homebrew/bin/node /Users/dcazares/personal-projects/dad-podcasts/backfill.js
