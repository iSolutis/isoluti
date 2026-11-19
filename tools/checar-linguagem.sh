#!/usr/bin/env bash
# Checagem de linguagem da página para clínicas (CA04 da spec de 19/11/2026).
# Falha se o texto publicado tiver "gargalo", "numa" ou "sem contratar mais".
# Uso: tools/checar-linguagem.sh [arquivos...]   (padrão: clinicas/)
set -u
cd "$(dirname "$0")/.."
alvos=("$@"); [ ${#alvos[@]} -eq 0 ] && alvos=(clinicas)
achou=$(grep -rniEw --include='*.html' --include='*.md' --include='*.json' 'gargalos?|numa|sem contratar mais' "${alvos[@]}")
if [ -n "$achou" ]; then
  echo "Termos proibidos encontrados:"; echo "$achou"; exit 1
fi
echo "Linguagem ok: nenhum termo proibido em ${alvos[*]}."
