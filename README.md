# 🛰️ Scartrack Platform

Plataforma de rastreamento veicular em tempo real, construída com Next.js 15, Prisma + PostGIS e Socket.io.

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 15 (App Router) | Framework fullstack |
| TypeScript | 5.x | Tipagem |
| Tailwind CSS | 3.x | Estilos |
| shadcn/ui | latest | Componentes UI |
| Prisma ORM | 5.x | Banco de dados |
| PostgreSQL + PostGIS | 16 + 3.4 | Dados geoespaciais |
| Socket.io | 4.x | Tempo real |
| Docker | — | Containerização |

## Início Rápido

### 1. Com Docker (recomendado)

```bash
# Clone o projeto
git clone <repo>
cd scartrack-platform

# Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com seu MAPBOX_TOKEN

# Suba tudo com um comando
docker compose up --build
```

A plataforma estará disponível em **http://localhost:3000**

### 2. Desenvolvimento local

```bash
# Instale dependências
npm install

# Configure .env
cp .env.example .env

# Suba apenas o banco de dados
docker compose up db -d

# Execute as migrações
npm run db:migrate:dev

# Inicie o servidor de desenvolvimento
npm run dev
```

## Scripts disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia produção
npm run lint         # Lint do código

npm run db:generate  # Gera cliente Prisma
npm run db:migrate   # Aplica migrações (produção)
npm run db:migrate:dev  # Cria e aplica migrações (dev)
npm run db:studio    # Interface visual do banco
npm run db:seed      # Popula banco com dados de exemplo
```

## Estrutura do Projeto

```
scartrack-platform/
├── app/
│   ├── (dashboard)/       # Rotas protegidas com layout sidebar
│   │   ├── page.tsx        # Dashboard principal (mapa + stats)
│   │   ├── vehicles/       # Gestão de veículos
│   │   ├── map/            # Mapa em tela cheia
│   │   ├── reports/        # Relatórios
│   │   └── settings/       # Configurações
│   ├── layout.tsx          # Layout raiz
│   └── globals.css         # Estilos globais + variáveis CSS
│
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── sidebar/            # Sidebar de navegação
│   ├── header/             # Header com busca e perfil
│   ├── map/                # Componente de mapa (Mapbox)
│   └── dashboard/          # Cards e listas do dashboard
│
├── lib/
│   ├── utils.ts            # Utilitários (cn, formatadores)
│   ├── prisma.ts           # Cliente Prisma singleton
│   └── socket.ts           # Cliente Socket.io
│
├── prisma/
│   └── schema.prisma       # Schema com extensões PostGIS
│
├── docker/
│   └── init.sql            # Script de inicialização do PostgreSQL
│
├── docker-compose.yml      # App + PostgreSQL + PostGIS
├── Dockerfile              # Build otimizado multi-stage
└── .env.example            # Template de variáveis de ambiente
```

## Integração com Mapbox

1. Obtenha um token em [account.mapbox.com](https://account.mapbox.com/access-tokens/)
2. Adicione ao `.env`:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiXXXX...
   ```
3. Instale o pacote: `npm install mapbox-gl @types/mapbox-gl`
4. Substitua o placeholder em `components/map/MapPreview.tsx` pelo mapa real

## Banco de Dados

O schema inclui as seguintes tabelas:

- **users** — Usuários da plataforma (ADMIN, MANAGER, OPERATOR, VIEWER)
- **devices** — Rastreadores GPS (IMEI, status, última comunicação)
- **vehicles** — Veículos da frota (placa, tipo, condutor associado)
- **locations** — Histórico de posições (lat, lng, speed, heading, ignição)
- **geofences** — Cercas virtuais (polígonos em JSON)
- **alerts** — Alertas do sistema (velocidade, geocerca, bateria, SOS)

## Licença

Propriedade da **Scartrack LTDA** — Todos os direitos reservados.
