pipeline {
    // Default agent for all stages, unless overridden
    agent any

    environment {
        DOCKER_IMAGE_NAME = "as3532/code-reviewer" // Your Docker Hub username + image name
    }

    stages {

        stage('Build Maven') {
            agent {
                docker {
                    image 'maven:3.9-eclipse-temurin-17'
                    args '-v $HOME/.m2:/root/.m2'
                }
            }
            steps {
                sh "mvn clean install -DskipTests"
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Use "docker compose" (with a space)
                    sh "docker compose build --build-arg DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME} --build-arg BUILD_NUMBER=${env.BUILD_NUMBER}"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                    sh "docker tag ${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER} ${DOCKER_IMAGE_NAME}:latest"
                    sh "docker push ${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER}"
                    sh "docker push ${DOCKER_IMAGE_NAME}:latest"
                }
            }
        }

        stage('Deploy Application') {
            steps {
                withCredentials([
                    string(credentialsId: 'gemini-api-key', variable: 'GEMINI_KEY'),
                    string(credentialsId: 'db-password',    variable: 'DB_PASS'),
                    string(credentialsId: 'mail-username',  variable: 'MAIL_USER'),
                    string(credentialsId: 'mail-password',  variable: 'MAIL_PASS')
                ]) {
                    sh '''
                        echo "GEMINI_API_KEY=${GEMINI_KEY}" > .env
                        echo "DB_PASSWORD=${DB_PASS}" >> .env
                        echo "MAIL_USERNAME=${MAIL_USER}" >> .env
                        echo "MAIL_PASSWORD=${MAIL_PASS}" >> .env

                        echo "DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME}" >> .env
                        echo "BUILD_NUMBER=${env.BUILD_NUMBER}" >> .env
                    '''
                }
                // Use "docker compose" (with a space)
                sh 'docker compose down'
                sh 'docker compose up -d'
            }
        }
    }

    post {
        always {
            sh "docker logout"
        }
    }
}