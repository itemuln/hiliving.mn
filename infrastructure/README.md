# Infrastructure

This directory is reserved for reviewed production deployment assets. Phase 5.1 adds only the gitignored development upload root at `data/uploads/`; it does not add or deploy Contabo, NGINX, systemd, Let's Encrypt, or backup automation.

The target architecture is documented in `docs/ARCHITECTURE.md`.

The first production layout is `/opt/hiliving/frontend` for versioned static releases, `/opt/hiliving/backend` for backend releases, and `/var/lib/hiliving/uploads` for durable managed media. The upload directory must be owned by the restricted application service account, writable only by that account, and readable by NGINX without directory listing or write methods. Spring receives the absolute path through `HILIVING_MEDIA_STORAGE_PATH`; NGINX exposes it at the same-origin `/media/` URL prefix.

PostgreSQL and `/var/lib/hiliving/uploads` must be backed up as one logical recovery point and copied off the VPS. Deployment work must include a restore rehearsal rather than treating a successful backup command as proof of recovery.
