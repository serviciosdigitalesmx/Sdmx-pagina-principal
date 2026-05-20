#!/usr/bin/env bash
set -euo pipefail

APPLIO_DIR="${APPLIO_DIR:-/Users/jesusvilla/Applio}"
INPUT_MP3="${INPUT_MP3:-/Users/jesusvilla/Downloads/NO LO BESES, ALEJANDRO FERNANDEZ- -  LETRA.mp3}"
MODEL_ROOT="${MODEL_ROOT:-/Users/jesusvilla/Desktop/Sdmx-pagina-principal/local_applio/jesus_voice_usb_20260316}"
WORKDIR="${WORKDIR:-/Users/jesusvilla/Desktop/Sdmx-pagina-principal/applio_render_fast}"
OUTDIR="$WORKDIR/out"
export PYTORCH_ENABLE_MPS_FALLBACK="${PYTORCH_ENABLE_MPS_FALLBACK:-1}"
export PYTORCH_MPS_HIGH_WATERMARK_RATIO="${PYTORCH_MPS_HIGH_WATERMARK_RATIO:-0.0}"
export PYTORCH_MPS_LOW_WATERMARK_RATIO="${PYTORCH_MPS_LOW_WATERMARK_RATIO:-0.0}"

mkdir -p "$WORKDIR" "$OUTDIR"

CLIP="$WORKDIR/clip_45s.wav"
if [[ ! -f "$CLIP" ]]; then
  ffmpeg -y -ss 00:01:00 -t 00:00:45 -i "$INPUT_MP3" -ac 1 -ar 44100 "$CLIP"
fi

"$(dirname "$0")/run_applio_mps.sh" \
  --applio-dir "$APPLIO_DIR" \
  --input "$CLIP" \
  --model-root "$MODEL_ROOT" \
  --output-dir "$OUTDIR"

echo "$OUTDIR/voice.wav"
