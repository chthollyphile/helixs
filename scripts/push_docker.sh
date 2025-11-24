#!/usr/bin/env bash

set -euo pipefail

REPO="${DOCKER_REPO:-${1:-}}"
if [[ -z "${REPO}" ]]; then
  echo "用法: DOCKER_REPO=<username/helixs> ./scripts/push_docker.sh"
  echo "或 ./scripts/push_docker.sh <username/helixs>"
  exit 1
fi

USERNAME="${DOCKER_USERNAME:-}"
PASSWORD="${DOCKER_PASSWORD:-}"

if [[ -n "${USERNAME}" && -n "${PASSWORD}" ]]; then
  echo "使用环境变量登录 Docker Hub (${USERNAME})"
  echo "${PASSWORD}" | docker login --username "${USERNAME}" --password-stdin
else
  echo "交互式执行 docker login（也可通过 DOCKER_USERNAME/DOCKER_PASSWORD 跳过提示）"
  docker login
fi

DATE_TAG="$(date +%Y%m%d)"
LATEST_TAG="latest"

echo "构建镜像 ${REPO}:${DATE_TAG} 和 ${REPO}:${LATEST_TAG}"
docker build -t "${REPO}:${DATE_TAG}" -t "${REPO}:${LATEST_TAG}" "$(dirname "$0")/.."

echo "推送 ${REPO}:${DATE_TAG}"
docker push "${REPO}:${DATE_TAG}"

echo "推送 ${REPO}:${LATEST_TAG}"
docker push "${REPO}:${LATEST_TAG}"

echo "完成：${REPO}:${DATE_TAG} 和 ${REPO}:${LATEST_TAG} 已推送"

