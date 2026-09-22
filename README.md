# Stellar Agent Layer

> **Real AI Agent**, not a chatbot in disguise.

Intent Engine + Tool Calling + Wallet / Contact / Payment / History Engines on **Stellar Testnet**, with **mandatory human confirmation** before any payment is signed and submitted.

**Channels**

| Channel | Status | Notes |
|---------|--------|-------|
| 🌐 **Web** | ✅ | Google login (Clerk) + dashboard |
| ✈️ **Telegram** | ✅ | Bot + Confirm/Cancel buttons |
| 📱 **WhatsApp** | ✅ | Business Cloud API + interactive buttons |
| 📸 Instagram | Planned | Meta Messaging API |

## Architecture

```
Channels: Web (Clerk) · Telegram · WhatsApp Business
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│  Stellar Agent (Intent Engine + Tool Calling)             │
│  Wallet · Contact · Payment · History Engines             │
│  Human confirmation gate (modal / botones)                │
└───────────────────────────────────────────────────────────┘
        │
        ▼
  Stellar SDK + Horizon Testnet + Friendbot
```

### Safety

- Payment tools only create **intents**.
- Human confirmation required before signing (web modal, Telegram inline buttons, WhatsApp interactive buttons).
- Testnet only. No mainnet secrets.

## Quick Start (Web)

```bash
git clone https://github.com/srbisnes/stellar-agent-layer.git
cd stellar-agent-layer
npm install
cp .env.example .env.local
```

```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

```bash
npm run dev
```

## Telegram

1. [@BotFather](https://t.me/BotFather) → `/newbot` → copy token  
2. Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_SETUP_SECRET`, `NEXT_PUBLIC_APP_URL`  
3. Deploy → register webhook:

```bash
curl -X POST https://YOUR_DOMAIN/api/telegram/setup \
  -H "x-setup-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://YOUR_DOMAIN/api/telegram/webhook"}'
```

## WhatsApp Business Cloud API

### 1. Meta setup

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. **Create App** → type **Business**
3. Add product **WhatsApp**
4. In WhatsApp → **API Setup**:
   - Copy **Phone number ID**
   - Copy **Temporary access token** (or generate a permanent System User token for production)
5. Add your personal number as a **test recipient** (required while in dev mode)

### 2. Env vars

```env
WHATSAPP_ACCESS_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_VERIFY_TOKEN=stellar-agent-verify-change-me
```

`WHATSAPP_VERIFY_TOKEN` is **any string you invent** — you will paste the same value in the Meta webhook config.

### 3. Deploy on Vercel

Set the env vars and deploy. Your webhook URL will be:

```text
https://YOUR_DOMAIN/api/whatsapp/webhook
```

### 4. Configure webhook in Meta

1. WhatsApp → **Configuration** → **Webhook** → Edit
2. **Callback URL**: `https://YOUR_DOMAIN/api/whatsapp/webhook`
3. **Verify token**: same as `WHATSAPP_VERIFY_TOKEN`
4. Subscribe to the field: **messages**
5. Save

Meta will send a GET challenge; the route answers automatically if the verify token matches.

### 5. Test

From the Meta panel (or from your linked test phone), send a message to the business number:

- `hola` or `/start`
- `Creá una wallet y fóndala`
- `Agregá contacto Alice GXXXX...`
- `Envía 5 XLM a Alice` → botones **Confirmar pago** / **Cancelar**

Health check: `GET /api/whatsapp/health`

### Notes (WhatsApp)

- In **development** mode you can only message numbers added as test recipients.
- Temporary tokens expire (~24h). For a real demo use a **permanent System User token** with `whatsapp_business_messaging` permission.
- Interactive buttons: max 3, title max 20 characters (already handled).
- Session storage is in-memory (fine for hackathon). Use Redis/KV in production.

## Demo Flow (any channel)

1. Open channel (web / Telegram / WhatsApp)
2. Create wallet → Fund with Friendbot
3. Add contacts
4. Ask to send XLM → **Confirm** (human gate)
5. Check History / [Stellar Expert Testnet](https://stellar.expert/explorer/testnet)

## Stack

- Next.js 15 (App Router)
- Clerk (web auth)
- Telegram Bot API
- WhatsApp Business Cloud API (Meta Graph v21)
- Vercel AI SDK + OpenAI tool calling
- `@stellar/stellar-sdk` + Horizon Testnet + Friendbot
- Tailwind CSS

## Deploy checklist (Vercel)

| Variable | Required for |
|----------|----------------|
| `OPENAI_API_KEY` | All channels |
| `NEXT_PUBLIC_CLERK_*` / `CLERK_SECRET_KEY` | Web |
| `TELEGRAM_BOT_TOKEN` | Telegram |
| `TELEGRAM_SETUP_SECRET` | Telegram webhook setup |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook verify |

## License

MIT — built for learning and hackathon demos.
