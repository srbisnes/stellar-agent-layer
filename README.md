# Stellar Agent Layer

> **Real AI Agent**, not a chatbot in disguise.

Intent Engine + Tool Calling + Wallet / Contact / Payment / History Engines on **Stellar Testnet**, with **mandatory human confirmation** before any payment is signed and submitted.

**Multi-user ready** — Sign in with Google (Clerk). Each user gets an isolated wallet, contacts and payment history.

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

### Auth

- **Clerk** with Google (and email) sign-in / sign-up
- Each user has isolated localStorage data (wallet, contacts, intents)
- Secret keys stay client-side and are only sent at confirmation time

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
```

### 1. OpenAI key

```env
OPENAI_API_KEY=sk-...
```

### 2. Clerk (Google login) — required for multi-user

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → Create application
2. Enable **Google** as social connection
3. Copy the keys into `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

4. In Clerk Dashboard → Paths, set:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Script (Hackathon)

1. **Sign up / Sign in** with Google
2. **Create wallet** → click or ask the agent
3. **Fund with Friendbot** (10,000 test XLM)
4. **Add a contact** (e.g. Alice + a G… address) or let the agent do it
5. Tell the agent: *“Envía 5 XLM a Alice”*
6. A **pending confirmation** appears → Review & Confirm → tx on Testnet
7. Check **History** and [Stellar Expert](https://stellar.expert/explorer/testnet)

## Stack

- Next.js 15 (App Router)
- **Clerk** — Google auth + multi-user isolation
- Vercel AI SDK (`ai` + `@ai-sdk/openai`) — tool calling
- `@stellar/stellar-sdk` + Horizon Testnet + Friendbot
- Tailwind CSS
- Client-side engines (localStorage scoped per user)

## Deploy on Vercel

1. Push to `main`
2. Import the repo in Vercel
3. Set environment variables:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. In Clerk Dashboard → Domains, add your Vercel domain
5. Deploy

## License

MIT — built for learning and hackathon demos.
