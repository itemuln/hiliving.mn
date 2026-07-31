# Hostinger production deployment

The first HiLiving deployment uses one Ubuntu 24.04 VPS:

- NGINX serves the Vite build and terminates HTTPS.
- Spring Boot runs as the restricted `hiliving` system account on `127.0.0.1:8080`.
- PostgreSQL 17 runs in Docker and binds only to `127.0.0.1:5432`.
- Managed uploads persist at `/var/lib/hiliving/uploads`.
- Secrets live only in `/etc/hiliving/hiliving.env` with `root:hiliving` ownership and mode `0640`.

`initialize-server.sh` creates the restricted account, durable directories, a random database password, and a stable email-token protection key. It does not overwrite an existing environment file. Committed defaults keep QPay and outbound email disabled. Hostinger staging now explicitly enables Brevo SMTP from the restricted environment after sender, credential, VPS IP, health, outbox, and mailbox verification; QPay remains disabled.

Versioned frontend and backend releases live under `/opt/hiliving/frontend/releases` and `/opt/hiliving/backend/releases`. Their respective `current` symlinks make a release switch atomic. The Spring service and NGINX site use only those symlinks.

Install `reload-nginx-after-renewal.sh` in `/etc/letsencrypt/renewal-hooks/deploy/` so a successfully renewed certificate is validated and loaded without waiting for a server restart.

The canonical origin is `https://hilivingmgl.mn`; `www.hilivingmgl.mn` and the original Hostinger hostname redirect to it. Both public domain names have a renewable Let's Encrypt certificate, and renewal dry runs pass. The deployment began with only the approved public demo catalog/content; workstation test users, sessions, addresses, orders, payment attempts, tokens, audits, and email rows were excluded. Owner-requested accounts were later created through normal registration and promoted individually to `ADMIN`; no shared seed credential is shipped.

A manual coordinated PostgreSQL plus `/var/lib/hiliving/uploads` backup was copied to restricted ignored storage on the deployment workstation, and its isolated PostgreSQL 17/filesystem restore rehearsal passed. The deployment must not accept production payments until this becomes a scheduled encrypted backup to a durable owner-controlled off-server destination with monitoring and retention. Datacom remains the authoritative DNS provider for `hilivingmgl.mn`; only the apex and `www` web A records were changed for this cutover.
