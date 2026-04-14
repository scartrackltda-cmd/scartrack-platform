#!/bin/bash
# Scartrack Agency — Start All Services
# Inicia o orquestrador via PM2 e instala crons

set -e

AGENCY_DIR="/root/scartrack-agency"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        🛰️  Scartrack Agency              ║"
echo "║         Starting all services...          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check .env
if [ ! -f "$AGENCY_DIR/.env" ]; then
  echo "⚠️  .env not found — copying from .env.example"
  cp "$AGENCY_DIR/.env.example" "$AGENCY_DIR/.env"
  echo "📝 Please edit $AGENCY_DIR/.env with your Telegram credentials before starting"
  exit 1
fi

# Install npm dependencies
if [ ! -d "$AGENCY_DIR/node_modules" ]; then
  echo "📦 Installing dependencies..."
  cd "$AGENCY_DIR" && npm install
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2 globally..."
  npm install -g pm2
fi

# Start orchestrator with PM2
echo "🚀 Starting CEO_Scartrack Orchestrator..."
pm2 delete scartrack-orchestrator 2>/dev/null || true
pm2 start "$AGENCY_DIR/orchestrator/orchestrator.js" \
  --name scartrack-orchestrator \
  --log /var/log/scartrack-orchestrator.log \
  --time \
  --restart-delay 5000 \
  --max-restarts 10

# Install cron jobs
echo "⏰ Installing cron jobs..."
bash "$AGENCY_DIR/scripts/setup-cron.sh"

# Save PM2 state
pm2 save

echo ""
echo "✅ Scartrack Agency is running!"
echo ""
echo "Services:"
echo "  🤖 CEO_Scartrack Orchestrator  → http://localhost:3100"
echo "  📡 Webhook WhatsApp            → POST http://localhost:3100/webhook/evolution"
echo "  📱 Webhook Telegram            → POST http://localhost:3100/webhook/telegram"
echo "  📊 Pending Actions API         → GET  http://localhost:3100/api/actions/pending"
echo ""
echo "Cron Jobs:"
echo "  ⏱️  Health check: every 5 min"
echo "  📊  Daily report: 07:00 daily"
echo ""
echo "Logs:"
echo "  tail -f /var/log/scartrack-health.log"
echo "  tail -f /var/log/scartrack-orchestrator.log"
echo ""
