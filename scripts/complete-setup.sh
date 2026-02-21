#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Setting up Internal Wallet Service...${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Starting Docker services...${NC}"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to start Docker services${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker services started${NC}\n"

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 15

# Check PostgreSQL connection
max_attempts=30
attempt=0
until PGPASSWORD="306312" psql -h localhost -U sanjay -d wallet_service -c "SELECT 1" > /dev/null 2>&1; do
    if [ $attempt -ge $max_attempts ]; then
        echo -e "${RED}✗ PostgreSQL failed to start${NC}"
        docker-compose logs postgres
        exit 1
    fi
    attempt=$((attempt+1))
    echo "Attempt $attempt/$max_attempts: Waiting for PostgreSQL..."
    sleep 1
done

echo -e "${GREEN}✓ PostgreSQL is ready${NC}\n"

# Run migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
npm run migration:run

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Migrations failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Migrations completed${NC}\n"

# Run seed
echo -e "${YELLOW}🌱 Seeding database...${NC}"
npm run seed

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Seeding failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Seeding completed${NC}\n"

# Verify health
echo -e "${YELLOW}🏥 Verifying application...${NC}"
sleep 3

health_response=$(curl -s http://localhost:3000/api/v1/health || echo "")

if echo "$health_response" | grep -q "success"; then
    echo -e "${GREEN}✓ Application is healthy${NC}\n"
else
    echo -e "${YELLOW}⚠ Application starting, please wait...${NC}\n"
fi

echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo -e "\n${YELLOW}📡 API is running at:${NC} http://localhost:3000"
echo -e "${YELLOW}📊 Available endpoints:${NC}"
echo "  - GET  /api/v1/health"
echo "  - POST /api/v1/wallet/topup"
echo "  - POST /api/v1/wallet/bonus"
echo "  - POST /api/v1/wallet/spend"
echo "  - GET  /api/v1/wallet/balance/{userId}/{assetSymbol}"
echo "  - GET  /api/v1/wallet/balances/{userId}"
echo "  - GET  /api/v1/wallet/transactions/{userId}"
echo "  - GET  /api/v1/wallet/ledger/{userId}"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC} See README.md, QUICKSTART.md, API_DOCUMENTATION.md"
echo -e "${YELLOW}🛑 To stop services:${NC} docker-compose down"
