# Infrastructure

This directory contains the reviewed Hostinger deployment assets under `production/` and the gitignored development upload root at `data/uploads/`. The production assets define PostgreSQL 17, NGINX, systemd, Let's Encrypt renewal, restricted first-run secrets, and versioned application releases. Off-server backup automation remains deliberately unconfigured until the owner selects a destination.

The target architecture is documented in `docs/ARCHITECTURE.md`.

The deployed layout is `/opt/hiliving/frontend` for versioned static releases, `/opt/hiliving/backend` for backend releases, and `/var/lib/hiliving/uploads` for durable managed media. The upload directory is owned by the restricted application service account and writable only by that account. Spring receives the absolute path through `HILIVING_MEDIA_STORAGE_PATH`; NGINX proxies the same-origin `/media/` URL prefix to the localhost backend so Spring retains path validation and immutable cache ownership.

PostgreSQL and `/var/lib/hiliving/uploads` must be backed up as one logical recovery point and copied off the VPS. Deployment work must include a restore rehearsal rather than treating a successful backup command as proof of recovery.
