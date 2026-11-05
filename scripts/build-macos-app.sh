#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONF="$ROOT/src-tauri/tauri.conf.json"

# Nome do .app vem do productName; o binário vem do Cargo (identifier decide os dados).
IFS='|' read -r APP_NAME IDENTIFIER VERSION BIN <<<"$(node -e "
  const fs = require('fs')
  const conf = require('$CONF')
  const cargo = fs.readFileSync('$ROOT/src-tauri/Cargo.toml', 'utf8')
  const bin = cargo.match(/^name = \"([^\"]+)\"/m)?.[1]
  if (!bin) throw new Error('Cargo.toml sem name')
  console.log([conf.productName, conf.identifier, conf.version, bin].join('|'))
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
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsArbitraryLoads</key><true/>
    <key>NSAllowsArbitraryLoadsForMedia</key><true/>
    <key>NSAllowsArbitraryLoadsInWebContent</key><true/>
    <key>NSAllowsLocalNetworking</key><true/>
  </dict>
</dict>
</plist>
PLIST

codesign --force --deep --sign - "$APP"
echo "app pronto em $APP"
