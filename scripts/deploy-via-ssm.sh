#!/usr/bin/env bash

set -Eeuo pipefail

instance_id="${1:?Falta instance_id}"
image_uri="${2:?Falta image_uri}"
container_name="${3:?Falta container_name}"
host_port="${4:?Falta host_port}"
aws_region="${5:?Falta aws_region}"

if [[ ! "$instance_id" =~ ^i-[a-f0-9]+$ ]]; then
  echo "ERROR: instance_id no es válido"
  exit 1
fi

if [[ ! "$image_uri" =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/[a-z0-9._/-]+:[a-f0-9]{40}$ ]]; then
  echo "ERROR: image_uri no corresponde a una imagen ECR etiquetada con SHA"
  exit 1
fi

case "${container_name}:${host_port}" in
  app-staging:3001 | app-production:3000) ;;
  *)
    echo "ERROR: combinación de contenedor y puerto no permitida"
    exit 1
    ;;
esac

if [[ ! "$aws_region" =~ ^[a-z]{2}-[a-z]+-[0-9]+$ ]]; then
  echo "ERROR: aws_region no es válida"
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
remote_script="${script_dir}/remote-deploy-container.sh"

if [[ ! -f "$remote_script" ]]; then
  echo "ERROR: no se encontró el script remoto de despliegue"
  exit 1
fi

encoded_script="$(base64 --wrap=0 "$remote_script")"
remote_command="printf '%s' '${encoded_script}' | base64 --decode | bash -s -- '${image_uri}' '${container_name}' '${host_port}' '${aws_region}'"

umask 077
parameters_file="$(mktemp "${RUNNER_TEMP:-/tmp}/ssm-parameters.XXXXXX.json")"
cleanup() {
  rm -f -- "$parameters_file"
}
trap cleanup EXIT

jq -n --arg command "$remote_command" '{commands: [$command]}' > "$parameters_file"

command_id="$(
  aws ssm send-command \
    --region "$aws_region" \
    --document-name AWS-RunShellScript \
    --instance-ids "$instance_id" \
    --comment "Despliegue ${container_name}" \
    --parameters "file://${parameters_file}" \
    --query 'Command.CommandId' \
    --output text
)"

echo "Comando SSM enviado; esperando el resultado"

for _ in $(seq 1 120); do
  if ! invocation="$(
    aws ssm get-command-invocation \
      --region "$aws_region" \
      --command-id "$command_id" \
      --instance-id "$instance_id" \
      --output json 2>/dev/null
  )"; then
    sleep 5
    continue
  fi

  status="$(jq -r '.Status' <<< "$invocation")"
  case "$status" in
    Success)
      jq -r '.StandardOutputContent' <<< "$invocation"
      exit 0
      ;;
    Pending | InProgress | Delayed)
      sleep 5
      ;;
    *)
      echo "ERROR: el comando SSM terminó con estado ${status}"
      jq -r '.StandardOutputContent, .StandardErrorContent' <<< "$invocation"
      exit 1
      ;;
  esac
done

echo "ERROR: se agotó el tiempo esperando el comando SSM"
exit 1
