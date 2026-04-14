#!/bin/bash
# Scartrack Agency — Setup Cron Jobs
# Instala todas as tarefas agendadas dos agentes

set -e

AGENCY_DIR="/root/scartrack-agency"
NODE_BIN=$(which node)

echo "Setting up Scartrack Agency cron jobs..."

# Remove existing Scartrack Agency cron entries
crontab -l 2>/dev/null | grep -v "scartrack-agency" > /tmp/crontab_clean || true

# Add new cron entries
cat >> /tmp/crontab_clean << EOF

# ─── Scartrack Agency ────────────────────────────────────────────────
# Monitoring_Agent: health check every 5 minutes
*/5 * * * * $NODE_BIN $AGENCY_DIR/monitoring/health-check.js >> /var/log/scartrack-health.log 2>&1

# CEO_Scartrack: daily report at 07:00
0 7 * * * $NODE_BIN $AGENCY_DIR/monitoring/daily-report.js >> /var/log/scartrack-report.log 2>&1

# Monitoring_Agent: deep check every hour (60-min mark)
0 * * * * $NODE_BIN $AGENCY_DIR/monitoring/health-check.js >> /var/log/scartrack-health.log 2>&1
# ─────────────────────────────────────────────────────────────────────
EOF

crontab /tmp/crontab_clean
rm /tmp/crontab_clean

echo "✅ Cron jobs installed:"
crontab -l | grep -A 10 "Scartrack Agency"
