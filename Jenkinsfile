pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  parameters {
    string(
      name: 'SOURCE_DIR',
      defaultValue: '/Users/itemuln/Documents/hilivingFrontEnd',
      description: 'Local source directory copied into the Jenkins workspace'
    )
  }

  environment {
    SOURCE_DIR = "${params.SOURCE_DIR}"
    PATH = "/Users/itemuln/.nvm/versions/node/v25.8.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${env.PATH}"
    JFROG_URL = 'http://127.0.0.1:8082/artifactory'
    JFROG_REPOSITORY = 'example-repo-local'
    SONAR_PROJECT_KEY = 'hiliving-frontend'
  }

  stages {
    stage('Prepare workspace') {
      steps {
        deleteDir()
        sh '''
          set -eu
          test -f "$SOURCE_DIR/package-lock.json"
          /usr/bin/rsync -a --delete \
            --exclude .git \
            --exclude node_modules \
            --exclude dist \
            --exclude .env \
            "$SOURCE_DIR/" "$WORKSPACE/"
          node --version
          npm --version
        '''
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci --no-audit --no-fund'
      }
    }

    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('SonarQube analysis') {
      steps {
        script {
          def scannerHome = tool 'SonarScanner'
          withSonarQubeEnv('Local SonarQube') {
            sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY}"
          }
        }
      }
    }

    stage('Quality gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Package') {
      steps {
        script {
          env.ARTIFACT_NAME = "hiliving-frontend-${env.BUILD_NUMBER}.tgz"
        }
        sh 'tar -czf "$ARTIFACT_NAME" dist package.json package-lock.json'
        archiveArtifacts artifacts: '*.tgz', fingerprint: true
      }
    }

    stage('Publish to JFrog') {
      steps {
        withCredentials([string(credentialsId: 'jfrog-ci-token', variable: 'JFROG_ACCESS_TOKEN')]) {
          sh '''
            set -eu
            set +x
            curl --fail --silent --show-error \
              --retry 3 --retry-connrefused \
              -H "Authorization: Bearer $JFROG_ACCESS_TOKEN" \
              -T "$ARTIFACT_NAME" \
              "$JFROG_URL/$JFROG_REPOSITORY/hiliving-frontend/$BUILD_NUMBER/$ARTIFACT_NAME"
          '''
        }
      }
    }
  }

  post {
    success {
      echo "Published ${env.ARTIFACT_NAME} to JFrog build ${env.BUILD_NUMBER}."
    }
  }
}
