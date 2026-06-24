#!/usr/bin/env bash
set -euo pipefail

echo "== Git =="
git status --short --branch

echo
echo "== Verificar archivos T00 =="
test -f AGENTS.md
test -f docs/specs/decisions_t00_fundaciones_canonicas.md
test -f docs/implementation-bundles/T00/README.md
test -f docs/implementation-bundles/T00/verify.sh

echo
echo "== Verificar contenido clave =="
grep -q "service_orders" AGENTS.md
grep -q "repair_orders" AGENTS.md
grep -q "Compatibilidad progresiva" docs/specs/decisions_t00_fundaciones_canonicas.md
grep -q "No migración destructiva" docs/specs/decisions_t00_fundaciones_canonicas.md
grep -q "T07" docs/specs/decisions_t00_fundaciones_canonicas.md

echo
echo "== Diff stat =="
git diff --stat

echo
echo "T00 verify OK"
