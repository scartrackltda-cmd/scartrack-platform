/**
 * Scartrack Agency — Notifier Service
 * Sends alerts to WhatsApp (Evolution API) and Telegram simultaneously
 */

require('dotenv').config({ path: '../.env' });
const https = require('https');
const http = require('http');

const WA_BASE_URL   = 'http://187.127.18.17:43654';
const WA_API_KEY    = process.env.EVOLUTION_API_KEY || 'q6bOgsmWkvMTh4Cz7odqKqa2CG2KFia6';
const WA_INSTANCE   = process.env.WA_INSTANCE || 'SCARTRACK';
const WA_RECIPIENT  = process.env.OWNER_WHATSAPP || '5541991281716';

const TG_BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID    = process.env.TELEGRAM_CHAT_ID;

// ─── Template Engine ─────────────────────────────────────────────────────────

function fillTemplate(template, vars) {
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replaceAll(`{${key}}`, val),
    template
  );
}

function now() {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

// ─── WhatsApp via Evolution API ───────────────────────────────────────────────

async function sendWhatsApp(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ number: WA_RECIPIENT, text });
    const options = {
      hostname: '187.127.18.17',
      port: 43654,
      path: `/message/sendText/${WA_INSTANCE}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': WA_API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ channel: 'whatsapp', status: res.statusCode, body: data }));
    });
    req.on('error', (err) => reject({ channel: 'whatsapp', error: err.message }));
    req.write(body);
    req.end();
  });
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

async function sendTelegram(text) {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
    console.warn('[Notifier] Telegram not configured — skipping');
    return { channel: 'telegram', status: 'skipped', reason: 'missing token/chat_id' };
  }
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      chat_id: TG_CHAT_ID,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TG_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ channel: 'telegram', status: res.statusCode, body: data }));
    });
    req.on('error', (err) => reject({ channel: 'telegram', error: err.message }));
    req.write(body);
    req.end();
  });
}

// ─── Unified Send — Both Channels ─────────────────────────────────────────────

async function notify(message, options = {}) {
  const { whatsapp = true, telegram = true } = options;
  const timestamp = now();
  const text = typeof message === 'string' ? message : fillTemplate(message.template, { timestamp, ...message.vars });

  const promises = [];
  if (whatsapp) promises.push(sendWhatsApp(text).catch((e) => e));
  if (telegram)  promises.push(sendTelegram(text).catch((e) => e));

  const results = await Promise.all(promises);
  console.log(`[Notifier][${timestamp}] Sent to ${results.length} channel(s):`, results.map(r => `${r.channel}:${r.status || r.error}`).join(', '));
  return results;
}

// ─── Named Alert Shortcuts ────────────────────────────────────────────────────

const alerts = {
  platformDown: (statusCode) =>
    notify(`🚨 *ALERTA CRÍTICO — Scartrack*\n\n❌ Plataforma FORA DO AR\n🔗 http://187.127.18.17:3002\n🕐 ${now()}\n📊 Status: ${statusCode || 'sem resposta'}\n\n_Monitoring_Agent detectou a queda. Verificar imediatamente._`),

  platformUp: (downtime) =>
    notify(`✅ *Scartrack — Plataforma Restaurada*\n\n🟢 Plataforma voltou ao ar\n🕐 ${now()}\n⏱️ Indisponível por: ${downtime || 'desconhecido'}\n\n_Sistema normalizado._`),

  containerDown: (name, status) =>
    notify(`⚠️ *Container Parado — Scartrack*\n\n📦 Container: \`${name}\`\n🔴 Status: ${status}\n🕐 ${now()}\n\n_Ação necessária._`),

  dbUnreachable: () =>
    notify(`🔴 *Banco de Dados Inacessível*\n\n🗄️ PostgreSQL/PostGIS indisponível\n🕐 ${now()}\n\n_Verifique o container scartrack_db imediatamente._`),

  highCpu: (pct) =>
    notify(`⚠️ *Alto Consumo de CPU*\n\n📈 CPU: \`${pct}%\`\n🕐 ${now()}\n\n_Monitorando..._`),

  highMemory: (pct) =>
    notify(`⚠️ *Alto Consumo de Memória*\n\n🧠 Memória: \`${pct}%\`\n🕐 ${now()}\n\n_Monitorando..._`),

  dailyReport: (content) =>
    notify(`📊 *Relatório Diário — Scartrack Agency*\n🗓️ ${new Date().toLocaleDateString('pt-BR')}\n\n${content}\n\n_CEO_Scartrack — Gerado automaticamente às 07:00_`),

  devSuggestion: (title, description, actionId) =>
    notify(`💡 *Dev_Agent — Sugestão de Melhoria*\n\n📌 *${title}*\n\n${description}\n\nID da ação: \`${actionId}\`\n\n_Para autorizar: responda 'autorizo ${actionId}'\nPara cancelar: 'cancela ${actionId}'_`),

  authRequired: (action, actionId) =>
    notify(`🔐 *Autorização Necessária — Dev_Agent*\n\nAção solicitada:\n\`\`\`\n${action}\n\`\`\`\n\nID: \`${actionId}\`\n\n_Responda 'autorizo ${actionId}' para prosseguir ou 'cancela ${actionId}' para abortar._`),

  actionCompleted: (description) =>
    notify(`✅ *Ação Concluída*\n\n${description}\n\n🕐 ${now()}`),
};

module.exports = { notify, sendWhatsApp, sendTelegram, alerts, fillTemplate };

// ─── CLI Usage ────────────────────────────────────────────────────────────────
if (require.main === module) {
  const type = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];
  if (type && alerts[type]) {
    alerts[type](arg1, arg2).then(console.log).catch(console.error);
  } else {
    notify(arg1 || '🔔 Teste de notificação — Scartrack Agency').then(console.log);
  }
}
