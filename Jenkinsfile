pipeline {
    agent any
    tools {
        maven 'Maven3'
        jdk 'JDK17'
    }
    environment {
        DOCKER_IMAGE_NAME = "as3532/codeflowai-app" 
    }
    stages {
        stage('Build') {
            steps {
                withCredentials([
                    string(credentialsId: 'gemini-api-key', variable: 'GEMINI_KEY'),
                    string(credentialsId: 'db-password',    variable: 'DB_PASS'),
                    string(credentialsId: 'mail-username',  variable: 'MAIL_USER'),
                    string(credentialsId: 'mail-password',  variable: 'MAIL_PASS')
                ]) {
                    sh '''
                        mvn clean install \
                        -Dgemini.api.key="$GEMINI_KEY" \
                        -Dspring.datasource.password="$DB_PASS" \
                        -Dspring.mail.username="$MAIL_USER" \
                        -Dspring.mail.password="$MAIL_PASS"
                    '''
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER} ."
                sh "docker tag ${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER} ${DOCKER_IMAGE_NAME}:latest"
            }
        }
        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKR_USER', passwordVariable: 'DOCKR_PASS')]) {
                    sh "echo $DOCKR_PASS | docker login -u $DOCKR_USER --password-stdin"
                    sh "docker push ${DOCKER_IMAGE_NAME}:latest"
                }
            }
        }
        stage('Run Application') {
            steps {
                sh 'docker-compose down'
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
                    '''
                    sh 'docker-compose up -d'
                }
            }
        }
    }
}
