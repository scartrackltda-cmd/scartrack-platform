#!/usr/bin/env node
/**
 * Scartrack Agency — Daily Report Generator
 * CEO_Scartrack: compila e envia relatório diário às 07:00
 * Cron: 0 7 * * * node /root/scartrack-agency/monitoring/daily-report.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs   = require('fs');
const path = require('path');
const http = require('http');
const { alerts } = require('../notifications/notifier');

const LOG_FILE     = path.join(__dirname, 'health.log');
const PENDING_FILE = path.join(__dirname, '../orchestrator/pending-actions.json');

// Orchestrator host: try env var, then docker host gateway, then localhost
const ORCHESTRATOR_HOST = process.env.ORCHESTRATOR_HOST || '172.16.0.1';
const ORCHESTRATOR_PORT = process.env.ORCHESTRATOR_PORT || 3100;

function fetchStatus() {
  return new Promise((resolve) => {
    const req = http.get(`http://${ORCHESTRATOR_HOST}:${ORCHESTRATOR_PORT}/api/status`, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function br() { return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
function now() { return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }); }

function avg(arr) { return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0; }
function max(arr) { return arr.length ? Math.max(...arr) : 0; }

function getPendingActions() {
  try { return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8')).pending || []; }
  catch { return []; }
}

// ─── Build Report ─────────────────────────────────────────────────────────────

async function buildReport() {
  // Fetch real data from orchestrator API (works from inside Docker)
  const status  = await fetchStatus();
  const pending = getPendingActions();

  // Fallback values if orchestrator unreachable
  const platform   = status?.platform   || { status: 'unknown', latency_ms: 0 };
  const containers = status?.containers || {};
  const system     = status?.system     || { memory_percent: 0, disk_percent: 0 };
  const hStats     = status?.health_stats || { total: 0, online: 0, alerts: [] };

  const uptime = hStats.total > 0 ? Math.round((hStats.online / hStats.total) * 100) : (platform.status === 'online' ? 100 : 0);
  const appStatus = (containers['scartrack_app'] || 'unknown').startsWith('Up') ? '🟢 running' : `🔴 ${containers['scartrack_app'] || 'unknown'}`;
  const dbStatus  = (containers['scartrack_db']  || 'unknown').startsWith('Up') ? '🟢 running' : `🔴 ${containers['scartrack_db']  || 'unknown'}`;
  const platformStatus = platform.status === 'online' ? '🟢 ONLINE' : platform.status === 'offline' ? '🔴 OFFLINE' : '🟡 DEGRADED';

  const criticalAlerts = (hStats.alerts || []).filter(a => a.level === 'CRITICAL');
  const warningAlerts  = (hStats.alerts || []).filter(a => a.level === 'WARNING');
  const alertsSection  = hStats.alerts.length === 0
    ? '   Nenhum alerta nas últimas 24h ✅'
    : [
        criticalAlerts.length ? `   🔴 Críticos: ${criticalAlerts.length}` : '',
        warningAlerts.length  ? `   🟡 Avisos: ${warningAlerts.length}` : '',
        criticalAlerts.slice(0, 3).map(a => `   • ${a.message} (${new Date(a.time).toLocaleTimeString('pt-BR')})`).join('\n'),
      ].filter(Boolean).join('\n');

  const pendingSection = pending.length === 0
    ? '   Nenhuma ação pendente'
    : pending.map(a => `   • [${a.id}] ${a.title}`).join('\n');

  const report = `
─── SAÚDE DA PLATAFORMA ───
${platformStatus}
⏱️ Uptime 24h: ${uptime}%
⚡ Latência: ${platform.latency_ms || 0}ms
🔍 Verificações realizadas: ${hStats.total}

─── CONTAINERS ───
📦 scartrack_app: ${appStatus}
📦 scartrack_db:  ${dbStatus}
💾 Disco: ${system.disk_percent}% | 🧠 RAM: ${system.memory_percent}%

─── ALERTAS (últimas 24h) ───
${alertsSection}

─── DEV_AGENT — PENDÊNCIAS ───
${pendingSection}

─── PRIORIDADES DE HOJE ───
${uptime < 99 ? '   🔴 Investigar causa de instabilidade' : '   ✅ Plataforma estável — manutenção preventiva'}
${system.disk_percent > 70 ? `   ⚠️ Disco em ${system.disk_percent}% — monitorar crescimento` : ''}
${pending.length > 0 ? `   💡 Revisar ${pending.length} sugestão(ões) do Dev_Agent` : ''}

─── NOTA DO CEO ───
${uptime >= 99 ? 'Operação normal. Plataforma estável nas últimas 24h.' : `Atenção: uptime de ${uptime}% abaixo do esperado (meta: 99%+). Recomendo revisão dos logs.`}
`.trim();

  return report;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[DailyReport] Generating report for ${br()}...`);
  try {
    const reportContent = await buildReport();
    await alerts.dailyReport(reportContent);
    console.log('[DailyReport] Report sent successfully');
  } catch (err) {
    console.error('[DailyReport] Error:', err);
    await alerts.dailyReport(`⚠️ Erro ao gerar relatório completo: ${err.message}`).catch(() => {});
  }
}

main().catch(console.error);
