#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <public-server-name>" >&2
  exit 1
fi

server_name=$1

if ! id hiliving >/dev/null 2>&1; then
  useradd --system --home-dir /var/lib/hiliving --create-home --shell /usr/sbin/nologin hiliving
fi

install -d -m 0755 /opt/hiliving/backend/releases /opt/hiliving/frontend/releases
install -d -m 0750 -o hiliving -g hiliving /var/lib/hiliving/uploads
install -d -m 0750 -o root -g hiliving /etc/hiliving
install -d -m 0755 /var/www/certbot

if [[ ! -f /etc/hiliving/hiliving.env ]]; then
  db_password=$(openssl rand -hex 32)
  token_key=$(openssl rand -base64 32 | tr -d '\n')
  environment_file=$(mktemp /etc/hiliving/.hiliving.env.XXXXXX)
  trap 'rm -f "$environment_file"' EXIT

  umask 0077
  {
    printf 'POSTGRES_DB=hiliving\n'
    printf 'POSTGRES_USER=hiliving\n'
    printf 'POSTGRES_PASSWORD=%s\n' "$db_password"
    printf 'SPRING_PROFILES_ACTIVE=production\n'
    printf 'SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/hiliving\n'
    printf 'SPRING_DATASOURCE_USERNAME=hiliving\n'
    printf 'SPRING_DATASOURCE_PASSWORD=%s\n' "$db_password"
    printf 'SERVER_ADDRESS=127.0.0.1\n'
    printf 'SERVER_PORT=8080\n'
    printf 'SERVER_FORWARD_HEADERS_STRATEGY=framework\n'
    printf 'SESSION_COOKIE_SECURE=true\n'
    printf 'HILIVING_MEDIA_STORAGE_PATH=/var/lib/hiliving/uploads\n'
    printf 'HILIVING_MEDIA_MULTIPART_MAX_FILE_SIZE=8MB\n'
    printf 'HILIVING_MEDIA_MULTIPART_MAX_REQUEST_SIZE=9MB\n'
    printf 'HILIVING_STANDARD_SHIPPING_FEE=5000.00\n'
    printf 'QPAY_ENABLED=false\n'
    printf 'QPAY_BASE_URL=https://merchant.qpay.mn\n'
    printf 'QPAY_CLIENT_ID=\n'
    printf 'QPAY_CLIENT_SECRET=\n'
    printf 'QPAY_INVOICE_CODE=\n'
    printf 'QPAY_CALLBACK_BASE_URL=https://%s\n' "$server_name"
    printf 'APP_PUBLIC_URL=https://%s\n' "$server_name"
    printf 'EMAIL_DELIVERY_ENABLED=false\n'
    printf 'EMAIL_MANUAL_TEST_ENABLED=false\n'
    printf 'EMAIL_TOKEN_PROTECTION_KEY=%s\n' "$token_key"
    printf 'MAIL_FROM_ADDRESS=no-reply@hiliving.mn\n'
    printf 'MAIL_FROM_NAME=HiLiving\n'
    printf 'MAIL_SUPPORT_ADDRESS=support@hiliving.mn\n'
  } >"$environment_file"

  chown root:hiliving "$environment_file"
  chmod 0640 "$environment_file"
  mv "$environment_file" /etc/hiliving/hiliving.env
  trap - EXIT
fi
