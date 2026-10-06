#!/usr/bin/env bash
# ==============================================================================
# 🚀 MindMap Studio — Linux Server 1-Click Automated Installer & Deployer
# Author: Mehdi Mirzaei (https://github.com/mehdisec)
# Repository: https://github.com/mehdisec/Mind-studio
# ==============================================================================

set -e

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

# 1. Check Root / Sudo
if [ "$EUID" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

# Determine Installation Directory
INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -d "$INSTALL_DIR/mindmap-web" ]; then
  echo -e "${YELLOW}📁 Cloning repository into /opt/mindmap-studio...${NC}"
  $SUDO mkdir -p /opt/mindmap-studio
  $SUDO git clone https://github.com/mehdisec/Mind-studio.git /opt/mindmap-studio 2>/dev/null || true
  cd /opt/mindmap-studio
  INSTALL_DIR="/opt/mindmap-studio"
fi

cd "$INSTALL_DIR"

echo -e "${GREEN}✔ Working Directory:${NC} $INSTALL_DIR"
echo ""

# 2. Check & Install System Packages (curl, git, node, build-essential)
echo -e "${YELLOW}🔍 [1/6] Checking system prerequisites...${NC}"

if command -v apt-get &>/dev/null; then
  $SUDO apt-get update -qq
  $SUDO apt-get install -y -qq curl git build-essential openssl
elif command -v dnf &>/dev/null; then
  $SUDO dnf install -y -q curl git gcc-c++ make openssl
elif command -v yum &>/dev/null; then
  $SUDO yum install -y -q curl git gcc-c++ make openssl
elif command -v pacman &>/dev/null; then
  $SUDO pacman -Sy --noconfirm curl git base-devel openssl
fi

# 3. Check & Install Node.js (v20 LTS recommended)
echo -e "${YELLOW}📦 [2/6] Checking Node.js runtime...${NC}"

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
  echo -e "${CYAN}⬇ Installing Node.js 20.x LTS via NodeSource...${NC}"
  if command -v apt-get &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
    $SUDO apt-get install -y -qq nodejs
  elif command -v dnf &>/dev/null || command -v yum &>/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | $SUDO bash -
    $SUDO dnf install -y nodejs || $SUDO yum install -y nodejs
  fi
fi

echo -e "${GREEN}✔ Node.js Version:${NC} $(node -v)"
echo -e "${GREEN}✔ NPM Version:${NC} $(npm -v)"
echo ""

# 4. Install Dependencies & Build Backend & Frontend
echo -e "${YELLOW}⚙ [3/6] Installing backend & frontend dependencies...${NC}"

cd "$INSTALL_DIR/mindmap-web/backend"
echo -e "${CYAN}→ Installing backend packages...${NC}"
npm install --loglevel=error

echo -e "${CYAN}→ Generating Prisma ORM client & pushing database schema...${NC}"
npx prisma generate
npx prisma db push

echo -e "${CYAN}→ Compiling backend TypeScript...${NC}"
npm run build

cd "$INSTALL_DIR/mindmap-web/frontend"
echo -e "${CYAN}→ Installing frontend packages...${NC}"
npm install --loglevel=error

echo -e "${CYAN}→ Compiling production Vite SPA bundle...${NC}"
npm run build

echo -e "${GREEN}✔ All packages installed & compiled successfully!${NC}"
echo ""

# 5. Environment Configuration
echo -e "${YELLOW}🔐 [4/6] Configuring environment settings...${NC}"
ENV_FILE="$INSTALL_DIR/mindmap-web/backend/.env"

if [ ! -f "$ENV_FILE" ]; then
  cat << 'EOF' > "$ENV_FILE"
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="mindmap-prod-super-secure-key-2026-studio"
JWT_EXPIRES_IN="7d"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-1.5-flash"
EOF
  echo -e "${GREEN}✔ Generated default .env file in backend.${NC}"
fi

# 6. Service Setup (PM2 or Systemd)
echo -e "${YELLOW}🚀 [5/6] Setting up production background daemon...${NC}"

if command -v pm2 &>/dev/null || npm list -g pm2 &>/dev/null; then
  echo -e "${CYAN}Using PM2 Process Manager...${NC}"
  cd "$INSTALL_DIR/mindmap-web/backend"
  pm2 delete mindmap-studio 2>/dev/null || true
  pm2 start dist/index.js --name "mindmap-studio"
  pm2 save
else
  # Install PM2 globally for automatic restarts and zero-downtime reboots
  echo -e "${CYAN}Installing PM2 globally for daemon management...${NC}"
  $SUDO npm install -g pm2 --loglevel=error 2>/dev/null || true

  if command -v pm2 &>/dev/null; then
    cd "$INSTALL_DIR/mindmap-web/backend"
    pm2 delete mindmap-studio 2>/dev/null || true
    pm2 start dist/index.js --name "mindmap-studio"
    pm2 save
    pm2 startup | tail -n 1 | $SUDO bash 2>/dev/null || true
  else
    # Fallback to systemd service
    echo -e "${CYAN}Configuring systemd service (/etc/systemd/system/mindmap-studio.service)...${NC}"
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

[Install]
WantedBy=multi-user.target
EOF"
    $SUDO systemctl daemon-reload
    $SUDO systemctl enable mindmap-studio
    $SUDO systemctl restart mindmap-studio
  fi
fi

# 7. Final Verification & Display Info
echo ""
echo -e "${YELLOW}🔍 [6/6] Verifying system health...${NC}"
sleep 2

HEALTH_CHECK=$(curl -s http://localhost:5000/api/health 2>/dev/null || echo "error")

# Detect Server IP
SERVER_IP=$(curl -s -4 ifconfig.me 2>/dev/null || ip route get 1.2.3.4 2>/dev/null | awk '{print $7}' | head -n1 || echo "YOUR_SERVER_IP")

echo ""
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo -e "${GREEN}${BOLD} 🎉 CONGRATULATIONS! MindMap Studio has been deployed successfully!${NC}"
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo ""
echo -e "  🌐 ${BOLD}Web Application URL:${NC}  ${CYAN}http://${SERVER_IP}:5000${NC}"
echo -e "  📡 ${BOLD}Local Health Check:${NC}   ${CYAN}http://localhost:5000/api/health${NC}"
echo -e "  📁 ${BOLD}Installation Path:${NC}    ${NC}$INSTALL_DIR${NC}"
echo ""
echo -e "  ${PURPLE}${BOLD}Useful Management Commands:${NC}"
echo -e "    • View real-time logs:     ${YELLOW}pm2 logs mindmap-studio${NC} (or ${YELLOW}journalctl -u mindmap-studio -f${NC})"
echo -e "    • Restart application:     ${YELLOW}pm2 restart mindmap-studio${NC}"
echo -e "    • Stop application:        ${YELLOW}pm2 stop mindmap-studio${NC}"
echo ""
echo -e "${CYAN}==============================================================================${NC}"
