# Guia de Implantação — Scartrack Agency

## Acesso

- **OpenClaw URL**: http://187.127.18.17:48627
- **Projeto OpenClaw**: `openclaw-h2oa`
- **Plataforma Scartrack**: http://187.127.18.17:3002
- **Orquestrador local**: http://localhost:3100

---

## 1. Configuração Inicial

### 1.1 Variáveis de ambiente

```bash
cd /root/scartrack-agency
cp .env.example .env
nano .env
```

Preencher obrigatoriamente:
- `TELEGRAM_BOT_TOKEN` — token do bot criado via @BotFather
- `TELEGRAM_CHAT_ID`   — seu chat ID (envie /start para @userinfobot)

Os demais valores já estão pré-configurados.

### 1.2 Instalar dependências

```bash
cd /root/scartrack-agency
npm install
```

### 1.3 Obter Telegram Chat ID

1. Abra o Telegram e busque por **@BotFather**
2. Crie um bot: `/newbot` → escolha nome e username
3. Copie o token e coloque em `TELEGRAM_BOT_TOKEN`
4. Busque por **@userinfobot**, envie qualquer mensagem, copie o `id`
5. Coloque em `TELEGRAM_CHAT_ID`

---

## 2. Configuração da Instância WhatsApp

### Criar instância SCARTRACK na Evolution API

```bash
# Criar instância
curl -X POST "http://187.127.18.17:43654/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: q6bOgsmWkvMTh4Cz7odqKqa2CG2KFia6" \
  -d '{
    "instanceName": "SCARTRACK",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# Pegar QR Code para conectar
curl -X GET "http://187.127.18.17:43654/instance/connect/SCARTRACK" \
  -H "apikey: q6bOgsmWkvMTh4Cz7odqKqa2CG2KFia6"
```

Abra o link retornado no navegador para escanear o QR Code com o WhatsApp.

### Configurar webhook da instância SCARTRACK

```bash
curl -X POST "http://187.127.18.17:43654/webhook/set/SCARTRACK" \
  -H "Content-Type: application/json" \
  -H "apikey: q6bOgsmWkvMTh4Cz7odqKqa2CG2KFia6" \
  -d '{
    "url": "http://127.0.0.1:3100/webhook/evolution",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

---

## 3. Configurar Webhook do Telegram

```bash
# Registrar webhook do Telegram para o orquestrador
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"http://SEU_IP_PUBLICO:3100/webhook/telegram\"
  }"
```

> ⚠️ O Telegram requer HTTPS para webhooks públicos. Para VPS sem SSL, use polling ou um tunnel (ngrok/cloudflare tunnel) na porta 3100.

---

## 4. Configuração no OpenClaw (openclaw-h2oa)

### Agente 1: CEO_Scartrack

| Campo       | Valor                        |
|-------------|------------------------------|
| Nome        | CEO_Scartrack                |
| ID/Slug     | ceo-scartrack                |
| Descrição   | Manager — coordena e reporta |
| Provider    | Groq                         |
| Modelo      | llama-3.3-70b-versatile      |
| Temperatura | 0.3                          |
| Max Tokens  | 2048                         |
| Role        | Manager                      |

**System Prompt**: copiar conteúdo de `agents/01-ceo-scartrack.md`

**Agendamento**:
- `0 7 * * *` → ação `daily_report`
- `0 8 * * 1` → ação `weekly_summary`

---

### Agente 2: Monitoring_Agent

| Campo       | Valor                              |
|-------------|------------------------------------|
| Nome        | Monitoring_Agent                   |
| ID/Slug     | monitoring-agent                   |
| Descrição   | Monitora 24/7 plataforma e infra   |
| Provider    | Groq                               |
| Modelo      | llama-3.3-70b-versatile            |
| Temperatura | 0.1                                |
| Max Tokens  | 1024                               |

**System Prompt**: copiar conteúdo de `agents/02-monitoring-agent.md`

**Agendamento**:
- `*/5 * * * *` → ação `health_check`
- `0 6 * * *`   → ação `daily_report`

---

### Agente 3: Dev_Agent

| Campo                 | Valor                               |
|-----------------------|-------------------------------------|
| Nome                  | Dev_Agent                           |
| ID/Slug               | dev-agent                           |
| Descrição             | Dev sênior — sob autorização        |
| Provider              | Groq                                |
| Modelo                | llama-3.3-70b-versatile             |
| Temperatura           | 0.2                                 |
| Max Tokens            | 4096                                |
| Requires Auth         | ✅ Sim                              |

**System Prompt**: copiar conteúdo de `agents/03-dev-agent.md`

**Ferramentas habilitadas**: `code_execution`, `file_read`, `shell_command`

---

## 5. Iniciar a Agency

```bash
# Iniciar todos os serviços
cd /root/scartrack-agency
npm start

