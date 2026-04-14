#!/usr/bin/env node
/**
 * Scartrack Agency — Health Check Script
 * Monitoring_Agent: verifica plataforma, containers e sistema a cada 5 minutos
 * Funciona tanto no HOST (cron sistema) quanto dentro do container OpenClaw
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const http  = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs   = require('fs');
const path = require('path');
const { alerts } = require('../notifications/notifier');

const execAsync = promisify(exec);

const STATE_FILE = path.join(__dirname, 'state.json');
// Log: prefer /var/log on host, fall back to local dir inside container
const LOG_FILE = (() => {
  try { fs.accessSync('/var/log', fs.constants.W_OK); return '/var/log/scartrack-health.log'; }
  catch { return path.join(__dirname, 'health.log'); }
})();

const ORCHESTRATOR_HOST = process.env.ORCHESTRATOR_HOST || '172.16.0.1';
const ORCHESTRATOR_PORT = process.env.ORCHESTRATOR_PORT || 3100;
const PLATFORM_URL      = 'http://187.127.18.17:3002';
const HEALTH_ENDPOINT   = 'http://187.127.18.17:3002/api/health';
const TIMEOUT_MS        = 10000;
const CPU_WARN  = 80;  const CPU_CRIT  = 90;
const MEM_WARN  = 80;  const MEM_CRIT  = 90;
const DISK_WARN = 85;  const LAT_WARN  = 2000;

// ─── State & Log ─────────────────────────────────────────────────────────────

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { platform_was_down: false, down_since: null, last_alert_at: null, consecutive_failures: 0 }; }
}

function saveState(state) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch { /* skip */ }
}

