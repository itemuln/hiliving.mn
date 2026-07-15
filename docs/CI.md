# Continuous Integration

## Repository-wide GitHub Actions

`.github/workflows/ci.yml` keeps application validation independent:

- Frontend job: Node 24, `npm ci`, ESLint, Vitest, and Vite production build from `frontend/`
- Backend job: Temurin Java 21 and Maven `verify` from `backend/`

Frontend tests mock the HTTP boundary and cover adapter/query behavior plus observable catalog loading, success, empty, safe failure/retry, and product 404 states. Backend tests use PostgreSQL Testcontainers, apply all Flyway migrations, start Hibernate with schema validation, and exercise persistence/service/API rules.

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
