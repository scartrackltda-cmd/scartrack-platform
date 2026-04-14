#!/usr/bin/env node
/**
 * Scartrack Agency — Health Check Script
 * Monitoring_Agent: verifica plataforma, containers e sistema a cada 5 minutos
 * Executado via cron: every-5-min node /root/scartrack-agency/monitoring/health-check.js
 */

require('dotenv').config({ path: '/root/scartrack-agency/.env' });
const http  = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs   = require('fs');
const path = require('path');
const { alerts } = require('../notifications/notifier');

const execAsync = promisify(exec);

const STATE_FILE = path.join(__dirname, 'state.json');
const LOG_FILE   = path.join(__dirname, 'health.log');

const PLATFORM_URL    = 'http://187.127.18.17:3002';
const HEALTH_ENDPOINT = 'http://187.127.18.17:3002/api/health';
const TIMEOUT_MS      = 10000;
const CPU_WARN        = 80;
const CPU_CRIT        = 90;
const MEM_WARN        = 80;
const MEM_CRIT        = 90;
const DISK_WARN       = 85;
const LAT_WARN        = 2000;

// ─── State Management ────────────────────────────────────────────────────────

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { platform_was_down: false, down_since: null, last_alert_at: null, consecutive_failures: 0 };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function log(level, message, data = {}) {
  const entry = { timestamp: new Date().toISOString(), level, message, ...data };
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(LOG_FILE, line);
  console.log(`[${level}] ${message}`, Object.keys(data).length ? data : '');
}

// ─── Platform Check ───────────────────────────────────────────────────────────

function checkHTTP(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(url, { timeout: TIMEOUT_MS }, (res) => {
      res.resume();
      resolve({ ok: res.statusCode < 400, status: res.statusCode, latency_ms: Date.now() - start });
    });
    req.on('error', () => resolve({ ok: false, status: 0, latency_ms: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, latency_ms: TIMEOUT_MS }); });
  });
}

// ─── Docker Containers ────────────────────────────────────────────────────────

async function checkContainers() {
  try {
    const { stdout } = await execAsync('docker ps --format "{{.Names}}|{{.Status}}" 2>/dev/null');
    const containers = {};
    stdout.trim().split('\n').forEach((line) => {
      const [name, status] = line.split('|');
      if (name) containers[name.trim()] = status ? status.trim() : 'unknown';
    });
    return {
      scartrack_app: containers['scartrack_app'] || 'stopped',
      scartrack_db:  containers['scartrack_db']  || 'stopped',
      raw: containers,
    };
  } catch (err) {
    return { scartrack_app: 'unknown', scartrack_db: 'unknown', error: err.message };
  }
}

// ─── System Resources ─────────────────────────────────────────────────────────

async function checkSystem() {
  const results = {};

  // CPU
  try {
    const { stdout } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
    results.cpu_percent = parseFloat(stdout.trim()) || 0;
  } catch {
    try {
      const { stdout } = await execAsync("grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$3+$4+$5)} END {print usage}'");
      results.cpu_percent = parseFloat(stdout.trim()) || 0;
    } catch { results.cpu_percent = -1; }
  }

  // Memory
  try {
    const { stdout } = await execAsync("free | grep Mem | awk '{print int($3/$2*100)}'");
    results.memory_percent = parseInt(stdout.trim()) || 0;
  } catch { results.memory_percent = -1; }

  // Disk
  try {
    const { stdout } = await execAsync("df / | tail -1 | awk '{print int($5)}'");
    results.disk_percent = parseInt(stdout.trim()) || 0;
  } catch { results.disk_percent = -1; }

  return results;
}

// ─── Main Check Logic ─────────────────────────────────────────────────────────

