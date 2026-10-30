#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/target-app"
APP="$APP_DIR/Life TV.app"
VERSION="$(node -p "require('$ROOT/package.json').version")"

npm --prefix "$ROOT" run tauri:dist
cargo build --release --manifest-path "$ROOT/src-tauri/Cargo.toml"

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$ROOT/src-tauri/target/release/life-tv" "$APP/Contents/MacOS/life-tv"
cp "$ROOT/src-tauri/icons/icon.icns" "$APP/Contents/Resources/icon.icns"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Life TV</string>
  <key>CFBundleDisplayName</key><string>Life TV</string>
  <key>CFBundleIdentifier</key><string>com.life-tv.app</string>
  <key>CFBundleExecutable</key><string>life-tv</string>
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
