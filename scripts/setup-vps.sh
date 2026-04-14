#!/bin/bash
# Scartrack Agency — Setup completo na VPS
# Execute uma vez para configurar tudo: Node, PM2, deps, cron, webhooks

set -e

AGENCY_DIR="/root/scartrack-agency"
BOT_TOKEN="8675247519:AAFkduSSxvczMi_W-f8f7L_ikdh1TRG4-c8"
EVOLUTION_URL="http://187.127.18.17:43654"
EVOLUTION_KEY="q6bOgsmWkvMTh4Cz7odqKqa2CG2KFia6"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     🛰️  Scartrack Agency — VPS Setup     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ─── 1. Node.js ──────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "📦 Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  echo "✅ Node.js $(node -v) instalado"
else
  echo "✅ Node.js $(node -v) já instalado"
fi

# ─── 2. PM2 ──────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "📦 Instalando PM2..."
  npm install -g pm2
  pm2 startup systemd -u root --hp /root | tail -1 | bash || true
  echo "✅ PM2 instalado"
else
  echo "✅ PM2 já instalado"
fi

# ─── 3. Dependências npm ──────────────────────────────────────────────────────
echo "📦 Instalando dependências do scartrack-agency..."
cd "$AGENCY_DIR" && npm install
echo "✅ Dependências instaladas"

# ─── 4. Telegram Chat ID ──────────────────────────────────────────────────────
CURRENT_CHAT_ID=$(grep "^TELEGRAM_CHAT_ID=" "$AGENCY_DIR/.env" | cut -d'=' -f2)

if [ -z "$CURRENT_CHAT_ID" ]; then
  echo ""
  echo "─────────────────────────────────────────────"
  echo " 📱 Configuração do Telegram"
  echo "─────────────────────────────────────────────"
  echo ""
  echo "Para conectar o Telegram:"
  echo "1. Abra o Telegram"
  echo "2. Pesquise e abra o seu bot (pelo username)"
  echo "3. Envie /start ou qualquer mensagem"
  echo "4. Pressione ENTER aqui quando tiver enviado"
  echo ""
  read -p "Pressione ENTER após enviar a mensagem ao bot: "

  RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=5&offset=-5")
  CHAT_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; data=json.load(sys.stdin); r=data.get('result',[]); print(r[-1]['message']['chat']['id'] if r else '')" 2>/dev/null || echo "")

  if [ -z "$CHAT_ID" ]; then
    echo "⚠️  Não foi possível capturar o chat_id automaticamente."
    read -p "Cole seu Telegram chat_id manualmente (ou Enter para pular): " MANUAL_ID
    CHAT_ID="$MANUAL_ID"
  fi

  if [ -n "$CHAT_ID" ]; then
    sed -i "s/^TELEGRAM_CHAT_ID=.*/TELEGRAM_CHAT_ID=${CHAT_ID}/" "$AGENCY_DIR/.env"
    echo "✅ TELEGRAM_CHAT_ID=${CHAT_ID} salvo"
  fi
else
  echo "✅ Telegram Chat ID já configurado: $CURRENT_CHAT_ID"
  CHAT_ID="$CURRENT_CHAT_ID"
fi

# ─── 5. Webhook Evolution API ────────────────────────────────────────────────
echo ""
echo "🔗 Configurando webhook da instância SCARTRACK..."
WEBHOOK_RESP=$(curl -s -X POST "${EVOLUTION_URL}/webhook/set/SCARTRACK" \
  -H "Content-Type: application/json" \
  -H "apikey: ${EVOLUTION_KEY}" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "http://127.0.0.1:3100/webhook/evolution",
      "webhookByEvents": false,
      "webhookBase64": false,
      "events": ["MESSAGES_UPSERT"]
    }
  }')
echo "✅ Webhook Evolution: $WEBHOOK_RESP" | head -c 120
echo ""

# ─── 6. PM2 — Iniciar orquestrador ───────────────────────────────────────────
echo ""
echo "🚀 Iniciando CEO_Scartrack Orchestrator..."
pm2 delete scartrack-orchestrator 2>/dev/null || true
pm2 start "$AGENCY_DIR/orchestrator/orchestrator.js" \
  --name scartrack-orchestrator \
  --log /var/log/scartrack-orchestrator.log \
  --time \
  --restart-delay 5000 \
  --max-restarts 10
pm2 save
echo "✅ Orquestrador iniciado"

# ─── 7. Cron Jobs ─────────────────────────────────────────────────────────────
echo ""
echo "⏰ Instalando cron jobs..."
NODE_BIN=$(which node)
(crontab -l 2>/dev/null | grep -v "scartrack-agency"; cat << EOF

# ─── Scartrack Agency ────────────────────────────────────────────────
# Monitoring_Agent: health check every 5 minutes
*/5 * * * * $NODE_BIN $AGENCY_DIR/monitoring/health-check.js >> /var/log/scartrack-health.log 2>&1
# CEO_Scartrack: daily report at 07:00
0 7 * * * $NODE_BIN $AGENCY_DIR/monitoring/daily-report.js >> /var/log/scartrack-report.log 2>&1
# ─────────────────────────────────────────────────────────────────────
EOF
) | crontab -
echo "✅ Cron jobs instalados"

# ─── 8. Teste de notificação ──────────────────────────────────────────────────
echo ""
echo "📤 Enviando notificação de teste..."

# WhatsApp
curl -s -X POST "${EVOLUTION_URL}/message/sendText/SCARTRACK" \
  -H "Content-Type: application/json" \
  -H "apikey: ${EVOLUTION_KEY}" \
  -d '{
    "number": "5541991281716",
    "text": "✅ *Scartrack Agency iniciada!*\n\nAgentes ativos:\n🤖 CEO_Scartrack\n📡 Monitoring_Agent (check a cada 5min)\n🛠️ Dev_Agent (sob autorização)\n\nRelatório diário: todos os dias às 07:00\n\n_Sistema pronto._"
  }' > /dev/null && echo "✅ WhatsApp enviado"

# Telegram
if [ -n "$CHAT_ID" ]; then
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{
      \"chat_id\": \"${CHAT_ID}\",
      \"text\": \"✅ *Scartrack Agency iniciada\\!*\n\nAgentes ativos:\n🤖 CEO\\_Scartrack\n📡 Monitoring\\_Agent \\(check a cada 5min\\)\n🛠️ Dev\\_Agent \\(sob autorização\\)\n\nRelatório diário: todos os dias às 07:00\",
      \"parse_mode\": \"MarkdownV2\"
    }" > /dev/null && echo "✅ Telegram enviado"
fi

# ─── Resumo ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅  Scartrack Agency — ATIVA!          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Orquestrador:  http://localhost:3100/health"
echo "Webhook WA:    POST http://localhost:3100/webhook/evolution"
echo "Webhook TG:    POST http://localhost:3100/webhook/telegram"
echo "Ações pending: GET  http://localhost:3100/api/actions/pending"
echo ""
echo "Logs:"
echo "  pm2 logs scartrack-orchestrator"
echo "  tail -f /var/log/scartrack-health.log"
echo ""
echo "Comandos úteis no Telegram:"
echo "  /status    → status dos agentes"
echo "  /relatorio → gerar relatório agora"
echo "  /ajuda     → lista de comandos"
echo ""
