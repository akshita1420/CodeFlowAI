pipeline {
    // Define agent labels at the top
    agent none // We will specify agents for each stage

    environment {
        DOCKER_IMAGE_NAME = "as3532/codeflowai-app"
        // Add the hostname/IP of your application server
        DEPLOY_SERVER_HOST = "your-app-server.com" 
        // Add the 'Credentials ID' for your SSH key
        SSH_CREDENTIALS_ID = "ssh-key-for-deploy-server" 
    }

    stages {
        
        stage('Build') {
            // Use a docker agent that has Maven and JDK 17 pre-installed
            agent {
                docker { 
                    image 'maven:3.9-eclipse-temurin-17' 
                    args '-v $HOME/.m2:/root/.m2' // Persist maven cache
                }
            }
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

        stage('Build & Push Docker Image') {
            // This stage needs an agent with Docker installed
            agent { label 'docker-agent' } // Change 'docker-agent' to your agent's label
            steps {
                script {
                    def imageNameWithTag = "${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER}"
                    def imageLatest = "${DOCKER_IMAGE_NAME}:latest"

                    // Build the image
                    sh "docker build -t ${imageNameWithTag} ."
                    
                    // Tag as 'latest' as well
                    sh "docker tag ${imageNameWithTag} ${imageLatest}"
                    
                    // Login and push
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKR_USER', passwordVariable: 'DOCKR_PASS')]) {
                        sh "echo $DOCKR_PASS | docker login -u $DOCKR_USER --password-stdin"
                        
                        // Push the specific build number tag
                        sh "docker push ${imageNameWithTag}"
                        
                        // Push the 'latest' tag
                        sh "docker push ${imageLatest}"
                    }
                }
            }
        }

        stage('Deploy to Server') {
            // This agent just needs SSH capabilities
            agent any 
            steps {
                // Use ssh-agent to securely connect to the remote server
                sshagent(credentials: [SSH_CREDENTIALS_ID]) {
                    
                    // Inject App & Docker credentials into the SSH session
                    withCredentials([
                        string(credentialsId: 'gemini-api-key', variable: 'GEMINI_KEY'),
                        string(credentialsId: 'db-password',    variable: 'DB_PASS'),
                        string(credentialsId: 'mail-username',  variable: 'MAIL_USER'),
                        string(credentialsId: 'mail-password',  variable: 'MAIL_PASS'),
                        usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKR_USER', passwordVariable: 'DOCKR_PASS')
                    ]) {
                        
                        sh """
                            ssh -o StrictHostKeyChecking=no user@${DEPLOY_SERVER_HOST} '''
                                # 1. Now we are on the remote server
                                echo "Connected to ${DEPLOY_SERVER_HOST}"
                                
                                # 2. Go to the app directory (assume it exists)
                                cd /path/to/your/app
                                
                                # 3. Create the .env file with secrets
                                echo "Writing .env file..."
                                echo "GEMINI_API_KEY=${GEMINI_KEY}" > .env
                                echo "DB_PASSWORD=${DB_PASS}" >> .env
                                echo "MAIL_USERNAME=${MAIL_USER}" >> .env
                                echo "MAIL_PASSWORD=${MAIL_PASS}" >> .env
                                
                                # 4. Pass the specific image tag to docker-compose
                                echo "APP_IMAGE_TAG=${env.BUILD_NUMBER}" >> .env
                                
                                # 5. Login to Docker Hub on the remote server
                                echo "${DOCKR_PASS}" | docker login -u "${DOCKR_USER}" --password-stdin
                                
                                # 6. Pull the new specific image version
                                docker pull ${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER}
                                
                                # 7. Stop old containers and start new ones
                                docker-compose down
                                docker-compose up -d
                                
                                # 8. Clean up
                                docker logout
                                echo "Deployment complete."
                            '''
                        """
                    }
                }
            }
        }
    }

    post {
        // Always log out of Docker Hub on the Jenkins agent
        always {
            agent { label 'docker-agent' } // Must run on the same agent as the push
            steps {
                sh "docker logout"
            }
        }
    }
}
