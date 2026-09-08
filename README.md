# Stellar Agent Layer

> **Real AI Agent**, not a chatbot in disguise.

Intent Engine + Tool Calling + Wallet / Contact / Payment / History Engines on **Stellar Testnet**, with **mandatory human confirmation** before any payment is signed and submitted.

Ready for hackathon demos.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard (Next.js)                     │
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

### Engines

| Engine | Responsibility |
|--------|----------------|
| **Wallet Engine** | Ephemeral keypairs, Friendbot funding, balances |
| **Contact Engine** | Address book (name ↔ G… public key) |
| **Payment Engine** | Creates **intents only**. Never auto-submits |
| **History Engine** | Merges local intents + Horizon payments |

### Safety

- Payment tools only create **intents**.
- A modal **Human Confirmation** gate is required before signing.
- Secret keys stay client-side / are sent only at confirmation time to the confirm API.
- Testnet only. No mainnet secrets.

## Quick Start

```bash
git clone https://github.com/srbisnes/stellar-agent-layer.git
cd stellar-agent-layer
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY=sk-...
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Script (Hackathon)

1. **Create wallet** → click or ask the agent.
2. **Fund with Friendbot** (10,000 test XLM).
3. **Add a contact** (e.g. Alice + a G… address) or let the agent do it.
4. Tell the agent: *“Envía 5 XLM a Alice”*.
5. A **pending confirmation** appears → Review & Confirm → tx on Testnet.
6. Check **History** and [Stellar Expert](https://stellar.expert/explorer/testnet).

## Stack

- Next.js 15 (App Router)
- Vercel AI SDK (`ai` + `@ai-sdk/openai`) — tool calling
- `@stellar/stellar-sdk` + Horizon Testnet + Friendbot
- Tailwind CSS
- Client-side engines (localStorage for demo persistence)

## Deploy on Vercel

1. Push to `main`.
2. Import the repo in Vercel (or use the linked project).
3. Set `OPENAI_API_KEY` in project environment variables.
4. Deploy.

## License

MIT — built for learning and hackathon demos.
