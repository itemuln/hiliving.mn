#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run this deployment command through sudo." >&2
  exit 1
fi

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <40-character-git-commit>" >&2
  exit 1
fi

release_id=$1
if [[ ! "$release_id" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Release ID must be a full lowercase Git commit SHA." >&2
  exit 1
fi

incoming_directory="/var/lib/hiliving-deploy/incoming/${release_id}"
frontend_release="/opt/hiliving/frontend/releases/${release_id}"
backend_release="/opt/hiliving/backend/releases/${release_id}"
frontend_current=/opt/hiliving/frontend/current
backend_current=/opt/hiliving/backend/current

for required_command in curl find nginx sha256sum systemctl tar; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    echo "Required deployment command is missing: ${required_command}" >&2
    exit 1
  fi
done

for artifact in frontend.tar.gz hiliving-backend.jar SHA256SUMS; do
  artifact_path="${incoming_directory}/${artifact}"
  if [[ ! -f "$artifact_path" || -L "$artifact_path" ]]; then
    echo "Missing regular deployment artifact: ${artifact_path}" >&2
    exit 1
  fi
done

manifest_files=$(awk '{print $2}' "${incoming_directory}/SHA256SUMS" | LC_ALL=C sort)
if [[ "$manifest_files" != $'frontend.tar.gz\nhiliving-backend.jar' ]]; then
  echo "SHA256SUMS must contain exactly the two expected release artifacts." >&2
  exit 1
fi
(
  cd "$incoming_directory"
  sha256sum --check --strict SHA256SUMS
)

if tar -tzf "${incoming_directory}/frontend.tar.gz" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo "Frontend archive contains an unsafe path." >&2
  exit 1
fi
if tar -tvzf "${incoming_directory}/frontend.tar.gz" \
  | awk '{ entry_type = substr($1, 1, 1); if (entry_type != "d" && entry_type != "-") exit 1 }'; then
  :
else
  echo "Frontend archive may contain only regular files and directories." >&2
  exit 1
fi

current_frontend_target=$(readlink "$frontend_current" 2>/dev/null || true)
current_backend_target=$(readlink "$backend_current" 2>/dev/null || true)
if [[ -z "$current_frontend_target" || ! -d "$frontend_current" \
  || -z "$current_backend_target" || ! -d "$backend_current" ]]; then
  echo "The existing frontend and backend current links must both be valid." >&2
  exit 1
fi

if [[ "$(readlink -f "$frontend_current" 2>/dev/null || true)" == "$frontend_release" \
  && "$(readlink -f "$backend_current" 2>/dev/null || true)" == "$backend_release" ]]; then
  echo "Release ${release_id} is already active."
  rm -rf -- "$incoming_directory"
  exit 0
fi

if [[ -e "$frontend_release" || -e "$backend_release" ]]; then
  echo "Release ${release_id} already exists but is not fully active." >&2
  exit 1
fi

frontend_switched=false
backend_switched=false
deployment_complete=false

switch_release_link() {
  local link_path=$1
  local link_target=$2
  local temporary_link="${link_path}.next-${release_id}"

  rm -f -- "$temporary_link"
  ln -s "$link_target" "$temporary_link"
  mv -Tf "$temporary_link" "$link_path"
}

rollback_release() {
  local exit_status=$?
  trap - EXIT

  if [[ "$deployment_complete" != true ]]; then
    echo "Deployment failed; restoring the previous release." >&2

    if [[ "$frontend_switched" == true && -n "$current_frontend_target" ]]; then
      switch_release_link "$frontend_current" "$current_frontend_target"
    fi

    if [[ "$backend_switched" == true && -n "$current_backend_target" ]]; then
      switch_release_link "$backend_current" "$current_backend_target"
      systemctl restart hiliving-backend || true
    fi

    if [[ "$(readlink -f "$frontend_current" 2>/dev/null || true)" != "$frontend_release" ]]; then
      rm -rf -- "$frontend_release"
    fi
    if [[ "$(readlink -f "$backend_current" 2>/dev/null || true)" != "$backend_release" ]]; then
      rm -rf -- "$backend_release"
    fi
  fi

  exit "$exit_status"
}
trap rollback_release EXIT

install -d -m 0755 "$frontend_release" "$backend_release"
tar --extract --gzip \
  --file "${incoming_directory}/frontend.tar.gz" \
  --directory "$frontend_release" \
  --no-same-owner \
  --no-same-permissions
install -o root -g root -m 0644 \
  "${incoming_directory}/hiliving-backend.jar" \
  "${backend_release}/hiliving-backend.jar"

if [[ ! -f "${frontend_release}/index.html" ]]; then
  echo "Frontend release does not contain index.html." >&2
  exit 1
fi
find "$frontend_release" -type d -exec chmod 0755 {} +
find "$frontend_release" -type f -exec chmod 0644 {} +
chown -R root:root "$frontend_release" "$backend_release"

switch_release_link "$backend_current" "releases/${release_id}"
backend_switched=true
systemctl restart hiliving-backend

backend_healthy=false
for _ in {1..30}; do
  if systemctl is-active --quiet hiliving-backend \
    && curl --fail --silent --show-error --max-time 5 \
      http://127.0.0.1:8080/actuator/health | grep -q '"status":"UP"'; then
    backend_healthy=true
    break
  fi
  sleep 2
done
if [[ "$backend_healthy" != true ]]; then
  echo "The new backend did not become healthy." >&2
  journalctl -u hiliving-backend --no-pager -n 80 >&2 || true
  exit 1
fi

switch_release_link "$frontend_current" "releases/${release_id}"
frontend_switched=true
nginx -t

public_url=$(sed -n 's/^APP_PUBLIC_URL=//p' /etc/hiliving/hiliving.env | tail -n 1)
if [[ ! "$public_url" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]]; then
  echo "APP_PUBLIC_URL must be a path-free HTTPS origin for deployment verification." >&2
  exit 1
fi

curl --fail --silent --show-error --max-time 15 \
  --retry 5 --retry-delay 2 --retry-all-errors \
  "${public_url}/" >/dev/null
curl --fail --silent --show-error --max-time 15 \
  --retry 5 --retry-delay 2 --retry-all-errors \
  "${public_url}/api/v1/categories?size=1" >/dev/null

deployment_complete=true
trap - EXIT
rm -rf -- "$incoming_directory"
echo "Release ${release_id} is active and healthy."
