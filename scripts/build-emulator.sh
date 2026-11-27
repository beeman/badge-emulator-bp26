#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
build="$root/.expo/solana-os"
output="$build/runtime"
export EM_CACHE="${EM_CACHE:-$build/emscripten-cache}"

command -v emcmake >/dev/null || { echo "Install Emscripten and make emcmake available on PATH." >&2; exit 1; }

fetch_source() {
  local repo="$1" revision="$2" destination="$3"
  if [[ -d "$destination" ]]; then
    return
  fi

  (
    mkdir -p "$(dirname "$destination")"
    local staging
    staging="$(mktemp -d "${destination}.XXXXXX")"
    trap 'rm -rf -- "$staging"' EXIT
    curl -fsSL --retry 2 "https://codeload.github.com/$repo/tar.gz/$revision" |
      tar -xz --strip-components=1 -C "$staging"
    mv "$staging" "$destination"
  )
}

firmware="${1:-${SOLANA_OS_DIR:-}}"
if [[ -z "$firmware" ]]; then
  firmware="$build/source-2.5.1"
  fetch_source solana-foundation/solana-os f18d4d7335ccc492a538d7632f102a8a9345869b "$firmware"

  # Match the LVGL and cJSON versions in this release's dependencies.lock.
  components="$firmware/managed_components"
  fetch_source lvgl/lvgl 80ca777e37a2b176770726a02e07a6fb79ef0b39 "$components/lvgl__lvgl"
  fetch_source DaveGamble/cJSON c859b25da02955fef659d658b8f324b5cde87be3 "$components/espressif__cjson/cJSON"

  # Upstream overlays sdkconfig.defaults. Supply the resolved values the WASM
  # build needs without installing the ESP32 compiler for an Android build.
  if [[ ! -f "$firmware/sdkconfig" ]]; then
    cat > "$firmware/sdkconfig" <<'CONFIG'
CONFIG_ESP_DEFAULT_CPU_FREQ_MHZ=240
CONFIG_LV_CONF_SKIP=y
CONFIG_FREERTOS_HZ=100
CONFIG
  fi
fi

if [[ ! -f "$firmware/sdkconfig" || ! -f "$firmware/managed_components/lvgl__lvgl/lvgl.h" ]]; then
  echo "Configure the Solana OS checkout at $firmware with the pinned ESP-IDF (idf.py reconfigure)." >&2
  exit 1
fi

# CMake caches its source path. Keep each checkout's build separate.
firmware="$(cd "$firmware" && pwd)"
checkout_key="$(printf '%s' "$firmware" | cksum | cut -d ' ' -f 1)"
emcmake cmake -S "$firmware/emulator" -B "$build/$checkout_key" \
  -DCMAKE_BUILD_TYPE=MinSizeRel -DEMU_OUT_DIR="$output/$checkout_key" \
  -DCMAKE_PROJECT_INCLUDE="$root/scripts/emulator.cmake"
cmake --build "$build/$checkout_key" --parallel "${BUILD_JOBS:-4}"
node "$root/scripts/pack-emulator.mjs" "$output/$checkout_key"
