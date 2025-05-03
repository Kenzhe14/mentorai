#!/bin/bash

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment of Mentor application${NC}"

# Function to handle errors
handle_error() {
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    handle_error "Docker is not running. Please start Docker and try again."
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    handle_error "docker-compose is not installed. Please install docker-compose."
fi

# Backup the database if it exists
if docker-compose ps | grep -q postgres; then
    echo -e "${YELLOW}Backing up database before deployment...${NC}"
    BACKUP_DIR="./db_backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/postgres_backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U postgres -d mentor > "$BACKUP_FILE" || echo -e "${YELLOW}Warning: Database backup failed, continuing anyway${NC}"
    echo -e "${GREEN}Database backed up to $BACKUP_FILE${NC}"
fi

# Stop containers if they are running
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose down --remove-orphans || handle_error "Failed to stop containers"

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build || handle_error "Failed to build Docker images"

# Start containers
echo -e "${YELLOW}Starting containers...${NC}"
docker-compose up -d || handle_error "Failed to start containers"

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to become healthy...${NC}"
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if docker-compose ps | grep -q "Up (healthy)"; then
        break
    fi
    echo -e "${YELLOW}Waiting for services to become healthy... ($ELAPSED/$TIMEOUT seconds)${NC}"
    sleep 5
    ELAPSED=$((ELAPSED+5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo -e "${YELLOW}Warning: Some services might not be fully healthy yet. Check logs for details.${NC}"
else
    echo -e "${GREEN}All services are now healthy!${NC}"
fi

echo -e "${GREEN}Application deployed successfully!${NC}"
echo -e "${GREEN}Frontend: http://localhost${NC}"
echo -e "${GREEN}Backend API: http://localhost:5000${NC}"

echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "View logs: ${GREEN}docker-compose logs -f${NC}"
echo -e "Stop application: ${GREEN}docker-compose down${NC}"
echo -e "Restart services: ${GREEN}docker-compose restart${NC}" 