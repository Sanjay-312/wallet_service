#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Wallet Service - Setup Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker to continue"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose to continue"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose found${NC}\n"

# Start services
echo -e "${BLUE}Starting services...${NC}"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to start services${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Services started${NC}\n"

# Wait for services to be ready
echo -e "${BLUE}Waiting for services to be healthy...${NC}"
sleep 10

# Run seed script
echo -e "${BLUE}Running database seed...${NC}"
docker exec wallet-service-app npm run seed

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to seed database${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Database seeded${NC}\n"

# Verify setup
echo -e "${BLUE}Verifying setup...${NC}"
HEALTH=$(curl -s http://localhost:3000/api/v1/health)

if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ Application is healthy${NC}\n"
else
    echo -e "${RED}✗ Application health check failed${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo "Application is running at: http://localhost:3000"
echo "PostgreSQL is running at: localhost:5432"
echo "Redis is running at: localhost:6379"
echo ""
echo "API Documentation:"
echo "  - Health: GET /api/v1/health"
echo "  - Top-up: POST /api/v1/wallet/topup"
echo "  - Bonus: POST /api/v1/wallet/bonus"
echo "  - Spend: POST /api/v1/wallet/spend"
echo "  - Balance: GET /api/v1/wallet/balance/{userId}/{assetSymbol}"
echo ""
