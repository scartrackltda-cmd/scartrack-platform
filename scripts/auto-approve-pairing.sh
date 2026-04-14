#!/bin/bash
# Scartrack Agency — Auto-approve Telegram pairing
# Monitora o bot e aprova automaticamente novos pairings do dono (1480188461)
# Executado como daemon via PM2

BOT_TOKEN="8675247519:AAFkduSSxvczMi_W-f8f7L_ikdh1TRG4-c8"
CHAT_ID="1480188461"
CONTAINER="openclaw-h2oa-openclaw-1"
OFFSET=0
PROCESSED_FILE="/tmp/scartrack-approved-pairings.txt"

touch "$PROCESSED_FILE"

echo "[AutoPairing] Started — watching for pairing codes from chat $CHAT_ID"

while true; do
  RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?timeout=20&offset=${OFFSET}&allowed_updates=[\"message\"]")

  UPDATES=$(echo "$RESPONSE" | python3 -c "
import json,sys
data = json.load(sys.stdin)
results = data.get('result', [])
for r in results:
    uid = r.get('update_id', 0)
    msg = r.get('message', {})
    chat_id = str(msg.get('chat', {}).get('id', ''))
    text = msg.get('text', '')
    print(f'{uid}|{chat_id}|{text}')
" 2>/dev/null)

  while IFS= read -r line; do
    [ -z "$line" ] && continue

    UID_VAL=$(echo "$line" | cut -d'|' -f1)
    MSG_CHAT=$(echo "$line" | cut -d'|' -f2)
    MSG_TEXT=$(echo "$line" | cut -d'|' -f3-)

    # Update offset
    OFFSET=$((UID_VAL + 1))

    # Only process messages from the owner
    [ "$MSG_CHAT" != "$CHAT_ID" ] && continue

    # Extract pairing code from OpenClaw message pattern
    CODE=$(echo "$MSG_TEXT" | grep -oP 'openclaw pairing approve telegram \K[A-Z0-9]+' 2>/dev/null)

    if [ -n "$CODE" ]; then
      # Check if already processed
      if grep -q "$CODE" "$PROCESSED_FILE" 2>/dev/null; then
        echo "[AutoPairing] Code $CODE already processed, skipping"
        continue
      fi

      echo "[AutoPairing] New pairing code detected: $CODE — approving..."
      RESULT=$(docker exec "$CONTAINER" openclaw pairing approve telegram "$CODE" 2>&1)
      echo "[AutoPairing] Result: $RESULT"

      if echo "$RESULT" | grep -q "Approved"; then
        echo "$CODE" >> "$PROCESSED_FILE"
        echo "[AutoPairing] ✅ Approved $CODE successfully"
        # Notify via Telegram that pairing was auto-approved
        curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
          -H "Content-Type: application/json" \
          -d "{\"chat_id\":\"${CHAT_ID}\",\"text\":\"✅ Pairing \`${CODE}\` aprovado automaticamente\\. Pode usar o bot normalmente\\.\",\"parse_mode\":\"MarkdownV2\"}" > /dev/null
      fi
    fi
  done <<< "$UPDATES"

  sleep 2
done
