#!/bin/bash
# Lighthouse performance audit script for mobile optimization
# Usage: ./scripts/lighthouse-audit.sh [url]

set -e

URL="${1:-http://localhost:5173}"
OUTPUT_DIR="./lighthouse-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔍 Running Lighthouse audit for: $URL"
echo "📊 Reports will be saved to: $OUTPUT_DIR"

mkdir -p "$OUTPUT_DIR"

# Run Lighthouse with mobile emulation and performance focus
npx lighthouse "$URL" \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop \
  --output=html,json \
  --output-path="$OUTPUT_DIR/report-$TIMESTAMP" \
  --chrome-flags="--headless --no-sandbox" \
  --emulated-form-factor=mobile \
  --throttling.cpuSlowdownMultiplier=4 \
  --throttling.rttMs=150 \
  --throttling.throughputKbps=1600 \
  --view

echo ""
echo "✅ Lighthouse audit complete!"
echo "📄 HTML report: $OUTPUT_DIR/report-$TIMESTAMP.report.html"
echo "📊 JSON report: $OUTPUT_DIR/report-$TIMESTAMP.report.json"
