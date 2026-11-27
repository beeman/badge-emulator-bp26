# Breakpoint 2026 badge emulator for Android

The Android app boots the Solana OS badge firmware in an Android WebView using the firmware's existing WebAssembly emulator. The 320 × 240 display comes from the firmware framebuffer. On-screen buttons drive the same input lines as the badge, and the eight LEDs show the firmware’s RGB output.

## Run locally

1. Install the Expo dependencies with `bun install`.
2. Install Emscripten and CMake 3.19 or newer.
3. Run `bun run android` with an Android emulator or phone connected. The first build downloads and compiles the pinned [Solana OS 2.5.1 source](https://github.com/solana-foundation/solana-os/commit/f18d4d7335ccc492a538d7632f102a8a9345869b). Later builds reuse the local cache.

Run `bun run emulator:build` to rebuild the firmware bundle without launching Android. To use a different Solana OS checkout, set `SOLANA_OS_DIR` before running Android. In that checkout, activate the ESP-IDF version pinned in `esp-idf.commit` and run `idf.py -DIDF_TARGET=esp32c5 reconfigure` first.

If you already have matching `solana-os.js` and `solana-os.wasm` files, run `node scripts/pack-emulator.mjs /path/to/outputs` to bundle them, then `bunx expo run:android` to launch without rebuilding the bundle.

The WebView starts the bundled firmware when the app opens. The display shows the launcher when boot completes. Use the D-pad and Select to open a built-in app, Cancel to go back, or Boot to return to the launcher. Boot is on the physical badge’s back and exposed on the Android shell.

## Update the emulator

The [published hardware dimensions](https://solana.com/breakpoint/badge#case) guide the local board layout in `src/emulator/index.html` and `badge.css`. The [official browser emulator](https://solana.com/breakpoint/badge/emulator) and Android use the same Solana OS WebAssembly runtime. Firmware and built-in app updates come from rebuilding or repacking the matching runtime pair. The Android board stays bundled and can boot offline.

## Connect to the App Store

Open **Wi-Fi** on the badge and join **Emulator Guest**. Solana OS simulates the connection, then sends real badge API requests over Android’s internet connection. Open **App Store** to browse or download apps. The Android WebView saves the emulated microSD card in IndexedDB and restores it at boot, so installed apps and their files survive emulator restarts. Firmware built by another tool needs the Emscripten `preRun` hook enabled to restore the card.

To link the emulated badge, open **My Badge** after connecting. When the badge shows its claim QR code, tap **Link this badge** below the emulator to open the same claim link in Android’s browser. After linking, use **Select** in My Badge to refresh its status.

## Website

The static site follows the [Pocket Address](https://github.com/beeman/pocket-address) GitHub Pages layout. In the repository’s Pages settings, choose **Deploy from a branch** with `main` and `/docs`. The site includes separate privacy policy and terms of service URLs. The source and store listing share the screenshots in `docs/screenshots/`.
