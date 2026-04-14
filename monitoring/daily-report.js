#!/usr/bin/env node
/**
 * Scartrack Agency — Daily Report Generator
 * CEO_Scartrack: compila e envia relatório diário às 07:00
 * Cron: 0 7 * * * node /root/scartrack-agency/monitoring/daily-report.js
 */

require('dotenv').config({ path: '/root/scartrack-agency/.env' });
const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { alerts } = require('../notifications/notifier');

const execAsync   = promisify(exec);
const LOG_FILE    = path.join(__dirname, 'health.log');
const PENDING_FILE = path.join(__dirname, '../orchestrator/pending-actions.json');

function br() { return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
function now() { return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }); }

// ─── Parse last 24h of health logs ───────────────────────────────────────────

function parseLogs() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const stats = {
    total_checks: 0,
    online_checks: 0,
    offline_checks: 0,
    latencies: [],
    cpu_values: [],
    mem_values: [],
    alerts: [],
    containers_down: [],
    platform_downs: [],
  };

  try {
    const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (new Date(entry.timestamp).getTime() < cutoff) continue;
        stats.total_checks++;
        if (entry.message === 'Platform OK') {
          stats.online_checks++;
          if (entry.latency_ms) stats.latencies.push(entry.latency_ms);
        }
        if (entry.message === 'Platform is DOWN' || entry.message === 'Platform still DOWN') {
          stats.offline_checks++;
          stats.platform_downs.push(entry.timestamp);
        }
        if (entry.cpu_percent) stats.cpu_values.push(entry.cpu_percent);
        if (entry.mem_percent) stats.mem_values.push(entry.mem_percent);
        if (entry.level === 'CRITICAL' || entry.level === 'WARNING') {
          stats.alerts.push({ level: entry.level, message: entry.message, time: entry.timestamp });
        }
      } catch { /* skip malformed lines */ }
    }
  } catch { /* log not yet created */ }

  return stats;
}

function avg(arr) { return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0; }
function max(arr) { return arr.length ? Math.max(...arr) : 0; }

// ─── Get pending dev actions ──────────────────────────────────────────────────

function getPendingActions() {
  try {
    const data = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
    return data.pending || [];
  } catch { return []; }
}

// ─── Current system state ─────────────────────────────────────────────────────

async function getCurrentState() {
  const state = {};
  try {
    const { stdout: psOut } = await execAsync('docker ps --format "{{.Names}}|{{.Status}}" 2>/dev/null');
    const containers = {};
    psOut.trim().split('\n').forEach((l) => {
      const [n, s] = l.split('|');
      if (n) containers[n.trim()] = s ? s.trim() : 'unknown';
    });
    state.scartrack_app = containers['scartrack_app'] || 'stopped';
    state.scartrack_db  = containers['scartrack_db']  || 'stopped';
  } catch { state.scartrack_app = 'unknown'; state.scartrack_db = 'unknown'; }

  try {
    const { stdout } = await execAsync("free | grep Mem | awk '{print int($3/$2*100)}'");
    state.memory = parseInt(stdout.trim()) || 0;
  } catch { state.memory = 0; }

  try {
    const { stdout } = await execAsync("df / | tail -1 | awk '{print int($5)}'");
    state.disk = parseInt(stdout.trim()) || 0;
  } catch { state.disk = 0; }

  return state;
}

// ─── Build Report ─────────────────────────────────────────────────────────────

async function buildReport() {
  const stats  = parseLogs();
  const cur    = await getCurrentState();
  const pending = getPendingActions();

  const uptime = stats.total_checks > 0
    ? Math.round((stats.online_checks / stats.total_checks) * 100)
    : 0;

  const platformStatus = cur.scartrack_app && cur.scartrack_app.startsWith('Up') ? '🟢 ONLINE' : '🔴 OFFLINE';
  const appStatus  = cur.scartrack_app.startsWith('Up') ? '🟢 running' : `🔴 ${cur.scartrack_app}`;
  const dbStatus   = cur.scartrack_db.startsWith('Up')  ? '🟢 running' : `🔴 ${cur.scartrack_db}`;

  const criticalAlerts = stats.alerts.filter(a => a.level === 'CRITICAL');
  const warningAlerts  = stats.alerts.filter(a => a.level === 'WARNING');

  const alertsSection = stats.alerts.length === 0
    ? '   Nenhum alerta nas últimas 24h ✅'
    : [
        criticalAlerts.length ? `   🔴 Críticos: ${criticalAlerts.length}` : '',
        warningAlerts.length  ? `   🟡 Avisos: ${warningAlerts.length}`    : '',
        criticalAlerts.slice(0, 3).map(a => `   • ${a.message} (${new Date(a.time).toLocaleTimeString('pt-BR')})`).join('\n'),
      ].filter(Boolean).join('\n');

  const pendingSection = pending.length === 0
    ? '   Nenhuma ação pendente'
    : pending.map(a => `   • [${a.id}] ${a.title}`).join('\n');

  const report = `
─── SAÚDE DA PLATAFORMA ───
${platformStatus}
⏱️ Uptime 24h: ${uptime}%
⚡ Latência média: ${avg(stats.latencies)}ms | Pico: ${max(stats.latencies)}ms
🔍 Verificações realizadas: ${stats.total_checks}

─── CONTAINERS ───
📦 scartrack_app: ${appStatus}
📦 scartrack_db:  ${dbStatus}
💾 Disco: ${cur.disk}% | 🧠 RAM: ${cur.memory}%

─── ALERTAS (últimas 24h) ───
${alertsSection}

─── DEV_AGENT — PENDÊNCIAS ───
${pendingSection}

─── PRIORIDADES DE HOJE ───
${uptime < 99 ? '   🔴 Investigar causa de instabilidade' : '   ✅ Plataforma estável — manutenção preventiva'}
${cur.disk > 70 ? `   ⚠️ Disco em ${cur.disk}% — monitorar crescimento` : ''}
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
