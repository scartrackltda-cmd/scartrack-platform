/**
 * Scartrack Agency — Orchestrator
 * CEO_Scartrack: gerencia fluxo entre agentes e controle de autorização
 * Também processa webhooks do Telegram e WhatsApp para autorização de ações
 */

require('dotenv').config({ path: '/root/scartrack-agency/.env' });
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const http    = require('http');
const { alerts, notify } = require('../notifications/notifier');

const app  = express();
const PORT = process.env.ORCHESTRATOR_PORT || 3100;

app.use(express.json());

const PENDING_FILE = path.join(__dirname, 'pending-actions.json');
const ACTION_LOG   = path.join(__dirname, 'action-log.json');

// ─── Authorization Keywords ───────────────────────────────────────────────────

const AUTH_KEYWORDS   = ['autorizo', 'pode fazer', 'pode executar', 'go ahead', 'sim pode', 'confirmo'];
const DENIAL_KEYWORDS = ['não autorizo', 'cancela', 'para', 'abort', 'não pode'];

// ─── Pending Actions Store ────────────────────────────────────────────────────

function loadPending() {
  try { return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8')); }
  catch { return { pending: [] }; }
}

function savePending(data) {
  fs.writeFileSync(PENDING_FILE, JSON.stringify(data, null, 2));
}

function loadLog() {
  try { return JSON.parse(fs.readFileSync(ACTION_LOG, 'utf8')); }
  catch { return { actions: [] }; }
}

function saveLog(data) {
  fs.writeFileSync(ACTION_LOG, JSON.stringify(data, null, 2));
}

function logAction(action) {
  const log = loadLog();
  log.actions.unshift({ ...action, logged_at: new Date().toISOString() });
  if (log.actions.length > 500) log.actions = log.actions.slice(0, 500);
  saveLog(log);
}

// ─── Generate Action ID ───────────────────────────────────────────────────────

function generateId() {
  const d = new Date();
  const count = (loadPending().pending.length + loadLog().actions.length + 1).toString().padStart(3, '0');
  return `DEV-${d.getFullYear()}-${count}`;
}

// ─── Process Authorization Message ───────────────────────────────────────────

function parseAuthMessage(text) {
  const lower = text.toLowerCase().trim();

  // Check for action ID in message (e.g. "autorizo DEV-2026-001")
  const idMatch = text.match(/DEV-\d{4}-\d{3}/i);
  const actionId = idMatch ? idMatch[0].toUpperCase() : null;

  const isAuth   = AUTH_KEYWORDS.some(k => lower.includes(k));
  const isDenial = DENIAL_KEYWORDS.some(k => lower.includes(k));

  return { isAuth, isDenial, actionId };
}

async function processAuthorization(text) {
  const { isAuth, isDenial, actionId } = parseAuthMessage(text);
  if (!isAuth && !isDenial) return null;

  const store = loadPending();
  let target = null;

  if (actionId) {
    target = store.pending.find(a => a.id === actionId);
  } else if (store.pending.length === 1) {
    target = store.pending[0];
  } else if (store.pending.length > 1) {
    await notify(`⚠️ Há ${store.pending.length} ações pendentes. Por favor, especifique o ID:\n\n${store.pending.map(a => `• \`${a.id}\` — ${a.title}`).join('\n')}`);
    return { status: 'needs_id' };
  }

  if (!target) {
    if (store.pending.length === 0) {
      await notify('ℹ️ Não há ações pendentes de autorização no momento.');
    } else {
      await notify(`⚠️ ID não encontrado. Ações pendentes:\n${store.pending.map(a => `• \`${a.id}\` — ${a.title}`).join('\n')}`);
    }
    return { status: 'not_found' };
  }

  // Remove from pending
  store.pending = store.pending.filter(a => a.id !== target.id);
  savePending(store);

  if (isAuth) {
    target.status   = 'authorized';
    target.auth_at  = new Date().toISOString();
    logAction(target);
    console.log(`[Orchestrator] Action AUTHORIZED: ${target.id}`);
    await notify(`✅ *Ação autorizada!*\n\n\`${target.id}\` — ${target.title}\n\n_O Dev_Agent foi liberado para executar._`);
    return { status: 'authorized', action: target };
  }

  if (isDenial) {
    target.status    = 'denied';
    target.denied_at = new Date().toISOString();
    logAction(target);
    console.log(`[Orchestrator] Action DENIED: ${target.id}`);
    await notify(`❌ *Ação cancelada.*\n\n\`${target.id}\` — ${target.title}`);
    return { status: 'denied', action: target };
  }
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// Dev_Agent proposes an action
app.post('/api/action/propose', async (req, res) => {
  const { title, description, files_affected, estimated_time, risks, steps, type = 'IMPROVEMENT', priority = 'MÉDIA' } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'title and description required' });

  const action = {
    id: generateId(),
    type,
    priority,
    title,
    description,
    files_affected: files_affected || [],
    estimated_time: estimated_time || 'não informado',
    risks: risks || 'não informado',
    steps: steps || [],
    status: 'pending_auth',
    proposed_at: new Date().toISOString(),
  };

  const store = loadPending();
  store.pending.push(action);
  savePending(store);
  logAction({ ...action, logged_event: 'proposed' });

  await alerts.authRequired(
    `${action.type} | ${action.title}\n\nArquivos: ${(action.files_affected || []).join(', ') || 'n/a'}\nTempo estimado: ${action.estimated_time}\nRiscos: ${action.risks}`,
    action.id
  );

  console.log(`[Orchestrator] Action proposed: ${action.id}`);
  res.json({ success: true, action_id: action.id, message: 'Action proposed — awaiting owner authorization' });
});

