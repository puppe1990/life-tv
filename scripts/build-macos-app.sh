#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONF="$ROOT/src-tauri/tauri.conf.json"

# Identidade vem do tauri.conf.json: nada de nome/identificador fixo aqui.
IFS='|' read -r APP_NAME IDENTIFIER VERSION BIN <<<"$(node -e "
  const conf = require('$CONF')
  const slug = conf.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  console.log([conf.productName, conf.identifier, conf.version, slug].join('|'))
")"

APP_DIR="$ROOT/target-app"
APP="$APP_DIR/$APP_NAME.app"

if [ "${SKIP_DIST:-0}" != "1" ]; then
  npm --prefix "$ROOT" run tauri:dist
fi
cargo build --release --manifest-path "$ROOT/src-tauri/Cargo.toml"

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$ROOT/src-tauri/target/release/$BIN" "$APP/Contents/MacOS/$BIN"
cp "$ROOT/src-tauri/icons/icon.icns" "$APP/Contents/Resources/icon.icns"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundleDisplayName</key><string>$APP_NAME</string>
  <key>CFBundleIdentifier</key><string>$IDENTIFIER</string>
  <key>CFBundleExecutable</key><string>$BIN</string>
  <key>CFBundleIconFile</key><string>icon.icns</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSPrincipalClass</key><string>NSApplication</string>
</dict>
</plist>
PLIST

codesign --force --deep --sign - "$APP"
echo "app pronto em $APP"
