# Continuous Integration

## Repository-wide GitHub Actions

`.github/workflows/ci.yml` keeps application validation independent:

- Frontend job: Node 24, `npm ci`, ESLint, Vitest, and Vite production build from `frontend/`
- Backend job: Temurin Java 21 and Maven `verify` from `backend/`

Frontend tests mock the HTTP boundary and cover existing catalog states plus session hydration, CSRF requests, login/logout, safe protected returns, profile/password mutations, address CRUD states, and session expiry. Backend tests use PostgreSQL Testcontainers, apply Flyway V1–V3, start Hibernate with schema validation, and exercise catalog, identity, session security, account, address ownership, and admin authorization rules.

The current clean verification baseline is 25 frontend tests and 27 backend tests. The backend suite was executed successfully inside `eclipse-temurin:21-jdk` on Java 21.0.11 with PostgreSQL 17 Testcontainers and JAR packaging. The frontend baseline was executed after `npm ci`, followed by lint, Vitest, TypeScript, and the production Vite build.

The workflow grants read-only repository contents permission and cancels superseded runs on the same branch or pull request.

## Local Jenkins frontend pipeline

The root `Jenkinsfile` runs the `hiliving-frontend` quality and delivery flow from `frontend/`:

```text
npm ci -> lint -> test -> build -> SonarQube analysis -> quality gate -> package -> JFrog
```

Sonar classifies `*.test.ts`, `*.test.tsx`, and `src/test` as test code rather than production source.

Local endpoints:

- Jenkins: <http://127.0.0.1:8080>
- SonarQube: <http://127.0.0.1:9000>
- JFrog Platform: <http://127.0.0.1:8082>

The pipeline reads the JFrog access token from Jenkins credential `jfrog-ci-token`; no token is stored in this repository. The packaged frontend is published to `example-repo-local/hiliving-frontend/<build-number>/`.

The current job copies the local working tree into the Jenkins workspace so it can test uncommitted work safely. It excludes dependencies, build output, backend output, and environment files. After `Jenkinsfile` is committed and pushed, switch the job definition to “Pipeline script from SCM” for normal GitHub-based builds.

Jenkins remains frontend-specific. Backend validation stays in GitHub Actions rather than coupling Maven and Docker requirements to the local delivery job.