// Telegram webhook handler
app.post('/webhook/telegram', async (req, res) => {
  res.sendStatus(200);
  try {
    const update = req.body;
    const msg = update.message || update.edited_message;
    if (!msg || !msg.text) return;

    const text = msg.text;
    console.log(`[Telegram] Message: ${text}`);

    // Handle /status command
    if (text.startsWith('/status')) {
      const store = loadPending();
      const pending = store.pending;
      const statusText = `📊 *Scartrack Agency — Status*\n\n🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\nAções pendentes: ${pending.length}\n${pending.map(a => `• \`${a.id}\` ${a.title}`).join('\n') || 'Nenhuma'}`;
      await notify(statusText, { whatsapp: false });
      return;
    }

    // Handle /ajuda command
    if (text.startsWith('/ajuda')) {
      await notify('*Comandos disponíveis:*\n\n/status — Status dos agentes\n/relatorio — Gerar relatório agora\n/autorizo [ID] — Autorizar ação Dev_Agent\n/cancela [ID] — Cancelar ação Dev_Agent\n/ajuda — Esta ajuda', { whatsapp: false });
      return;
    }

    // Handle /relatorio command
    if (text.startsWith('/relatorio')) {
      await notify('📊 Gerando relatório... aguarde.', { whatsapp: false });
      require('child_process').fork(path.join(__dirname, '../monitoring/daily-report.js'));
      return;
    }

    // Handle authorization
    const result = await processAuthorization(text);
    if (!result) {
      console.log('[Telegram] Message not an authorization command');
    }
  } catch (err) {
    console.error('[Telegram webhook error]', err);
  }
});

// Evolution API (WhatsApp) webhook handler
app.post('/webhook/evolution', async (req, res) => {
  res.sendStatus(200);
  try {
    const { event, data } = req.body;
    if (event !== 'messages.upsert') return;

    const msg     = data?.message;
    const from    = data?.key?.remoteJid;
    const fromMe  = data?.key?.fromMe;
    if (fromMe) return;

    const ownerJid = `${process.env.OWNER_WHATSAPP?.replace('+', '') || '5541991281716'}@s.whatsapp.net`;
    if (from !== ownerJid) return; // Only process messages from the owner

    const text = msg?.conversation || msg?.extendedTextMessage?.text || '';
    if (!text) return;

    console.log(`[WhatsApp] Message from owner: ${text}`);
    const result = await processAuthorization(text);
    if (!result) {
      console.log('[WhatsApp] Message not an authorization command');
    }
  } catch (err) {
    console.error('[Evolution webhook error]', err);
  }
});

// List pending actions
app.get('/api/actions/pending', (req, res) => {
  const store = loadPending();
  res.json(store);
});

// List action history
app.get('/api/actions/log', (req, res) => {
  const log = loadLog();
  res.json({ actions: log.actions.slice(0, 50) });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', agent: 'CEO_Scartrack Orchestrator', timestamp: new Date().toISOString() });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[CEO_Scartrack Orchestrator] Running on port ${PORT}`);
  console.log(`[Webhooks] Telegram: POST /webhook/telegram`);
  console.log(`[Webhooks] WhatsApp: POST /webhook/evolution`);
  console.log(`[API] Actions: GET /api/actions/pending`);
});

module.exports = app;
