#!/usr/bin/env bash

set -Eeuo pipefail

image_uri="${1:?Falta image_uri}"
container_name="${2:?Falta container_name}"
host_port="${3:?Falta host_port}"
aws_region="${4:?Falta aws_region}"

registry="${image_uri%%/*}"

show_failure() {
  echo "ERROR: falló el despliegue de ${container_name}"
  docker logs --tail 200 "$container_name" 2>&1 || true
}

aws ecr get-login-password --region "$aws_region" \
  | docker login --username AWS --password-stdin "$registry"

docker pull "$image_uri"
docker rm -f "$container_name" > /dev/null 2>&1 || true

docker run -d \
  --name "$container_name" \
  --restart unless-stopped \
  -p "${host_port}:3000" \
  "$image_uri" > /dev/null

sleep 2
if [[ "$(docker inspect --format '{{.State.Running}}' "$container_name" 2>/dev/null || true)" != "true" ]]; then
  show_failure
  exit 1
fi

healthy=false
for _ in $(seq 1 18); do
  if curl --fail --silent --show-error \
    --max-time 5 \
    --output /dev/null \
    "http://localhost:${host_port}/"; then
    healthy=true
    break
  fi

  if [[ "$(docker inspect --format '{{.State.Running}}' "$container_name" 2>/dev/null || true)" != "true" ]]; then
    break
  fi

  sleep 5
done

if [[ "$healthy" != "true" ]]; then
  show_failure
  exit 1
fi

echo "Contenedor ${container_name} desplegado y saludable"
docker image prune -f > /dev/null
