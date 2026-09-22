# Stellar Agent Layer v2 · Investor Ready

> Real AI Agent Layer on **Stellar Testnet** with mandatory **Human-in-the-Loop** safety gate, USDC → ARS off-ramp, multi-wallet support and institutional black & gold design.

**Branch:** `v2-vite-investor`  
**Stack:** Vite + React 19 + Express + Tailwind 4 + Stellar SDK

---

## Highlights

- **Human-in-the-Loop Gate** — The agent never signs or submits value-moving transactions. Every payment becomes a `PaymentIntent` that requires explicit user confirmation.
- **USDC → Pesos (ARS) Off-Ramp** — Simulated liquidation to Mercado Pago, Ualá, Lemon, Galicia, Santander, Brubank or any CBU/CVU/Alias.
- **Multi-Wallet Engine** — Generate, import secret, watch-only, Freighter extension.
- **Friendbot + USDC faucet** — One-click testnet funding.
- **Investor Metrics Bar** — Settlement finality, tx cost, custody model, network status.
- **Black & Gold institutional UI** — High-contrast design ready for demos and investor meetings.
- **Local Intent Engine** — Works even without Gemini API key (full offline fallback).

---

## Quick Start

```bash
git clone https://github.com/srbisnes/stellar-agent-layer.git
cd stellar-agent-layer
git checkout v2-vite-investor
npm install
cp .env.example .env
# Optional: add GEMINI_API_KEY and VITE_GOOGLE_CLIENT_ID
npm run dev
```

Open http://localhost:3000

---

## Demo Flow

1. Click **Demo Login**
2. Create Wallet → Fund with Friendbot (+10 000 XLM)
3. Go to “Mover USDC & Transformar a Pesos” → Faucet → +250 USDC
4. Create an off-ramp intent to Mercado Pago
5. Authorize in the confirmation modal (Human-in-the-Loop)
6. Check History + Stellar Expert Testnet

Or use the chat:

- “Crea una wallet y fóndala”
- “Envía 5 XLM a Alice”
- “Transformar 50 USDC a pesos”

---

## Architecture

```
Channels (Web)
      │
      ▼
┌─────────────────────────────────────────────┐
│  Stellar Agent (Intent Engine + Tool Call)  │
│  Wallet · Contact · Payment · History       │
│  Human confirmation gate (modal)            │
└─────────────────────────────────────────────┘
      │
      ▼
  Stellar Horizon Testnet
```

---

## Safety

- Payment tools **only create intents**.
- Human confirmation is required before any signing/submission.
- Testnet only. No mainnet secrets are ever stored or transmitted without the user explicitly providing them.

---

## Environment

| Variable                 | Required | Description                          |
|--------------------------|----------|--------------------------------------|
| `PORT`                   | No       | Server port (default 3000)           |
| `GEMINI_API_KEY`         | No       | Optional Gemini for richer replies   |
| `VITE_GOOGLE_CLIENT_ID`  | No       | Optional Google Identity login       |

---

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start Vite + Express together  |
| `npm run build`| Production build               |
| `npm start`    | Run production server          |

---

## Roadmap (Pre-Seed)

- [ ] Formal security audit
- [ ] Mainnet rollout with hardware-wallet support
- [ ] Real bank rail integration (Argentina)
- [ ] Telegram + WhatsApp channels (ported from v1)
- [ ] Developer SDK

---

Built for the Stellar ecosystem · Black & Gold · Investor ready
