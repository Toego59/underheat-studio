#!/bin/bash

# ============================================================
# UNDERHEAT Studio - Full Test Runtime
# Starts backend + frontend for local testing
# ============================================================

set -e

RESET='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BLUE}  UNDERHEAT Studio - Test Runtime${RESET}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

# ============================================================
# 1. CHECK ENVIRONMENT
# ============================================================
echo -e "\n${YELLOW}1. Checking environment...${RESET}"

if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js 18+ first."
  exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${RESET}"

# ============================================================
# 2. SETUP BACKEND
# ============================================================
echo -e "\n${YELLOW}2. Setting up backend...${RESET}"

if [ ! -d "backend/node_modules" ]; then
  echo "Installing backend dependencies..."
  cd backend
  npm install > /dev/null 2>&1
  cd ..
  echo -e "${GREEN}✓ Backend dependencies installed${RESET}"
else
  echo -e "${GREEN}✓ Backend dependencies ready${RESET}"
fi

# Create .env if it doesn't exist
if [ ! -f "backend/.env" ]; then
  echo "Creating .env for backend..."
  cat > backend/.env << 'EOF'
PORT=4000
RESEND_API_KEY=re_demo_key_for_testing
NODE_ENV=development
EOF
  echo -e "${GREEN}✓ .env created${RESET}"
else
  echo -e "${GREEN}✓ .env exists${RESET}"
fi

# ============================================================
# 3. SETUP FRONTEND
# ============================================================
echo -e "\n${YELLOW}3. Setting up frontend...${RESET}"

if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd frontend
  npm install > /dev/null 2>&1
  cd ..
  echo -e "${GREEN}✓ Frontend dependencies installed${RESET}"
else
  echo -e "${GREEN}✓ Frontend dependencies ready${RESET}"
fi

# ============================================================
# 4. START SERVICES
# ============================================================
echo -e "\n${YELLOW}4. Starting services...${RESET}"
echo ""

# Trap to cleanup child processes on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${RESET}"
  jobs -p | xargs -r kill 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start backend
echo -e "${BLUE}Backend${RESET} (port 4000)..."
cd backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Backend failed to start. Check /tmp/backend.log${RESET}"
  cat /tmp/backend.log
  exit 1
fi
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${RESET}"

# Start frontend
echo -e "${BLUE}Frontend${RESET} (port 5500)..."
cd frontend
node proxy-simple.js > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 1
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Frontend failed to start. Check /tmp/frontend.log${RESET}"
  cat /tmp/frontend.log
  exit 1
fi
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${RESET}"

# ============================================================
# 5. READY TO TEST
# ============================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}  ✓ All services running${RESET}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${BLUE}Frontend:${RESET}  http://localhost:5500"
echo -e "  ${BLUE}Admin:${RESET}    http://localhost:5500/admin.html"
echo -e "  ${BLUE}Backend:${RESET}  http://localhost:4000"
echo ""
echo -e "  ${YELLOW}Logs:${RESET}"
echo -e "    Backend:  /tmp/backend.log"
echo -e "    Frontend: /tmp/frontend.log"
echo ""
echo -e "Press ${YELLOW}Ctrl+C${RESET} to stop all services."
echo ""

# Keep running
wait
