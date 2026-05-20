#!/usr/bin/env bash
set -euo pipefail

APPLIO_REPO="${APPLIO_REPO:-https://github.com/IAHispano/Applio.git}"
INSTALL_ROOT="${INSTALL_ROOT:-$HOME/Applio}"
PYTHON_BIN="${PYTHON_BIN:-/opt/homebrew/bin/python3.11}"
VENV_DIR="${VENV_DIR:-$INSTALL_ROOT/env}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "ERROR: falta el comando requerido: $cmd"
    exit 1
  fi
}

log "Verificando dependencias base"
require_cmd git
require_cmd "$PYTHON_BIN"

if [[ ! -d "$INSTALL_ROOT" ]]; then
  log "Clonando Applio en $INSTALL_ROOT"
  git clone "$APPLIO_REPO" "$INSTALL_ROOT"
else
  log "Actualizando repo existente en $INSTALL_ROOT"
  git -C "$INSTALL_ROOT" pull --rebase --autostash
fi

if [[ ! -f "$INSTALL_ROOT/run-install.sh" ]]; then
  log "ERROR: no encontré run-install.sh en $INSTALL_ROOT"
  exit 1
fi

log "Creando venv arm64 con Python 3.11"
rm -rf "$VENV_DIR"
"$PYTHON_BIN" -m venv "$VENV_DIR"

log "Actualizando herramientas de packaging"
"$VENV_DIR/bin/python" -m pip install --upgrade pip setuptools wheel

log "Instalando dependencias base de inferencia MPS"
"$VENV_DIR/bin/python" -m pip install torch torchvision torchaudio

log "Instalando dependencias de Applio"
cd "$INSTALL_ROOT"
chmod +x run-install.sh run-applio.sh 2>/dev/null || true

if [[ -f requirements.txt ]]; then
  if grep -q 'antlr4-python3-runtime==4.13.2' requirements.txt; then
    log "Ajustando pin incompatible de antlr4-python3-runtime para macOS/MPS"
    perl -0pi -e 's/antlr4-python3-runtime==4\.13\.2; sys_platform == '\''darwin'\''/antlr4-python3-runtime==4.9.3; sys_platform == '\''darwin'\''/g' requirements.txt
  fi
  "$VENV_DIR/bin/python" -m pip install --upgrade "pip<24.1"
  "$VENV_DIR/bin/python" -m pip install -r requirements.txt
fi

log "Verificando MPS"
"$VENV_DIR/bin/python" - <<'PY'
import torch
print("torch:", torch.__version__)
print("cuda:", torch.cuda.is_available())
print("mps:", getattr(torch.backends, "mps", None) is not None and torch.backends.mps.is_available())
PY

log "Applio instalado en $INSTALL_ROOT"
log "Si run-install.sh requiere pasos interactivos, ejecútalo dentro del repo:"
log "  cd $INSTALL_ROOT && ./run-install.sh"
