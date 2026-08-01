#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <github-actions-ssh-public-key-file>" >&2
  exit 1
fi

public_key_file=$1
if [[ ! -f "$public_key_file" || -L "$public_key_file" ]]; then
  echo "The SSH public key must be a regular file." >&2
  exit 1
fi

if [[ $(wc -l < "$public_key_file") -ne 1 ]] \
  || ! grep -Eq '^(ssh-ed25519|sk-ssh-ed25519) [A-Za-z0-9+/=]+( .*)?$' "$public_key_file"; then
  echo "Provide exactly one Ed25519 SSH public key." >&2
  exit 1
fi

deploy_user=hiliving-deploy
deploy_home=/var/lib/hiliving-deploy
script_directory=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)

if ! id "$deploy_user" >/dev/null 2>&1; then
  useradd --system \
    --home-dir "$deploy_home" \
    --create-home \
    --shell /bin/bash \
    "$deploy_user"
fi

install -d -o "$deploy_user" -g "$deploy_user" -m 0750 "$deploy_home"
install -d -o "$deploy_user" -g "$deploy_user" -m 0700 "${deploy_home}/.ssh"
install -d -o "$deploy_user" -g "$deploy_user" -m 0700 "${deploy_home}/incoming"

authorized_keys_file=$(mktemp "${deploy_home}/.ssh/.authorized_keys.XXXXXX")
sudoers_file=$(mktemp /etc/sudoers.d/.hiliving-deploy.XXXXXX)
trap 'rm -f "$authorized_keys_file" "$sudoers_file"' EXIT

printf 'restrict %s\n' "$(<"$public_key_file")" > "$authorized_keys_file"
chown "$deploy_user:$deploy_user" "$authorized_keys_file"
chmod 0600 "$authorized_keys_file"
mv "$authorized_keys_file" "${deploy_home}/.ssh/authorized_keys"

install -o root -g root -m 0755 \
  "${script_directory}/deploy-release.sh" \
  /usr/local/sbin/hiliving-deploy

printf '%s\n' \
  'hiliving-deploy ALL=(root) NOPASSWD: /usr/local/sbin/hiliving-deploy *' \
  > "$sudoers_file"
chmod 0440 "$sudoers_file"
visudo -cf "$sudoers_file" >/dev/null
mv "$sudoers_file" /etc/sudoers.d/hiliving-deploy
trap - EXIT

echo "GitHub Actions deployment access is installed for ${deploy_user}."
