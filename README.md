# Stellar Agent Layer v2 · Investor Ready

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://stellar-agent-layer.vercel.app/)
[![Stellar Testnet](https://img.shields.io/badge/Network-Stellar%20Testnet-7D00FF?style=for-the-badge&logo=stellar)](https://stellar.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

> **Real AI Agent Layer** on Stellar Testnet with mandatory **Human-in-the-Loop** safety gate.
> Wallet · Contacts · Payments · History · USDC → ARS off-ramp · Black & Gold institutional UI.

**Live Demo → [stellar-agent-layer.vercel.app](https://stellar-agent-layer.vercel.app/)**

---

## Highlights

| Feature | Description |
|---------|-------------|
| **Human-in-the-Loop Gate** | The agent never signs or submits value-moving transactions. Every payment becomes a `PaymentIntent` that requires explicit user confirmation. |
| **USDC → Pesos (ARS) Off-Ramp** | Simulated liquidation to Mercado Pago, Ualá, Lemon, Galicia, Santander, Brubank or any CBU/CVU/Alias. |
| **Multi-Wallet Engine** | Generate, import secret, watch-only, Freighter extension. |
| **Friendbot + USDC faucet** | One-click testnet funding. |
| **Investor Metrics Bar** | Settlement finality, tx cost, custody model, network status. |
| **Black & Gold UI** | High-contrast institutional design ready for demos and investor meetings. |
| **Local Intent Engine** | Works even without Gemini API key (full offline fallback). |

---

## Quick Start

```bash
git clone https://github.com/srbisnes/stellar-agent-layer.git
cd stellar-agent-layer
npm install
cp .env.example .env
# Optional: add GEMINI_API_KEY and VITE_GOOGLE_CLIENT_ID
npm run dev
```

Open **http://localhost:3000**

---

## Demo Flow (Web)

1. Click **Demo Login**
2. Create Wallet → Fund with Friendbot (+10 000 XLM)
3. Go to “Mover USDC & Transformar a Pesos” → Faucet → +250 USDC
4. Create an off-ramp intent to Mercado Pago
5. Authorize in the confirmation modal (**Human-in-the-Loop**)
6. Check History + [Stellar Expert Testnet](https://stellar.expert/explorer/testnet)

### Example chat prompts

- “Crea una wallet y fóndala”
- “Envía 5 XLM a Alice”
- “Transformar 50 USDC a pesos”
- “¿Cuál es mi balance?”
- “Mostrame el historial”

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

| Variable                | Required | Description                        |
|-------------------------|----------|------------------------------------|
| `PORT`                  | No       | Server port (default 3000)         |
| `GEMINI_API_KEY`        | No       | Optional Gemini for richer replies |
| `VITE_GOOGLE_CLIENT_ID` | No       | Optional Google Identity login     |

---

## Scripts

| Command         | Description                   |
|-----------------|-------------------------------|
| `npm run dev`   | Start Vite + Express together |
| `npm run build` | Production build              |
| `npm start`     | Run production server         |
| `npm run lint`  | TypeScript check              |

---

## Tech Stack

- **Frontend**: Vite 6 + React 19 + Tailwind CSS 4
- **Backend**: Express + tsx
- **Blockchain**: `@stellar/stellar-sdk` + Horizon Testnet + Friendbot
- **AI**: Local Intent Engine + optional Gemini
- **Wallet**: Freighter + local keypair generation

---

## Roadmap (Pre-Seed)

- [ ] Formal security audit
- [ ] Mainnet rollout with hardware-wallet support
- [ ] Real bank rail integration (Argentina)
- [ ] Telegram + WhatsApp channels (ported from v1)
- [ ] Developer SDK

---

## License

MIT © [srbisnes](https://github.com/srbisnes)

---

**Built for the Stellar ecosystem · Black & Gold · Investor ready**
