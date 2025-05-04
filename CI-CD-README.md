# MentorAI CI/CD Pipeline

This document describes the CI/CD setup for the MentorAI project using GitLab CI/CD and Docker.

## Infrastructure Overview

The application is containerized using Docker and consists of the following components:
- **Frontend**: React application
- **Backend**: Go API server
- **Database**: PostgreSQL
- **Nginx**: Web server for SSL termination and routing

## CI/CD Pipeline

The CI/CD pipeline is defined in `.gitlab-ci.yml` and consists of the following stages:

1. **Validate**: Linting and code quality checks
2. **Build**: Building and pushing Docker images
3. **Test**: Running tests for frontend and backend
4. **Deploy**: Deploying to staging and production environments

## Requirements

To set up the CI/CD pipeline, you need:

1. A GitLab account with a repository for the project
2. A GitLab Runner configured for your repository
3. Docker Registry access (GitLab's Container Registry is used by default)
4. Staging and production servers with SSH access
5. Environment variables configured in GitLab CI/CD settings

## GitLab CI/CD Variables

Configure the following variables in GitLab (Settings > CI/CD > Variables):

```
# Registry Access
CI_REGISTRY - GitLab registry URL (automatically provided)
CI_REGISTRY_USER - Registry username (automatically provided)
CI_REGISTRY_PASSWORD - Registry password (automatically provided)

# Staging Environment
STAGING_SERVER - Hostname/IP of the staging server
STAGING_SSH_PRIVATE_KEY - Private SSH key for accessing the staging server

# Production Environment
PRODUCTION_SERVER - Hostname/IP of the production server
PRODUCTION_SSH_PRIVATE_KEY - Private SSH key for accessing the production server
```

## Server Setup

On both staging and production servers:

1. Install Docker and docker-compose:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

2. Create a user for deployment:
   ```bash
   adduser deployer
   usermod -aG docker deployer
   mkdir -p /home/deployer/.ssh
   # Add authorized_keys for SSH access
   ```

3. Create the application directory:
   ```bash
   mkdir -p /home/deployer/mentor-app
   chown deployer:deployer /home/deployer/mentor-app
   ```

4. Set up SSL certificates using Let's Encrypt:
   ```bash
   apt-get update
   apt-get install certbot
   certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   # Make sure to configure certificate paths in nginx/conf.d/mentorapp.conf
   ```

## Environment Files

Create the following environment files for different environments:

1. `.env.staging` - For the staging environment
2. `.env.production` - For the production environment

Use the `.env.template` as a reference and fill in the appropriate values.

## Manual Deployment

To manually deploy the application:

1. Build and tag the Docker images:
   ```bash
   docker build -t registry.gitlab.com/your-group/mentorai/backend:latest -f Dockerfile.backend .
   docker build -t registry.gitlab.com/your-group/mentorai/frontend:latest -f Dockerfile.frontend .
   ```

2. Push the images to the registry:
   ```bash
   docker push registry.gitlab.com/your-group/mentorai/backend:latest
   docker push registry.gitlab.com/your-group/mentorai/frontend:latest
   ```

3. Copy docker-compose and environment files to the server:
   ```bash
   scp docker-compose.prod.yml deployer@your-server:~/mentor-app/docker-compose.yml
   scp .env.production deployer@your-server:~/mentor-app/.env
   ```

4. SSH to the server and start the services:
   ```bash
   ssh deployer@your-server
   cd ~/mentor-app
   docker-compose down
   docker-compose up -d
   ```

## Continuous Deployment

The CI/CD pipeline automates the above steps:

1. Merge to `develop` branch → Deploy to staging (manual trigger)
2. Merge to `main`/`master` branch or create a tag → Deploy to production (manual trigger)

## Monitoring and Logging

For monitoring and logging:

1. Use docker logs to check container logs:
   ```bash
   docker-compose logs -f [service_name]
   ```

2. Consider setting up:
   - Prometheus and Grafana for metrics
   - ELK stack (Elasticsearch, Logstash, Kibana) for centralized logging
   - Uptime monitoring with tools like Uptime Robot or Pingdom

## Backup Strategy

Regular database backups should be configured:

```bash
# Create a backup script
mkdir -p /home/deployer/backups
cat > /home/deployer/backup-db.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_DIR="/home/deployer/backups"
docker exec mentor-app_postgres_1 pg_dump -U mentoruser mentordb > $BACKUP_DIR/mentordb_$TIMESTAMP.sql
# Optionally upload to external storage (S3, Google Cloud Storage, etc.)
# Remove backups older than 7 days
find $BACKUP_DIR -name "mentordb_*.sql" -mtime +7 -delete
EOF

chmod +x /home/deployer/backup-db.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /home/deployer/backup-db.sh") | crontab -
``` 