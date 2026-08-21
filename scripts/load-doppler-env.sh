#!/usr/bin/env bash

set -Eeuo pipefail

if [[ "$#" -eq 0 ]]; then
  echo "ERROR: no se indicaron variables de Doppler para cargar"
  exit 1
fi

if [[ -z "${DOPPLER_TOKEN:-}" ]]; then
  echo "ERROR: el secret DOPPLER_TOKEN no está configurado"
  exit 1
fi

if [[ -z "${GITHUB_ENV:-}" ]]; then
  echo "ERROR: GITHUB_ENV no está disponible"
  exit 1
fi

umask 077
secrets_file="$(mktemp "${RUNNER_TEMP:-/tmp}/doppler-secrets.XXXXXX.json")"
cleanup() {
  rm -f -- "$secrets_file"
}
trap cleanup EXIT

# La salida completa se guarda sólo en un archivo temporal y nunca se imprime.
doppler secrets download --no-file --format json > "$secrets_file"

for variable_name in "$@"; do
  if [[ ! "$variable_name" =~ ^[A-Z][A-Z0-9_]*$ ]]; then
    echo "ERROR: nombre de variable no permitido"
    exit 1
  fi

  if ! jq -e --arg name "$variable_name" \
    'has($name) and (.[$name] | type == "string" and length > 0)' \
    "$secrets_file" > /dev/null; then
    echo "ERROR: falta la variable requerida ${variable_name} en Doppler"
    exit 1
  fi

  value="$(jq -r --arg name "$variable_name" '.[$name]' "$secrets_file")"

  if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
    echo "ERROR: ${variable_name} contiene saltos de línea no admitidos"
    exit 1
  fi

  case "$variable_name" in
    NEXT_PUBLIC_CONVEX_URL | NEXT_PUBLIC_CONVEX_SITE_URL | CONVEX_DEPLOYMENT)
      masked_value="${value//'%'/'%25'}"
      masked_value="${masked_value//$'\r'/'%0D'}"
      masked_value="${masked_value//$'\n'/'%0A'}"
      printf '::add-mask::%s\n' "$masked_value"
      ;;
  esac

  printf '%s=%s\n' "$variable_name" "$value" >> "$GITHUB_ENV"
done

echo "Configuración requerida de Doppler validada"
