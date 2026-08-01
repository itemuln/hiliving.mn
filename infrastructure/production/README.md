# Hostinger production deployment

The first HiLiving deployment uses one Ubuntu 24.04 VPS:

- NGINX serves the Vite build and terminates HTTPS.
- Spring Boot runs as the restricted `hiliving` system account on `127.0.0.1:8080`.
- PostgreSQL 17 runs in Docker and binds only to `127.0.0.1:5432`.
- Managed uploads persist at `/var/lib/hiliving/uploads`.
- Secrets live only in `/etc/hiliving/hiliving.env` with `root:hiliving` ownership and mode `0640`.

`initialize-server.sh` creates the restricted account, durable directories, a random database password, and a stable email-token protection key. It does not overwrite an existing environment file. Committed defaults keep QPay and outbound email disabled. Hostinger staging now explicitly enables Brevo SMTP from the restricted environment after sender, credential, VPS IP, health, outbox, and mailbox verification; QPay remains disabled.

Versioned frontend and backend releases live under `/opt/hiliving/frontend/releases` and `/opt/hiliving/backend/releases`. Their respective `current` symlinks make a release switch atomic. The Spring service and NGINX site use only those symlinks.

## GitHub Actions deployment

A successful repository-wide CI run for a push to `main` builds the same commit again as release artifacts, transfers them over a pinned SSH connection, and invokes the root-owned `hiliving-deploy` command through a dedicated `hiliving-deploy` account. The command verifies checksums and archive paths, installs commit-addressed frontend/backend directories, starts the backend first, and switches the frontend only after the local backend health check passes. It then verifies the public homepage and catalog API. Any failed activation restores the prior frontend/backend links and restarts the prior backend.

Provision the VPS integration once from a trusted administration machine:

1. Generate a dedicated Ed25519 key pair used only by GitHub Actions.
2. Copy the public key plus `install-deploy-automation.sh` and `deploy-release.sh` to a temporary root-readable directory on the VPS.
3. Run `sudo ./install-deploy-automation.sh <public-key-file>`. The installer creates the restricted transfer account, installs the root-owned activator at `/usr/local/sbin/hiliving-deploy`, and permits only that validated command through passwordless `sudo`.
4. Create the GitHub `production` environment with `PRODUCTION_URL=https://hilivingmgl.mn`, then add `VPS_HOST`, `VPS_PORT`, `VPS_SSH_PRIVATE_KEY`, `VPS_SSH_KNOWN_HOSTS`, and the domain-bound Tiny Cloud value as `TINYMCE_API_KEY` environment secrets. Pin known-host entries obtained through a trusted connection and verified against the VPS fingerprint; do not learn either key during the workflow.

The workflow deliberately fails when any setting is absent or a health check fails. It never copies `/etc/hiliving/hiliving.env`, PostgreSQL data, or managed uploads. Infrastructure configuration is not self-updating: after reviewing a change to `deploy-release.sh`, reinstall that root-owned command manually before relying on the changed workflow. Flyway migrations remain forward-only, so a code-link rollback does not reverse a database migration.

Install `reload-nginx-after-renewal.sh` in `/etc/letsencrypt/renewal-hooks/deploy/` so a successfully renewed certificate is validated and loaded without waiting for a server restart.

The canonical origin is `https://hilivingmgl.mn`; `www.hilivingmgl.mn` and the original Hostinger hostname redirect to it. Both public domain names have a renewable Let's Encrypt certificate, and renewal dry runs pass. The deployment began with only the approved public demo catalog/content; workstation test users, sessions, addresses, orders, payment attempts, tokens, audits, and email rows were excluded. Owner-requested accounts were later created through normal registration and promoted individually to `ADMIN`; no shared seed credential is shipped.

A manual coordinated PostgreSQL plus `/var/lib/hiliving/uploads` backup was copied to restricted ignored storage on the deployment workstation, and its isolated PostgreSQL 17/filesystem restore rehearsal passed. The deployment must not accept production payments until this becomes a scheduled encrypted backup to a durable owner-controlled off-server destination with monitoring and retention. Datacom remains the authoritative DNS provider for `hilivingmgl.mn`; only the apex and `www` web A records were changed for this cutover.
