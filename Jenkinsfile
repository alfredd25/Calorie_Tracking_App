pipeline {
    agent any

    environment {
        EC2_HOST = '3.26.147.100'
        EC2_USER = 'ubuntu'
        NEXT_PUBLIC_API_URL = 'https://nutritracks.tech/api'
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_HUB_USERNAME = 'alfredd25'
        BACKEND_IMAGE = "${DOCKER_HUB_USERNAME}/calorie-tracker-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USERNAME}/calorie-tracker-frontend"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Run Tests') {
            steps {
                sh '''
                    docker compose -f docker-compose.test.yml up --build --abort-on-container-exit api_test
                    docker compose -f docker-compose.test.yml down
                '''
            }
        }

        stage('Build & Tag Images') {
            steps {
                sh """
                    docker build -t ${BACKEND_IMAGE}:latest ./backend
                    docker build \
                        --no-cache \
                        --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
                        -t ${FRONTEND_IMAGE}:latest \
                        ./frontend
                """
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh '''
                    echo $DOCKER_HUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_CREDENTIALS_USR --password-stdin
                    docker push ${BACKEND_IMAGE}:latest
                    docker push ${FRONTEND_IMAGE}:latest
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} "
                            cd ~/NutriTrack &&
                            docker compose pull &&
                            docker compose up -d --force-recreate &&
                            docker exec calorie_api alembic upgrade head
                        "
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded! NutriTrack is updated at https://nutritracks.tech'
        }
        failure {
            echo 'Pipeline failed! Check the console output above.'
        }
        cleanup {
            sh 'docker compose -f docker-compose.test.yml down || true'
        }
    }
}