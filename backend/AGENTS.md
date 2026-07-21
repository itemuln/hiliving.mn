# Repository Guidelines

## Project Structure & Module Organization

This directory is the independently buildable Spring Boot backend; keep Java code out of the sibling `frontend/` project. Production code lives under `src/main/java/com/hiliving`, grouped by domain (`catalog`, `commerce`, `identity`, `content`, `media`, and `email`) and then, where useful, by `api`, `application`, and `persistence`. Runtime configuration is in `src/main/resources/application*.yml`. Flyway migrations are append-only files in `src/main/resources/db/migration` named like `V11__add_order_index.sql`. Tests mirror production packages under `src/test/java/com/hiliving`.

## Build, Test, and Development Commands

- `./mvnw spring-boot:run` starts the API (normally port 8080).
- `./mvnw --batch-mode --no-transfer-progress verify` compiles and runs the full automated suite.
- `./mvnw -Dtest=CatalogApiIntegrationTests test` runs one test class while iterating.
- From the repository root, `docker compose up -d --wait postgres` starts PostgreSQL. Load the ignored root `.env` before running locally; use `SERVER_PORT=18080` when 8080 is occupied.

Java 21 and a running Docker engine are required for Testcontainers-based tests.

## Coding Style & Naming Conventions

Use four-space indentation, one public top-level type per file, and existing Spring constructor-injection patterns. Classes and records use `PascalCase`; methods, variables, and fields use `camelCase`; constants use `UPPER_SNAKE_CASE`. Keep controllers thin, business rules in services, and database access in repositories. Preserve the `/api/v1` prefix and the shared response/error envelopes. No formatter is enforced, so match nearby code and organize imports consistently.

## Testing Guidelines

Tests use JUnit 5, Spring Boot Test, MockMvc, and Testcontainers PostgreSQL. Name normal suites `*Tests`; use descriptive lower-camel-case test methods such as `productsSupportPaginationFiltersAndControlledSorting`. Add repository/service tests for persistence rules and MockMvc integration tests for status codes, security, validation, and JSON contracts. Docker must be available before running `verify`.

## Commit & Pull Request Guidelines

History uses short sentence-style summaries without Conventional Commit prefixes. Prefer a focused imperative subject, for example `Validate order status transitions`, and avoid bundling unrelated frontend and backend work. Pull requests should explain behavior and migration/configuration impact, link the relevant issue, list verification commands, and include sample requests or responses for API contract changes.

## Security & Agent Notes

Never commit credentials or tokens. Keep developer secrets in the gitignored root `.env`; `.env.example` must contain placeholders or safe defaults only. Before and after project changes, keep `docs/PROJECT_STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and `docs/TODO.md` aligned with the implementation.

<!-- BEGIN sqz-agents-guidance (auto-installed by sqz init; remove this block to disable) -->

## sqz — Token-Optimized CLI Output

When running shell commands whose output may be long (directory listings,
git log/diff, test runners, build logs, `docker ps`, `kubectl get`, etc.),
pipe the output through `sqz compress` to reduce token consumption.

`sqz` is a stdin-to-stdout compressor, not a command wrapper. The correct
usage is to pipe the command's output into `sqz compress`:

```bash
# Instead of:     Use:
git status        git status 2>&1 | /opt/homebrew/bin/sqz compress
cargo test        cargo test 2>&1 | /opt/homebrew/bin/sqz compress
git log -10       git log -10 2>&1 | /opt/homebrew/bin/sqz compress
docker ps         docker ps 2>&1 | /opt/homebrew/bin/sqz compress
ls -la            ls -la 2>&1 | /opt/homebrew/bin/sqz compress
```

The `2>&1` captures stderr too, which is useful for commands like `cargo
test` where diagnostics go to stderr. `sqz compress` filters and compresses
the combined output while preserving filenames, paths, and identifiers.
It typically saves 60-90% tokens on verbose commands.

Do NOT pipe output for:
- Interactive commands (`vim`, `ssh`, `python`, REPLs)
- Compound commands with shell operators (`cmd && other`, `cmd > file.txt`,
  `cmd; other`) — run those directly
- Short commands whose output is already a few lines

If `sqz` is not on PATH, run commands normally.

The `sqz-mcp` MCP server is also available — Codex reads it from
`~/.codex/config.toml` under `[mcp_servers.sqz]`. It exposes three
tools: `compress` (the default pipeline), `passthrough` (return text
unchanged — the escape hatch below), and `expand` (resolve a
`§ref:HASH§` token back to the original bytes).

## Escape hatch — when sqz output confuses you

If you see a `§ref:HASH§` token and can't parse it, or compressed
output is leading you to make lots of small retries instead of one
big request, use one of these:

- **`/opt/homebrew/bin/sqz expand <prefix>`** — resolve a dedup ref back to the
  original bytes. Accepts bare hex (`sqz expand a1b2c3d4`) or the full
  token pasted verbatim (`sqz expand §ref:a1b2c3d4§`).
- **`SQZ_NO_DEDUP=1`** — set this env var for one command to disable
  dedup: `SQZ_NO_DEDUP=1 git status 2>&1 | sqz compress`. You'll get
  the full compressed output with no `§ref:…§` tokens.
- **`--no-cache`** — same opt-out as a CLI flag:
  `git status 2>&1 | sqz compress --no-cache`.

If you're using the MCP server, the `passthrough` tool returns raw
text and the `expand` tool resolves refs — call them when you need
data sqz hasn't touched.

<!-- END sqz-agents-guidance -->
