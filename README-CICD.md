# GitLab CI/CD Setup for MentorAI

This document outlines the CI/CD pipeline configuration for the MentorAI project.

## Overview

The CI/CD pipeline is configured to:

1. Run tests for both frontend and backend
2. Build Docker images for both components
3. Deploy to staging automatically
4. Deploy to production manually

## Files

- `.gitlab-ci.yml`: The main CI/CD configuration file
- `Dockerfile.frontend`: Docker configuration for the React frontend
- `Dockerfile.backend`: Docker configuration for the Go backend
- `docker-compose.yml`: Service orchestration for deployment
- `nginx/nginx.conf`: Nginx configuration for the frontend

## Environment Variables

The following environment variables should be set in your GitLab CI/CD settings:

### Docker Registry

- `CI_REGISTRY`: Your GitLab container registry URL (automatically provided by GitLab)
- `CI_REGISTRY_USER`: Registry username (automatically provided by GitLab)
- `CI_REGISTRY_PASSWORD`: Registry password (automatically provided by GitLab)

### Staging Environment

- `STAGING_SSH_PRIVATE_KEY`: SSH private key for accessing the staging server
- `STAGING_SSH_KNOWN_HOSTS`: SSH known hosts for the staging server
- `STAGING_SSH_USER`: SSH username for the staging server
- `STAGING_SSH_HOST`: Hostname or IP address of the staging server

### Production Environment

- `PRODUCTION_SSH_PRIVATE_KEY`: SSH private key for accessing the production server
- `PRODUCTION_SSH_KNOWN_HOSTS`: SSH known hosts for the production server
- `PRODUCTION_SSH_USER`: SSH username for the production server
- `PRODUCTION_SSH_HOST`: Hostname or IP address of the production server

### Application Configuration

Add these variables to your deployment environment:

- `FRONTEND_PORT`: Port for the frontend (default: 80)
- `BACKEND_PORT`: Port for the backend (default: 8080)
- `DB_HOST`: Database host (default: postgres)
- `DB_PORT`: Database port (default: 5432)
- `DB_USER`: Database username (default: postgres)
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name (default: mentorai)
- `JWT_SECRET`: Secret for JWT token generation
- `APP_ENV`: Application environment (production/development)

## Deployment

### Staging

The pipeline automatically deploys to staging when changes are pushed to the `staging` branch.

### Production

Production deployment requires manual approval. After the pipeline completes successfully on the `main` branch, 
you can trigger the production deployment from the GitLab pipeline interface.

## Server Setup

Ensure your deployment servers have:

1. Docker and Docker Compose installed
2. Proper network configuration to allow the required ports
3. Sufficient disk space for Docker images and volumes
4. The user specified in SSH variables has permissions to run Docker commands

## Troubleshooting

### Common Issues

1. **Failed Docker login**: Ensure your GitLab registry credentials are correct
2. **SSH connection failures**: Verify SSH keys and known hosts are properly configured
3. **Docker build failures**: Check that Dockerfiles are correct and all required files are present
4. **Container startup issues**: Examine Docker logs on the deployment server

To view logs on the server:

```bash
docker-compose logs -f
```

### Useful Commands

Reset the pipeline environment:

```bash
# On deployment server
docker-compose down
docker-compose up -d --force-recreate
```

View specific service logs:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Scaling Considerations

For production deployments with higher traffic:

1. Consider using a more robust database setup (e.g., managed PostgreSQL)
2. Implement proper backup strategies for database and uploaded files
3. Set up monitoring and alerting (Prometheus, Grafana, etc.)
4. Configure a load balancer for the frontend if needed 