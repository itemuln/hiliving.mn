# Local CI pipeline

The root `Jenkinsfile` runs the `hiliving-frontend` quality and delivery flow
from `frontend/`:

```text
npm ci -> lint -> build -> SonarQube analysis -> quality gate -> package -> JFrog
```

Local endpoints:

- Jenkins: <http://127.0.0.1:8080>
- SonarQube: <http://127.0.0.1:9000>
- JFrog Platform: <http://127.0.0.1:8082>

The pipeline reads the JFrog access token from Jenkins credential
`jfrog-ci-token`; no token is stored in this repository. The packaged frontend
is published to:

```text
example-repo-local/hiliving-frontend/<build-number>/
```

The current job copies this local working tree into the Jenkins workspace so it
can test uncommitted work safely. It excludes frontend dependencies and output,
backend build output, and local environment files. After `Jenkinsfile` is committed and pushed,
switch the job definition to “Pipeline script from SCM” for normal GitHub-based
builds.

This pipeline remains intentionally frontend-specific after the monorepo migration. Backend Maven and Testcontainers stages are tracked as follow-up work in `TODO.md`.
