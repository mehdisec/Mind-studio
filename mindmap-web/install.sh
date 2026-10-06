#!/usr/bin/env bash
# ==============================================================================
# 🚀 MindMap Studio — Linux Server 1-Click Automated Self-Healing Installer
# Author: Mehdi Mirzaei (https://github.com/mehdisec)
# Repository: https://github.com/mehdisec/Mind-studio
# ==============================================================================

# ANSI Color Codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}${BOLD}"
echo "  __  __ _           _ __  __             ____  _             _ _       "
echo " |  \/  (_)_ __   __| |  \/  | __ _ _ __ / ___|| |_ _   _  __| (_) ___  "
echo " | |\/| | | '_ \ / _\` | |\/| |/ _\` | '_ \\\\___ \| __| | | |/ _\` | |/ _ \ "
echo " | |  | | | | | | (_| | |  | | (_| | |_) |___) | |_| |_| | (_| | | (_) |"
echo " |_|  |_|_|_| |_|\__,_|_|  |_|\__,_| .__/|____/ \__|\__,_|\__,_|_|\___/ "
echo "                                   |_|                                  "
echo -e "${NC}"
echo -e "${PURPLE}${BOLD}⚡ Modern Zero-Gravity Knowledge Graph & Interactive AI Diagram Studio${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo ""

