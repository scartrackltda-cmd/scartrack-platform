#!/bin/bash
# Captura o chat_id do Telegram automaticamente após você enviar uma mensagem ao bot

TOKEN="8675247519:AAFkduSSxvczMi_W-f8f7L_ikdh1TRG4-c8"
ENV_FILE="/root/scartrack-agency/.env"

echo ""
echo "─────────────────────────────────────────────"
echo " Scartrack Agency — Capturar Chat ID Telegram"
echo "─────────────────────────────────────────────"
echo ""
echo "1. Abra o Telegram no celular ou computador"
echo "2. Pesquise pelo bot pelo token (ou pelo username se já configurou)"
echo "3. Envie qualquer mensagem (ex: /start)"
echo "4. Pressione ENTER aqui quando tiver enviado..."
echo ""
read -p "Pressione ENTER após enviar a mensagem ao bot: "

RESPONSE=$(curl -s "https://api.telegram.org/bot${TOKEN}/getUpdates?limit=5&offset=-5")
CHAT_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; data=json.load(sys.stdin); r=data.get('result',[]); print(r[-1]['message']['chat']['id'] if r else '')" 2>/dev/null)

if [ -z "$CHAT_ID" ]; then
  echo ""
  echo "❌ Nenhuma mensagem encontrada."
  echo "   Verifique se enviou a mensagem ao bot correto e tente novamente."
  echo ""
  echo "Resposta da API:"
  echo "$RESPONSE"
  exit 1
fi

echo ""
echo "✅ Chat ID encontrado: $CHAT_ID"
echo ""

# Update .env
sed -i "s/^TELEGRAM_CHAT_ID=.*/TELEGRAM_CHAT_ID=${CHAT_ID}/" "$ENV_FILE"
echo "✅ TELEGRAM_CHAT_ID=${CHAT_ID} salvo em .env"
echo ""

# Test notification
echo "Enviando notificação de teste..."
curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${CHAT_ID}\",
    \"text\": \"✅ *Scartrack Agency conectada!*\n\nSeu Telegram está configurado.\n\nAgentes ativos:\n• 🤖 CEO\\_Scartrack\n• 📡 Monitoring\\_Agent\n• 🛠️ Dev\\_Agent\",
    \"parse_mode\": \"Markdown\"
  }"

echo ""
echo "✅ Configuração do Telegram concluída!"
