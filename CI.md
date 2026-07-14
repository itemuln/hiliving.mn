# Local CI pipeline

The `hiliving-frontend` Jenkins pipeline runs the following quality and delivery
flow:

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
can test uncommitted work safely. After `Jenkinsfile` is committed and pushed,
switch the job definition to “Pipeline script from SCM” for normal GitHub-based
builds.
