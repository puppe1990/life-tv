#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ICONS="$ROOT/src-tauri/icons"
SOURCE="$ICONS/icon-source.png"
SET="$ICONS/icon.iconset"

[ -f "$SOURCE" ] || { echo "fonte ausente: $SOURCE"; exit 1; }

sips -z 512 512 "$SOURCE" --out "$ICONS/icon.png" >/dev/null

rm -rf "$SET"
mkdir "$SET"
for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$SOURCE" --out "$SET/icon_${size}x${size}.png" >/dev/null
  sips -z "$((size * 2))" "$((size * 2))" "$SOURCE" --out "$SET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$SET" -o "$ICONS/icon.icns"
rm -rf "$SET"
echo "ícones gerados em $ICONS"