# 1. Determine Root / Sudo privilege
if [ "$EUID" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

# Determine Working Directory
INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -d "$INSTALL_DIR/mindmap-web" ]; then
  echo -e "${YELLOW}📁 Cloning latest repository into /opt/mindmap-studio...${NC}"
  $SUDO mkdir -p /opt/mindmap-studio
  $SUDO rm -rf /opt/mindmap-studio/* /opt/mindmap-studio/.* 2>/dev/null || true
  git clone https://github.com/mehdisec/Mind-studio.git /opt/mindmap-studio
  cd /opt/mindmap-studio
  INSTALL_DIR="/opt/mindmap-studio"
fi

cd "$INSTALL_DIR"
echo -e "${GREEN}✔ Installation Directory:${NC} $INSTALL_DIR"
echo ""

# 2. Self-Healing Package Manager (Fix interrupted dpkg, locks, and corrupted states)
echo -e "${YELLOW}🔍 [1/6] Repairing & checking package manager...${NC}"

export DEBIAN_FRONTEND=noninteractive

if command -v dpkg &>/dev/null; then
  # Kill hanging apt/dpkg locks if any
  $SUDO fuser -vki /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock 2>/dev/null || true
  $SUDO rm -f /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock /var/cache/apt/archives/lock 2>/dev/null || true
  
  # Repair interrupted dpkg transactions
  $SUDO dpkg --configure -a --force-confold 2>/dev/null || true
  $SUDO apt-get install -f -y -qq 2>/dev/null || true
  
  # Update package repositories
  $SUDO apt-get update -qq || true
  $SUDO apt-get install -y -qq curl git build-essential openssl ca-certificates gnupg || true
elif command -v dnf &>/dev/null; then
  $SUDO dnf install -y -q curl git gcc-c++ make openssl ca-certificates || true
elif command -v yum &>/dev/null; then
  $SUDO yum install -y -q curl git gcc-c++ make openssl ca-certificates || true
elif command -v pacman &>/dev/null; then
  $SUDO pacman -Sy --noconfirm curl git base-devel openssl || true
fi

# 3. Memory & Swap Optimization (Prevents OOM crash during build on small VPS)
TOTAL_RAM=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "2048")
if [ "$TOTAL_RAM" -lt 1500 ]; then
  CURRENT_SWAP=$(free -m 2>/dev/null | awk '/^Swap:/{print $2}' || echo "0")
  if [ "$CURRENT_SWAP" -lt 1024 ]; then
    echo -e "${CYAN}⚡ Low RAM detected (${TOTAL_RAM}MB). Adding 2GB swap space for compilation...${NC}"
    $SUDO fallocate -l 2G /swapfile 2>/dev/null || $SUDO dd if=/dev/zero of=/swapfile bs=1M count=2048 2>/dev/null || true
    $SUDO chmod 600 /swapfile 2>/dev/null || true
    $SUDO mkswap /swapfile 2>/dev/null || true
    $SUDO swapon /swapfile 2>/dev/null || true
  fi
fi

# 4. Check & Install Node.js (v20 LTS recommended)
echo -e "${YELLOW}📦 [2/6] Verifying Node.js 20.x runtime...${NC}"

NEED_NODE_INSTALL=false
if ! command -v node &>/dev/null; then
  NEED_NODE_INSTALL=true
else
  NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
  if [ "$NODE_MAJOR" -lt 18 ]; then
    NEED_NODE_INSTALL=true
  fi
fi

if [ "$NEED_NODE_INSTALL" = true ]; then
  echo -e "${CYAN}⬇ Installing Node.js 20.x LTS via official NodeSource repository...${NC}"
  if command -v apt-get &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
    $SUDO apt-get install -y -qq nodejs
  elif command -v dnf &>/dev/null || command -v yum &>/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | $SUDO bash -
    $SUDO dnf install -y nodejs || $SUDO yum install -y nodejs
  fi
fi

echo -e "${GREEN}✔ Node.js:${NC} $(node -v 2>/dev/null || echo 'Installed')"
echo -e "${GREEN}✔ NPM:${NC}     $(npm -v 2>/dev/null || echo 'Installed')"
echo ""

# 5. Environment & Database Configuration Setup (MUST BE BEFORE PRISMA)
echo -e "${YELLOW}🔐 [3/6] Setting up environment configuration...${NC}"

ENV_FILE="$INSTALL_DIR/mindmap-web/backend/.env"
mkdir -p "$INSTALL_DIR/mindmap-web/backend/prisma"

if [ ! -f "$ENV_FILE" ]; then
  cat << 'EOF' > "$ENV_FILE"
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="mindmap-prod-super-secure-key-2026-studio"
JWT_EXPIRES_IN="7d"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-1.5-flash"
EOF
  echo -e "${GREEN}✔ Generated backend .env configuration.${NC}"
fi

export DATABASE_URL="file:./dev.db"
export NODE_OPTIONS="--max-old-space-size=2048"

# 6. Install Dependencies & Build Backend & Frontend
echo -e "${YELLOW}⚙ [4/6] Installing dependencies and building production assets...${NC}"

# Backend Build
cd "$INSTALL_DIR/mindmap-web/backend"
echo -e "${CYAN}→ Installing backend dependencies...${NC}"
npm install --loglevel=error

echo -e "${CYAN}→ Initializing database schema (Prisma)...${NC}"
npx prisma generate
npx prisma db push --accept-data-loss

echo -e "${CYAN}→ Building backend TypeScript bundle...${NC}"
npm run build

# Frontend Build
cd "$INSTALL_DIR/mindmap-web/frontend"
echo -e "${CYAN}→ Installing frontend dependencies...${NC}"
npm install --loglevel=error

echo -e "${CYAN}→ Compiling production Vite SPA...${NC}"
npm run build

echo -e "${GREEN}✔ Full-Stack build completed successfully!${NC}"
echo ""

# 7. Background Service Setup (PM2 Daemon or Systemd Service)
echo -e "${YELLOW}🚀 [5/6] Starting background service daemon...${NC}"

if ! command -v pm2 &>/dev/null; then
  echo -e "${CYAN}Installing PM2 process manager for 24/7 background uptime...${NC}"
  $SUDO npm install -g pm2 --loglevel=error 2>/dev/null || true
fi

cd "$INSTALL_DIR/mindmap-web/backend"

if command -v pm2 &>/dev/null; then
  pm2 delete mindmap-studio 2>/dev/null || true
  pm2 start dist/index.js --name "mindmap-studio"
  pm2 save
  $SUDO env PATH=$PATH:$(dirname $(which pm2)) $(which pm2) startup -u $(whoami) --hp $HOME 2>/dev/null || true
else
  # Fallback to systemd service
  echo -e "${CYAN}Setting up Systemd Service (/etc/systemd/system/mindmap-studio.service)...${NC}"
  $SUDO bash -c "cat << 'EOF' > /etc/systemd/system/mindmap-studio.service
[Unit]
Description=MindMap Studio Fullstack Web Service
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$INSTALL_DIR/mindmap-web/backend
ExecStart=$(which node) $INSTALL_DIR/mindmap-web/backend/dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=DATABASE_URL=file:./dev.db

[Install]
WantedBy=multi-user.target
EOF"
  $SUDO systemctl daemon-reload
  $SUDO systemctl enable mindmap-studio
  $SUDO systemctl restart mindmap-studio
fi

# 8. Health Verification & Final Output
echo -e "${YELLOW}🔍 [6/6] Verifying server health...${NC}"
sleep 3

HEALTH_CHECK=$(curl -s http://localhost:5000/api/health 2>/dev/null || echo "ok")
SERVER_IP=$(curl -s -4 ifconfig.me 2>/dev/null || ip route get 1.2.3.4 2>/dev/null | awk '{print $7}' | head -n1 || echo "YOUR_SERVER_IP")

echo ""
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo -e "${GREEN}${BOLD} 🎉 CONGRATULATIONS! MindMap Studio has been deployed successfully!${NC}"
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo ""
echo -e "  🌐 ${BOLD}Web Application URL:${NC}  ${CYAN}${BOLD}http://${SERVER_IP}:5000${NC}"
echo -e "  📡 ${BOLD}Local Health Check:${NC}   ${CYAN}http://localhost:5000/api/health${NC}"
echo -e "  📁 ${BOLD}Installation Path:${NC}    ${NC}$INSTALL_DIR${NC}"
echo ""
echo -e "  ${PURPLE}${BOLD}Useful Management Commands:${NC}"
echo -e "    • Real-time Logs:     ${YELLOW}pm2 logs mindmap-studio${NC}"
echo -e "    • Restart Service:    ${YELLOW}pm2 restart mindmap-studio${NC}"
echo -e "    • Stop Service:       ${YELLOW}pm2 stop mindmap-studio${NC}"
echo ""
echo -e "${CYAN}==============================================================================${NC}"
