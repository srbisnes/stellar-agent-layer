# Contributing to Stellar Agent Layer

Thanks for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/srbisnes/stellar-agent-layer.git
cd stellar-agent-layer
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000

## Guidelines

1. **Safety first** — Never bypass the Human-in-the-Loop confirmation for value-moving transactions.
2. **Testnet only** by default. Mainnet changes must be explicit and guarded.
3. Keep the Intent Engine deterministic and offline-capable when possible.
4. Prefer clear TypeScript types and small, focused PRs.

## Pull Requests

- Create a branch from `main`
- Describe the change and link related issues
- Make sure `npm run lint` passes
- Add screenshots or a short video for UI changes when possible

## Questions?

Open an issue or reach out via the repository.
