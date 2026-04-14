#!/bin/bash
# Scartrack Agency — Test Notifications
# Envia mensagem de teste para WhatsApp e Telegram

AGENCY_DIR="/root/scartrack-agency"

echo "Sending test notification to WhatsApp and Telegram..."
node "$AGENCY_DIR/notifications/notifier.js" "🧪 *Teste — Scartrack Agency*

✅ Notificações configuradas com sucesso!

Agentes ativos:
• 🤖 CEO_Scartrack (Manager)
• 📡 Monitoring_Agent (24/7)
• 🛠️ Dev_Agent (sob autorização)

_Sistema iniciado com sucesso._"

echo ""
echo "✅ Test notification sent!"
