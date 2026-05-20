#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  run_applio_mps.sh --input /ruta/audio.wav --model-root /ruta/logs/modelo [--output-dir /ruta/salida] [--applio-dir /ruta/applio]

Variables opcionales:
  APPLIO_DIR     Ruta a la instalación local de Applio.
  PYTHON_BIN     Binario de Python a usar dentro del entorno de Applio.
  PITCH          Transposición en semitonos. Default: 0
  INDEX_RATE     Peso del index. Default: 0.04
  PROTECT        Protección de consonantes. Default: 0.50
  F0_METHOD      Método F0. Default: rmvpe
  EXPORT_FORMAT  WAV o MP3. Default: WAV
EOF
}

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

INPUT_PATH=""
MODEL_ROOT=""
OUTPUT_DIR=""
APPLIO_DIR="${APPLIO_DIR:-/Users/jesusvilla/Applio}"
PYTHON_BIN="${PYTHON_BIN:-$APPLIO_DIR/env/bin/python3}"
export PYTORCH_ENABLE_MPS_FALLBACK="${PYTORCH_ENABLE_MPS_FALLBACK:-1}"
export PYTORCH_MPS_HIGH_WATERMARK_RATIO="${PYTORCH_MPS_HIGH_WATERMARK_RATIO:-0.0}"
export PYTORCH_MPS_LOW_WATERMARK_RATIO="${PYTORCH_MPS_LOW_WATERMARK_RATIO:-0.0}"
export PYTORCH_ENABLE_MPS_FALLBACK="${PYTORCH_ENABLE_MPS_FALLBACK:-1}"
export PYTORCH_MPS_HIGH_WATERMARK_RATIO="${PYTORCH_MPS_HIGH_WATERMARK_RATIO:-0.0}"
export PYTORCH_MPS_LOW_WATERMARK_RATIO="${PYTORCH_MPS_LOW_WATERMARK_RATIO:-0.0}"
PITCH="${PITCH:-0}"
INDEX_RATE="${INDEX_RATE:-0.04}"
VOLUME_ENVELOPE="${VOLUME_ENVELOPE:-1}"
PROTECT="${PROTECT:-0.50}"
F0_METHOD="${F0_METHOD:-rmvpe}"
EXPORT_FORMAT="${EXPORT_FORMAT:-WAV}"
EMBEDDER_MODEL="${EMBEDDER_MODEL:-contentvec}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input) INPUT_PATH="$2"; shift 2 ;;
    --model-root) MODEL_ROOT="$2"; shift 2 ;;
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --applio-dir) APPLIO_DIR="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) log "Argumento desconocido: $1"; usage; exit 1 ;;
  esac
done

if [[ -z "$INPUT_PATH" || -z "$MODEL_ROOT" ]]; then
  usage
  exit 1
fi

if [[ ! -f "$INPUT_PATH" ]]; then
  log "ERROR: no existe el audio de entrada: $INPUT_PATH"
  exit 1
fi

if [[ ! -d "$MODEL_ROOT" ]]; then
  log "ERROR: no existe el directorio del modelo: $MODEL_ROOT"
  exit 1
fi

if [[ ! -d "$APPLIO_DIR" || ! -f "$APPLIO_DIR/core.py" ]]; then
  log "ERROR: no encontré una instalación válida de Applio en: $APPLIO_DIR"
  exit 1
fi

if [[ ! -x "$PYTHON_BIN" ]]; then
  log "ERROR: no existe el Python de Applio: $PYTHON_BIN"
  exit 1
fi

if [[ "$(uname -s)" == "Darwin" ]]; then
  log "macOS detectado: usando fallback MPS para operaciones no soportadas"
fi

LATEST_PTH="$(find "$MODEL_ROOT" -maxdepth 1 -type f -name '*.pth' | grep -v '/\._' | sort | tail -n 1 || true)"
if [[ -z "${LATEST_PTH:-}" ]]; then
  log "ERROR: no encontré checkpoints .pth en $MODEL_ROOT"
  exit 1
fi

OUTPUT_DIR="${OUTPUT_DIR:-$MODEL_ROOT/inference_out}"
mkdir -p "$OUTPUT_DIR"

log "Checkpoint seleccionado: $LATEST_PTH"
log "Salida: $OUTPUT_DIR"

cd "$APPLIO_DIR"

if [[ "$F0_METHOD" == "rmvpe" && ! -f "$APPLIO_DIR/rvc/models/predictors/rmvpe.pt" ]]; then
  log "rmvpe.pt no existe; descargando prerequisitos oficiales de Applio"
  "$PYTHON_BIN" core.py prerequisites --pretraineds_hifigan False --models True --exe False
fi

set +e
"$PYTHON_BIN" core.py infer \
  --pitch "$PITCH" \
  --index_rate "$INDEX_RATE" \
  --volume_envelope "$VOLUME_ENVELOPE" \
  --protect "$PROTECT" \
  --f0_method "$F0_METHOD" \
  --input_path "$INPUT_PATH" \
  --output_path "$OUTPUT_DIR/voice.wav" \
  --pth_path "$LATEST_PTH" \
  --index_path '' \
  --split_audio False \
  --f0_autotune False \
  --proposed_pitch False \
  --clean_audio False \
  --export_format "$EXPORT_FORMAT" \
  --embedder_model "$EMBEDDER_MODEL"
STATUS=$?
set -e

if [[ $STATUS -ne 0 ]]; then
  log "ERROR: la inferencia falló con código $STATUS"
  exit $STATUS
fi

if [[ ! -f "$OUTPUT_DIR/voice.wav" && ! -f "$OUTPUT_DIR/voice.mp3" ]]; then
  log "ERROR: la inferencia terminó sin generar archivo de salida"
  exit 1
fi

log "Listo: $OUTPUT_DIR/voice.wav"