# OU manualmente:
bash scripts/start.sh
```

---

## 6. Testar Notificações

```bash
# Testar WhatsApp + Telegram
npm run test-notify

# Simular alerta de plataforma offline
node notifications/notifier.js platformDown 503

# Gerar relatório diário agora
npm run daily-report
```

---

## 7. Verificar Status

```bash
# Ver processos PM2
pm2 status

# Ver logs do orquestrador
pm2 logs scartrack-orchestrator

# Ver log de saúde
tail -f /var/log/scartrack-health.log

# Ver ações pendentes
curl http://localhost:3100/api/actions/pending

# Saúde do orquestrador
curl http://localhost:3100/health
```

---

## 8. Fluxo de Autorização do Dev_Agent

### Como funciona:

```
Dev_Agent identifica melhoria
          │
          ▼
POST /api/action/propose
          │
          ▼
CEO_Scartrack notifica dono
   (WhatsApp + Telegram)
          │
          ▼
Dono responde "autorizo DEV-XXXX-NNN"
          │
          ▼
Orchestrator libera Dev_Agent
          │
          ▼
Dev_Agent executa a ação
          │
          ▼
CEO_Scartrack confirma ao dono
```

### Palavras-chave de autorização:
- `autorizo` / `autorizo DEV-2026-001`
- `pode fazer`
- `pode executar`
- `confirmo`

### Palavras-chave de negação:
- `cancela` / `cancela DEV-2026-001`
- `não autorizo`
- `abort`

---

## 9. Estrutura de Arquivos Criada

```
scartrack-agency/
├── openclaw-config.json        ← Configuração principal OpenClaw
├── package.json
├── .env.example                ← Template de variáveis
├── .env                        ← Suas credenciais (criar a partir do .example)
│
├── agents/
│   ├── 01-ceo-scartrack.md     ← System prompt do CEO_Scartrack
│   ├── 02-monitoring-agent.md  ← System prompt do Monitoring_Agent
│   └── 03-dev-agent.md         ← System prompt do Dev_Agent
│
├── notifications/
│   ├── whatsapp-config.json    ← Templates e config WhatsApp
│   ├── telegram-config.json    ← Templates e comandos Telegram
│   └── notifier.js             ← Serviço de notificação dual-channel
│
├── monitoring/
│   ├── health-check.js         ← Verificação a cada 5 min (Monitoring_Agent)
│   ├── daily-report.js         ← Relatório diário às 07:00 (CEO_Scartrack)
│   ├── state.json              ← Estado atual (gerado automaticamente)
│   └── health.log              ← Log histórico (gerado automaticamente)
│
├── orchestrator/
│   ├── orchestrator.js         ← CEO_Scartrack — API + webhooks
│   ├── pending-actions.json    ← Ações aguardando autorização
│   └── action-log.json         ← Histórico de ações (gerado automaticamente)
│
└── scripts/
    ├── start.sh                ← Inicializa tudo (PM2 + cron)
    ├── setup-cron.sh           ← Instala cron jobs
    └── test-notify.sh          ← Testa notificações
```
