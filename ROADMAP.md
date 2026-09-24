# Roadmap · Stellar Agent Layer

> Estado público del proyecto · Actualizado: Septiembre 2026

---

## Objetivo final

Convertir **Stellar Agent Layer** en el agente de pagos más usable y seguro de Stellar:

- Lenguaje natural → pagos reales
- **Human-in-the-Loop** obligatorio (el agente nunca firma solo)
- Multi-canal (Web + Telegram + WhatsApp)
- Experiencia lista para usuarios reales en Argentina y LatAm

---

## Prioridad actual (lo que se está construyendo ahora)

### 1. Wallet fluida + obtención de XLM  ← **EN CURSO**

**Problema a resolver**  
El usuario debe poder crear una wallet y recibir XLM de testnet en menos de 30 segundos, con feedback claro.

**Qué falta / se está terminando**
- [ ] Fondeo vía backend (evitar problemas de CORS / rate-limit de Friendbot desde el browser)
- [ ] Mensajes de éxito / error claros + link a Stellar Expert
- [ ] Botón visible **“Conectar Freighter”**
- [ ] Refresh de balance confiable después del fondeo

**Resultado esperado**  
Cualquier persona puede entrar al demo, crear wallet, fondear y ver su balance de XLM sin fricción.

---

### 2. Canal de mensajería (Telegram primero)

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

Una vez que la wallet y el canal de mensajería estén sólidos:

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