function log(level, message, data = {}) {
  const entry = { timestamp: new Date().toISOString(), level, message, ...data };
  try { fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n'); } catch { /* skip if no write permission */ }
  console.log(`[${level}] ${message}`, Object.keys(data).length ? data : '');
}

// ─── Platform HTTP Check ──────────────────────────────────────────────────────

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

// ─── Containers + System via Orchestrator API (fallback: local docker/shell) ──

async function fetchFromOrchestrator() {
  return new Promise((resolve) => {
    const req = http.get(`http://${ORCHESTRATOR_HOST}:${ORCHESTRATOR_PORT}/api/status`, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function checkContainers(orchestratorData) {
  // Use orchestrator data if available
  if (orchestratorData?.containers) {
    const c = orchestratorData.containers;
    return {
      scartrack_app: c['scartrack_app'] || 'stopped',
      scartrack_db:  c['scartrack_db']  || 'stopped',
    };
  }
  // Fallback: try local docker
  try {
    const { stdout } = await execAsync('docker ps --format "{{.Names}}|{{.Status}}" 2>/dev/null');
    const containers = {};
    stdout.trim().split('\n').forEach(line => {
      const [name, status] = line.split('|');
      if (name) containers[name.trim()] = status ? status.trim() : 'unknown';
    });
    return { scartrack_app: containers['scartrack_app'] || 'stopped', scartrack_db: containers['scartrack_db'] || 'stopped' };
  } catch {
    return { scartrack_app: 'unknown', scartrack_db: 'unknown' };
  }
}

async function checkSystem(orchestratorData) {
  // Use orchestrator data if available
  if (orchestratorData?.system) {
    return {
      cpu_percent:    orchestratorData.system.cpu_percent    ?? -1,
      memory_percent: orchestratorData.system.memory_percent ?? -1,
      disk_percent:   orchestratorData.system.disk_percent   ?? -1,
    };
  }
  // Fallback: local shell
  const r = {};
  try {
    const { stdout } = await execAsync("grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$3+$4+$5)} END {printf \"%.1f\", usage}'");
    r.cpu_percent = parseFloat(stdout.trim()) || 0;
  } catch { r.cpu_percent = -1; }
  try {
    const { stdout } = await execAsync("free | grep Mem | awk '{print int($3/$2*100)}'");
    r.memory_percent = parseInt(stdout.trim()) || 0;
  } catch { r.memory_percent = -1; }
  try {
    const { stdout } = await execAsync("df / | tail -1 | awk '{print int($5)}'");
    r.disk_percent = parseInt(stdout.trim()) || 0;
  } catch { r.disk_percent = -1; }
  return r;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function runCheck() {
  const state = loadState();
  const ts = new Date().toISOString();
  log('INFO', 'Starting health check', { ts });

  // Fetch orchestrator data and platform check in parallel
  const [orchestratorData, platform] = await Promise.all([
    fetchFromOrchestrator(),
    checkHTTP(HEALTH_ENDPOINT).catch(() => ({ ok: false, status: 0, latency_ms: TIMEOUT_MS })),
  ]);

  const [containers, system] = await Promise.all([
    checkContainers(orchestratorData),
    checkSystem(orchestratorData),
  ]);

  const result = {
    timestamp: ts,
    platform: { url: PLATFORM_URL, ...platform, status: platform.ok ? 'online' : 'offline' },
    containers,
    system,
    alerts_triggered: [],
    overall_status: 'healthy',
  };

  // ── Platform Down / Up ────────────────────────────────────────────────────
  if (!platform.ok) {
    state.consecutive_failures = (state.consecutive_failures || 0) + 1;
    if (!state.platform_was_down) {
      state.platform_was_down = true;
      state.down_since = ts;
      state.last_alert_at = ts;
      log('CRITICAL', 'Platform is DOWN', { status: platform.status });
      result.alerts_triggered.push('platform_down');
      result.overall_status = 'critical';
      await alerts.platformDown(platform.status).catch(console.error);
    } else {
      const minutesSince = (Date.now() - new Date(state.last_alert_at).getTime()) / 60000;
      if (minutesSince >= 15) {
        state.last_alert_at = ts;
        const downMin = Math.round((Date.now() - new Date(state.down_since).getTime()) / 60000);
        log('CRITICAL', 'Platform still DOWN', { downMin });
        result.overall_status = 'critical';
        await alerts.platformDown(`ainda offline há ${downMin} min`).catch(console.error);
      }
    }
  } else if (state.platform_was_down) {
    const downMin = Math.round((Date.now() - new Date(state.down_since).getTime()) / 60000);
    state.platform_was_down = false;
    state.down_since = null;
    state.consecutive_failures = 0;
    log('INFO', 'Platform RECOVERED', { downMin });
    result.alerts_triggered.push('platform_recovered');
    await alerts.platformUp(`${downMin} min`).catch(console.error);
  } else {
    state.consecutive_failures = 0;
    log('INFO', 'Platform OK', { latency_ms: platform.latency_ms });
  }

  // ── Latency ──────────────────────────────────────────────────────────────
  if (platform.ok && platform.latency_ms > LAT_WARN) {
    log('WARNING', 'High latency', { latency_ms: platform.latency_ms });
    if (result.overall_status === 'healthy') result.overall_status = 'degraded';
  }

  // ── Containers ───────────────────────────────────────────────────────────
  for (const [name, status] of [['scartrack_app', containers.scartrack_app], ['scartrack_db', containers.scartrack_db]]) {
    if (status && (status === 'stopped' || status.startsWith('Exited'))) {
      log('CRITICAL', `Container DOWN: ${name}`, { status });
      result.alerts_triggered.push(`container_down_${name}`);
      result.overall_status = 'critical';
      await alerts.containerDown(name, status).catch(console.error);
    }
  }

  // ── Resources ────────────────────────────────────────────────────────────
  if (system.cpu_percent >= CPU_CRIT) {
    log('CRITICAL', 'CPU critical', { cpu: system.cpu_percent });
    result.overall_status = 'critical';
    await alerts.highCpu(system.cpu_percent).catch(console.error);
  } else if (system.cpu_percent >= CPU_WARN) {
    log('WARNING', 'CPU high', { cpu: system.cpu_percent });
    if (result.overall_status === 'healthy') result.overall_status = 'degraded';
  }

  if (system.memory_percent >= MEM_CRIT) {
    log('CRITICAL', 'Memory critical', { mem: system.memory_percent });
    result.overall_status = 'critical';
    await alerts.highMemory(system.memory_percent).catch(console.error);
  } else if (system.memory_percent >= MEM_WARN) {
    log('WARNING', 'Memory high', { mem: system.memory_percent });
    if (result.overall_status === 'healthy') result.overall_status = 'degraded';
  }

  if (system.disk_percent >= DISK_WARN) {
    log('WARNING', 'Disk usage high', { disk: system.disk_percent });
    if (result.overall_status === 'healthy') result.overall_status = 'degraded';
  }

  saveState(state);
  log('INFO', `Check complete — ${result.overall_status}`, { alerts: result.alerts_triggered.length });
  return result;
}

runCheck()
  .then((r) => process.exit(r.overall_status === 'critical' ? 1 : 0))
  .catch((err) => { console.error('[FATAL]', err); process.exit(2); });
