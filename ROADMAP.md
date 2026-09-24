# Roadmap · Stellar Agent Layer

> Estado público del proyecto · Actualizado: 24 Septiembre 2026

---

## Objetivo final

Convertir **Stellar Agent Layer** en el agente de pagos más usable y seguro de Stellar:

- Lenguaje natural → pagos reales
- **Human-in-the-Loop** obligatorio (el agente nunca firma solo)
- Multi-canal (Web + Telegram + WhatsApp)
- Experiencia lista para usuarios reales en Argentina y LatAm

---

## Prioridad actual

### 1. Wallet fluida + obtención de XLM  ← **LISTO ✅**

**Resultado**  
El usuario puede crear una wallet y recibir XLM de testnet en segundos, con feedback claro.

**Completado**
- [x] Fondeo vía backend `/api/friendbot` (evita CORS / rate-limit)
- [x] Fallback a Friendbot directo si el backend no responde
- [x] Mensajes de éxito / error claros + link a Stellar Expert
- [x] Botón visible **“Conectar Freighter”**
- [x] Refresh de balance confiable después del fondeo (con reintentos)
- [x] UI muestra “Fondear +10k XLM” mientras no haya balance

**Cómo probar local**
```bash
npm install
npm run dev:full   # server (3000) + Vite (5173)
# Abrí http://localhost:5173 → Crear Wallet → Fondear +10k XLM
```

---

### 2. Canal de mensajería (Telegram primero)  ← **SIGUIENTE**

**Por qué Telegram primero**
- Setup rápido (BotFather)
- Botones inline perfectos para Confirmar / Cancelar (Human-in-the-Loop)
- No requiere verificación de empresa
- Ya existe código de v1 listo para portar al stack actual (Vite + Express)

**Alcance**
- [ ] Bot de Telegram conectado al Intent Engine
- [ ] Crear wallet / fondear / enviar XLM por mensaje
- [ ] Confirmación humana con botones inline
- [ ] Historial y balance por chat

**Después de Telegram → WhatsApp**
- WhatsApp Business Cloud API (más fricción de Meta, pero mayor alcance en Argentina)

---

### 3. Experiencia profesional y diferencial en Stellar

Una vez que el canal de mensajería esté sólido:

| Diferencial | Descripción |
|-------------|-------------|
| **Human-in-the-Loop real** | El agente prepara, el humano confirma. Nunca se firma solo. |
| **Lenguaje natural** | “Envía 5 XLM a Juan” → intent → confirmación → tx |
| **Multi-canal** | Web + Telegram (+ WhatsApp) |
| **Off-ramp ARS (simulado → real)** | USDC → Mercado Pago / Ualá / Lemon / CBU |
| **UI institutional** | Black & Gold lista para demos e inversores |

---

## Roadmap de medio plazo (Pre-Seed)

| # | Item | Prioridad | Issue |
|---|------|-----------|-------|
| 1 | Formal security audit | Alta | [#2](https://github.com/srbisnes/stellar-agent-layer/issues/2) |
| 2 | Mainnet + hardware wallet | Alta | [#3](https://github.com/srbisnes/stellar-agent-layer/issues/3) |
| 3 | Real bank rail integration (Argentina) | Media-Alta | [#4](https://github.com/srbisnes/stellar-agent-layer/issues/4) |
| 4 | Telegram + WhatsApp (producción) | Media | [#5](https://github.com/srbisnes/stellar-agent-layer/issues/5) |
| 5 | Developer SDK | Media | [#6](https://github.com/srbisnes/stellar-agent-layer/issues/6) |

---

## Cómo contribuir / seguir el progreso

1. Revisá los [Issues abiertos](https://github.com/srbisnes/stellar-agent-layer/issues)
2. El progreso de la prioridad actual se actualiza en este archivo y en los issues
3. Pull requests bienvenidos (ver [CONTRIBUTING.md](CONTRIBUTING.md))

---

**Demo en vivo:** [stellar-agent-layer.vercel.app](https://stellar-agent-layer.vercel.app/)  
**Red:** Stellar Testnet únicamente (por ahora)
