#!/usr/bin/env bash
# Download all audio and video files from the old Andreas Magdanz website.
# Files are served from: http://www.andreasmagdanz.de/content/presse/media/FILENAME
#
# Usage: bash seed/download-media.sh

set -euo pipefail

BASE_URL="http://www.andreasmagdanz.de/content/presse/media"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AUDIO_DIR="$SCRIPT_DIR/media/audio"
VIDEO_DIR="$SCRIPT_DIR/media/video"

mkdir -p "$AUDIO_DIR" "$VIDEO_DIR"

# ── Video files (19 from old site, skipping YouTube) ──────────────────────────

VIDEO_FILES=(
  "3sat_kuz_230413_stammheim.mp4"
  "3sat_kuz_20230119_mag-regbu_sd.mp4"
  "arte-twist-der-wald_210117.mp4"
  "rwth-maschinenlabor_making-of_720.mp4"
  "rwth-maschinenlabor-ueberfahrt_720.mp4"
  "ttt_180923_magdanz_hambacher-forst.mp4"
  "wdr_westart_20160425_magdanz_studiogast.mp4"
  "3sat_kulturzeit_20150623.mp4"
  "dwtv_kultur21_120413_en.mp4"
  "3sat-kultur_120627.mp4"
  "brus_3_leroi.mp4"
  "wdr_westart_081009.mp4"
  "brf_blickp_080905.mp4"
  "wdr_lokalzeit-ac_080517.mp4"
  "ard-hierundheute_0803.mp4"
  "swr-landesart_0803.mp4"
  "zdf-heute_0803.mp4"
  "zdf-mittagsmagazin_0803.mp4"
  "ttt_mthal_080217.mp4"
)

# ── Audio files (13) ──────────────────────────────────────────────────────────

AUDIO_FILES=(
  "wdr5_scala_20190808_magdanz-erkundet-die-rwth.mp3"
  "wdr3_mosaik_20190729_economymeetsart.mp3"
  "wdr5_scala_dichter_181017_mahnmal.mp3"
  "wdr5_scala_20150729_magdanz_hambacher-forst.mp3"
  "wdr3_resonanzen_biermann_121204.mp3"
  "wdr5_scala_dichter_110111.mp3"
  "brf_forum_080727.mp3"
  "dlrk_080718.mp3"
  "wdr2_dichter_080718.mp3"
  "wdr3_mosaik_20080718.mp3"
  "wdr3_resonanzen_20080717.mp3"
  "dlfunk_corso_marienthal_080229.mp3"
  "dlfunk_dkultur_200605161609.mp3"
)

download_file() {
  local filename="$1"
  local dest_dir="$2"
  local dest="$dest_dir/$filename"

  if [[ -f "$dest" && -s "$dest" ]]; then
    echo "  SKIP (exists): $filename"
    return 0
  fi

  echo "  Downloading: $filename ..."
  if curl -fSL --connect-timeout 30 --max-time 600 \
       -o "$dest" "$BASE_URL/$filename"; then
    local size
    size=$(stat -f%z "$dest" 2>/dev/null || stat -c%s "$dest" 2>/dev/null || echo "?")
    echo "  OK: $filename ($size bytes)"
  else
    echo "  FAILED: $filename"
    rm -f "$dest"
    return 1
  fi
}

echo "=== Downloading ${#VIDEO_FILES[@]} video files ==="
video_ok=0
video_fail=0
for f in "${VIDEO_FILES[@]}"; do
  if download_file "$f" "$VIDEO_DIR"; then
    video_ok=$((video_ok + 1))
  else
    video_fail=$((video_fail + 1))
  fi
done

echo ""
echo "=== Downloading ${#AUDIO_FILES[@]} audio files ==="
audio_ok=0
audio_fail=0
for f in "${AUDIO_FILES[@]}"; do
  if download_file "$f" "$AUDIO_DIR"; then
    audio_ok=$((audio_ok + 1))
  else
    audio_fail=$((audio_fail + 1))
  fi
done

echo ""
echo "=== Summary ==="
echo "Video: $video_ok OK, $video_fail failed (of ${#VIDEO_FILES[@]})"
echo "Audio: $audio_ok OK, $audio_fail failed (of ${#AUDIO_FILES[@]})"
echo ""
echo "Files saved to:"
echo "  Audio: $AUDIO_DIR"
echo "  Video: $VIDEO_DIR"