async function runCheck() {
  const state = loadState();
  const ts = new Date().toISOString();

  log('INFO', 'Starting health check', { ts });

  const [platform, containers, system] = await Promise.all([
    checkHTTP(HEALTH_ENDPOINT).catch(() => ({ ok: false, status: 0, latency_ms: TIMEOUT_MS })),
    checkContainers(),
    checkSystem(),
  ]);

  const result = {
    timestamp: ts,
    platform: { url: PLATFORM_URL, ...platform, status: platform.ok ? 'online' : 'offline' },
    containers,
    system,
    alerts_triggered: [],
    overall_status: 'healthy',
  };

  // ── Platform Down / Up Logic ──────────────────────────────────────────────
  if (!platform.ok) {
    state.consecutive_failures = (state.consecutive_failures || 0) + 1;

    if (!state.platform_was_down) {
      // First failure detected
      state.platform_was_down = true;
      state.down_since = ts;
      state.last_alert_at = ts;
      log('CRITICAL', 'Platform is DOWN', { status: platform.status });
      result.alerts_triggered.push('platform_down');
      result.overall_status = 'critical';
      await alerts.platformDown(platform.status).catch(console.error);
    } else {
      // Still down — send update every 15 min
      const lastAlert = new Date(state.last_alert_at);
      const minutesSinceAlert = (Date.now() - lastAlert.getTime()) / 60000;
      if (minutesSinceAlert >= 15) {
        state.last_alert_at = ts;
        const downMinutes = Math.round((Date.now() - new Date(state.down_since).getTime()) / 60000);
        log('CRITICAL', 'Platform still DOWN', { downMinutes });
        result.alerts_triggered.push('platform_still_down');
        result.overall_status = 'critical';
        await alerts.platformDown(`ainda offline há ${downMinutes} min`).catch(console.error);
      }
    }
  } else if (state.platform_was_down) {
    // Platform recovered
    const downMs = Date.now() - new Date(state.down_since).getTime();
    const downMin = Math.round(downMs / 60000);
    state.platform_was_down = false;
    state.down_since = null;
    state.consecutive_failures = 0;
    log('INFO', 'Platform RECOVERED', { downMinutes: downMin });
    result.alerts_triggered.push('platform_recovered');
    await alerts.platformUp(`${downMin} min`).catch(console.error);
  } else {
    state.consecutive_failures = 0;
    log('INFO', 'Platform OK', { latency_ms: platform.latency_ms });
  }

  // ── Latency Warning ──────────────────────────────────────────────────────
  if (platform.ok && platform.latency_ms > LAT_WARN) {
    log('WARNING', 'High latency', { latency_ms: platform.latency_ms });
    result.overall_status = result.overall_status === 'healthy' ? 'degraded' : result.overall_status;
  }

  // ── Containers ───────────────────────────────────────────────────────────
  for (const [name, status] of [['scartrack_app', containers.scartrack_app], ['scartrack_db', containers.scartrack_db]]) {
    if (status === 'stopped' || status === 'unknown' || (status && status.startsWith('Exited'))) {
      log('CRITICAL', `Container DOWN: ${name}`, { status });
      result.alerts_triggered.push(`container_down_${name}`);
      result.overall_status = 'critical';
      await alerts.containerDown(name, status).catch(console.error);
    }
  }

  // ── System Resources ─────────────────────────────────────────────────────
  if (system.cpu_percent >= CPU_CRIT) {
    log('CRITICAL', 'CPU critical', { cpu: system.cpu_percent });
    result.alerts_triggered.push('cpu_critical');
    result.overall_status = 'critical';
    await alerts.highCpu(system.cpu_percent).catch(console.error);
  } else if (system.cpu_percent >= CPU_WARN) {
    log('WARNING', 'CPU high', { cpu: system.cpu_percent });
    result.alerts_triggered.push('cpu_warning');
    if (result.overall_status === 'healthy') result.overall_status = 'degraded';
  }

  if (system.memory_percent >= MEM_CRIT) {
    log('CRITICAL', 'Memory critical', { mem: system.memory_percent });
    result.alerts_triggered.push('memory_critical');
    result.overall_status = 'critical';
    await alerts.highMemory(system.memory_percent).catch(console.error);
  } else if (system.memory_percent >= MEM_WARN) {
    log('WARNING', 'Memory high', { mem: system.memory_percent });
    result.alerts_triggered.push('memory_warning');
    if (result.overall_status === 'healthy') result.overall_status = 'degraded';
  }

  if (system.disk_percent >= DISK_WARN) {
    log('WARNING', 'Disk usage high', { disk: system.disk_percent });
    result.alerts_triggered.push('disk_warning');
    if (result.overall_status === 'healthy') result.overall_status = 'degraded';
  }

  saveState(state);
  log('INFO', `Check complete — ${result.overall_status}`, { alerts: result.alerts_triggered.length });
  return result;
}

runCheck()
  .then((r) => process.exit(r.overall_status === 'critical' ? 1 : 0))
  .catch((err) => { console.error('[FATAL]', err); process.exit(2); });
