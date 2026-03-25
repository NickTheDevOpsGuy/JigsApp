#!/usr/bin/env bash
# make_upload_zips.sh
# Run from your repo root: bash ./scripts/make_upload_zips.sh

REPO_ROOT="$(pwd)"
OUT_DIR="$HOME/Desktop"
PREFIX="phuzzel_upload"
MAX_BYTES=$((30 * 1024 * 1024))

echo "📦 Repo: $REPO_ROOT"

# Build file list
FILELIST=$(mktemp /tmp/phuzzel_files.XXXXXX)

find "$REPO_ROOT/src" -type f \
  ! -name "*.png"  ! -name "*.jpg"   ! -name "*.jpeg" \
  ! -name "*.gif"  ! -name "*.webp"  ! -name "*.ico" \
  ! -name "*.woff" ! -name "*.woff2" ! -name "*.ttf" \
  ! -name "*.mp3"  ! -name "*.wav"   ! -name "*.ogg" \
  ! -name "*.tsbuildinfo" \
  2>/dev/null | sort > "$FILELIST"

# Root config files
find "$REPO_ROOT" -maxdepth 1 -type f \
  \( -name "*.json" -o -name "*.ts" -o -name "*.html" \
     -o -name "*.js" -o -name "*.mjs" -o -name "*.cjs" \
     -o -name "*.toml" -o -name ".env.example" \) \
  ! -name "*.tsbuildinfo" \
  2>/dev/null | sort >> "$FILELIST"

TOTAL=$(wc -l < "$FILELIST" | tr -d ' ')
echo "   $TOTAL files found"

# Check total uncompressed size
TOTAL_SIZE=0
while IFS= read -r FILE; do
  [ -f "$FILE" ] && TOTAL_SIZE=$((TOTAL_SIZE + $(wc -c < "$FILE" | tr -d ' ')))
done < "$FILELIST"
echo "   Total size: $((TOTAL_SIZE / 1024 / 1024))MB uncompressed"
echo "   Max per zip: $((MAX_BYTES / 1024 / 1024))MB"

# Split and zip
CHUNK=1
CHUNK_BYTES=0
CHUNK_TMP=$(mktemp /tmp/phuzzel_chunk.XXXXXX)

flush_chunk() {
  [ -s "$CHUNK_TMP" ] || return
  OUT="$OUT_DIR/${PREFIX}_${CHUNK}.zip"
  rm -f "$OUT"
  COUNT=$(wc -l < "$CHUNK_TMP" | tr -d ' ')
  echo "   Writing ${PREFIX}_${CHUNK}.zip ($COUNT files, $((CHUNK_BYTES / 1024))KB)..."
  sed "s|^$REPO_ROOT/||" "$CHUNK_TMP" | (cd "$REPO_ROOT" && zip -q "$OUT" -@)
  echo "   ✓ $(du -sh "$OUT" | cut -f1)"
  CHUNK=$((CHUNK + 1))
  CHUNK_BYTES=0
  > "$CHUNK_TMP"
}

while IFS= read -r FILE; do
  [ -f "$FILE" ] || continue
  SIZE=$(wc -c < "$FILE" | tr -d ' ')

  if [ "$CHUNK_BYTES" -gt 0 ] && [ $((CHUNK_BYTES + SIZE)) -gt $MAX_BYTES ]; then
    flush_chunk
  fi

  echo "$FILE" >> "$CHUNK_TMP"
  CHUNK_BYTES=$((CHUNK_BYTES + SIZE))
done < "$FILELIST"

flush_chunk
rm -f "$FILELIST" "$CHUNK_TMP"

echo ""
echo "✅ Done — $((CHUNK - 1)) zip(s) on your Desktop"
