#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="${SRC_ROOT:-/Users/jesusvilla/Library/CloudStorage/GoogleDrive-jesusvilla091921@gmail.com/Mi unidad/ARCHIVO_LEGADO/Aplio/01_WINDOWS/applio_training/jesus_voice_usb_20260316}"
DEST_ROOT="${DEST_ROOT:-/Users/jesusvilla/Desktop/Sdmx-pagina-principal/local_applio/jesus_voice_usb_20260316}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

if [[ ! -d "$SRC_ROOT" ]]; then
  log "ERROR: no existe el origen: $SRC_ROOT"
  exit 1
fi

mkdir -p "$DEST_ROOT"

log "Sincronizando entrenamiento desde Drive a local"
rsync -a --delete \
  --exclude '.DS_Store' \
  --exclude '._*' \
  "$SRC_ROOT"/ "$DEST_ROOT"/

log "Verificando archivos clave"
find "$DEST_ROOT" -maxdepth 1 -type f \( -name '*.pth' -o -name '*.json' -o -name '*.index' \) | sort
log "Destino listo: $DEST_ROOT"
