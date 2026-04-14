# 🛰️ Scartrack Agency

Sistema de agentes IA para monitoramento, desenvolvimento e gestão da **Scartrack Platform** — dentro do OpenClaw `openclaw-h2oa`.

## Agentes

| Agente | Papel | Execução |
|--------|-------|----------|
| **CEO_Scartrack** | Manager — coordena tudo e envia relatório diário às 07:00 | Automático |
| **Monitoring_Agent** | Monitora plataforma, containers, BD e performance 24/7 | A cada 5 min |
| **Dev_Agent** | Sugere e implementa melhorias no código | Só após autorização |

## Stack Monitorada

- **Plataforma**: http://187.127.18.17:3002
- **Repo**: https://github.com/scartrackltda-cmd/scartrack-platform.git
- **Containers**: `scartrack_app`, `scartrack_db`

## Início Rápido

```bash
cp .env.example .env
# Editar .env com TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID
npm install
npm start
```

## Notificações

Todos os alertas e relatórios são enviados **simultaneamente** para:
- 📱 WhatsApp: +5541991281716 (via Evolution API — instância SCARTRACK)
- 🤖 Telegram: configurado via bot token

## Documentação Completa

Ver [guia-implantacao.md](guia-implantacao.md)

---

*Scartrack LTDA — OpenClaw Project `openclaw-h2oa`*
