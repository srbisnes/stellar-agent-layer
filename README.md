# Stellar Agent Layer

> **Real AI Agent**, not a chatbot in disguise.

Intent Engine + Tool Calling + Wallet / Contact / Payment / History Engines on **Stellar Testnet**, with **mandatory human confirmation** before any payment is signed and submitted.

**Channels**
- 🌐 **Web** — dashboard with Google login (Clerk)
- ✈️ **Telegram** — full agent in chat with Confirm / Cancel buttons

Ready for hackathon demos.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Channels: Web (Clerk) · Telegram               │
├─────────────┬───────────────────────┬───────────────────────┤
│ Wallet      │   Stellar Agent       │  History Engine       │
│ Engine      │   (Intent + Tools)    │                       │
│ Contact     │                       │  Pending              │
│ Engine      │   create_wallet       │  Confirmations        │
│             │   fund_wallet         │  (Human Gate)         │
│             │   add_contact         │                       │
│             │   create_payment_     │                       │
│             │     intent  ──────────┼──► Confirm & Sign     │
│             │   get_balance         │                       │
│             │   get_history         │                       │
└─────────────┴───────────────────────┴───────────────────────┘
                              │
                              ▼
              Stellar SDK + Horizon Testnet + Friendbot
```

### Safety

- Payment tools only create **intents**.
- Human confirmation is required before signing (web modal or Telegram inline buttons).
- Secret keys stay client-side (web) or in server session (Telegram demo).
- Testnet only. No mainnet secrets.

## Quick Start (Web)

```bash
git clone https://github.com/srbisnes/stellar-agent-layer.git
cd stellar-agent-layer
npm install
cp .env.example .env.local
```

Fill:

```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

```bash
npm run dev
```

Open http://localhost:3000 → Sign up with Google.

## Telegram Bot Setup

### 1. Create the bot
1. Open Telegram → talk to [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the steps
3. Copy the **token**

### 2. Env vars

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_SETUP_SECRET=una-clave-secreta-tuya
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

### 3. Deploy on Vercel
Push + set the env vars → deploy.

### 4. Register the webhook (one time)

```bash
curl -X POST https://tu-app.vercel.app/api/telegram/setup \
  -H "x-setup-secret: una-clave-secreta-tuya" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://tu-app.vercel.app/api/telegram/webhook"}'
```

### 5. Use it
Open your bot on Telegram → `/start` → talk naturally:

- "Creá una wallet y fóndala"
- "Agregá contacto Alice GXXXX..."
- "Envía 5 XLM a Alice" → aparece botón **Confirmar**
- "¿Cuál es mi balance?"

## Demo Flow

1. Sign in (web) or `/start` (Telegram)
2. Create wallet → Fund with Friendbot
3. Add contacts
4. Ask to send XLM → **Confirm** (human gate)
5. Check History / Stellar Expert

## Stack

- Next.js 15 (App Router)
- Clerk (Google auth on web)
- Telegram Bot API (webhook)
- Vercel AI SDK + OpenAI tool calling
- `@stellar/stellar-sdk` + Horizon Testnet + Friendbot
- Tailwind CSS

## WhatsApp / Instagram (roadmap)

| Channel | Status | Notes |
|---------|--------|-------|
| **Telegram** | ✅ Ready | Free, inline confirm buttons |
| **WhatsApp** | Planned | Needs Meta Business Cloud API or Twilio |
| **Instagram** | Planned | Meta Messaging API + Business account |

Telegram is the right first channel for a hackathon: free, instant, and the Confirm/Cancel buttons match the human-confirmation design.

## Deploy on Vercel

1. Push to `main`
2. Set env: `OPENAI_API_KEY`, Clerk keys, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_SETUP_SECRET`
3. Deploy
4. Call `/api/telegram/setup` once
5. In Clerk → add your Vercel domain

## License

MIT — built for learning and hackathon demos.
