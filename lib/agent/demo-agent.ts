/**
 * Offline Demo Agent — works without OPENAI_API_KEY.
 * Covers the full investor / hackathon script with deterministic tool results
 * so the UI (wallet, contacts, payment intents, history) stays fully functional.
 */

export type DemoToolResult = {
  toolName: string;
  result: Record<string, unknown>;
};

export type DemoReply = {
  content: string;
  tools: DemoToolResult[];
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Extract "send X XLM to NAME" patterns (ES/EN). */
function parsePayment(text: string): { amount: string; destination: string } | null {
  const t = normalize(text);

  // "envía 5 xlm a alice" / "send 10 xlm to bob" / "pagale 3 a carlos"
  const m =
    t.match(
      /(?:envia|envi[aá]|manda|mandale|pag[aá]|pagale|transfer[ií]|send|pay)\s+(\d+(?:[.,]\d+)?)\s*(?:xlm|usdc)?\s*(?:a|to|para)?\s+([a-z0-9_]+|g[a-z0-9]{55})/
    ) ||
    t.match(
      /(\d+(?:[.,]\d+)?)\s*(?:xlm)?\s*(?:a|to|para)\s+([a-z0-9_]+|g[a-z0-9]{55})/
    );

  if (!m) return null;
  return {
    amount: m[1].replace(",", "."),
    destination: m[2].length > 20 ? m[2].toUpperCase() : capitalize(m[2]),
  };
}

function parseContact(text: string): { name: string; publicKey?: string } | null {
  const t = normalize(text);
  // "agrega contacto alice GXXXX" / "add contact bob G..."
  const withKey = t.match(
    /(?:agreg[aá]|añad[ií]|add)\s+(?:contacto?|contact)?\s*([a-z0-9_]+)\s+(g[a-z0-9]{55})/
  );
  if (withKey) {
    return { name: capitalize(withKey[1]), publicKey: withKey[2].toUpperCase() };
  }
  const nameOnly = t.match(
    /(?:agreg[aá]|añad[ií]|add)\s+(?:un\s+)?(?:contacto?|contact)\s+(?:llamado\s+)?([a-z0-9_]+)/
  );
  if (nameOnly) {
    return { name: capitalize(nameOnly[1]) };
  }
  return null;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Deterministic intent router for investor demo.
 */
export function runDemoAgent(
  userMessage: string,
  walletContext?: {
    publicKey?: string;
    funded?: boolean;
    balances?: { asset: string; balance: string }[];
  } | null
): DemoReply {
  const t = normalize(userMessage);
  const hasWallet = Boolean(walletContext?.publicKey);
  const funded = Boolean(walletContext?.funded);
  const balance =
    walletContext?.balances?.find((b) => b.asset === "XLM")?.balance ?? "0";

  // ── Create + fund wallet ──────────────────────────────────────────
  if (
    /crea(r)?\s+(una\s+)?wallet|create\s+(a\s+)?wallet|nueva\s+wallet|genera(r)?\s+(una\s+)?wallet/.test(
      t
    )
  ) {
    const alsoFund = /fund|fonda|fonde|friendbot/.test(t);
    const tools: DemoToolResult[] = [
      {
        toolName: "create_wallet",
        result: {
          action: "CREATE_WALLET",
          message: "Client must generate and store the keypair locally.",
        },
      },
    ];
    if (alsoFund || !hasWallet) {
      // Client will create then we instruct fund in a second step via content
    }
    return {
      content: alsoFund
        ? "Listo. Voy a crear una wallet efímera en Stellar Testnet y fondearla con Friendbot (10.000 XLM de prueba). Revisá el panel de Wallet."
        : "Creando una wallet efímera en Stellar Testnet. Después podés fondearla con Friendbot desde el panel o pidiéndome ‘fondala’.",
      tools,
    };
  }

  // ── Fund wallet ───────────────────────────────────────────────────
  if (/fond|fund|friendbot|fonde/.test(t)) {
    if (!hasWallet) {
      return {
        content:
          "Todavía no hay wallet. Decime ‘crea una wallet y fóndala’ y lo hago en un paso.",
        tools: [
          {
            toolName: "create_wallet",
            result: {
              action: "CREATE_WALLET",
              message: "Client must generate and store the keypair locally.",
            },
          },
        ],
      };
    }
    return {
      content: `Fondeando ${walletContext!.publicKey!.slice(0, 8)}… con Friendbot (10.000 XLM testnet). En unos segundos se actualiza el balance.`,
      tools: [
        {
          toolName: "fund_wallet",
          result: {
            action: "FUND_WALLET",
            publicKey: walletContext!.publicKey,
            message: "Client should call Friendbot / fund endpoint.",
          },
        },
      ],
    };
  }

  // ── Balance ───────────────────────────────────────────────────────
  if (/balance|saldo|cu[aá]nto\s+tengo|how\s+much/.test(t)) {
    if (!hasWallet) {
      return {
        content: "No hay wallet activa. Creá una con ‘crea una wallet y fóndala’.",
        tools: [],
      };
    }
    return {
      content: funded
        ? `Balance actual: **${balance} XLM** (Testnet).\nPublic key: \`${walletContext!.publicKey}\``
        : `Wallet creada pero aún no fondeada.\nPublic key: \`${walletContext!.publicKey}\`\nDecime ‘fóndala’ para recibir 10.000 XLM de prueba.`,
      tools: [
        {
          toolName: "get_balance",
          result: {
            action: "GET_BALANCE",
            publicKey: walletContext!.publicKey,
          },
        },
      ],
    };
  }

  // ── Add contact ───────────────────────────────────────────────────
  const contact = parseContact(userMessage);
  if (contact || /agreg[aá].*contacto|add\s+contact|nuevo\s+contacto/.test(t)) {
    const name = contact?.name || "Alice";
    // Demo public key for Alice if none provided (valid-looking G… placeholder;
    // client will store whatever the agent returns; for real send user can edit)
    const demoKey =
      contact?.publicKey ||
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    return {
      content: contact?.publicKey
        ? `Contacto **${name}** agregado con clave \`${contact.publicKey.slice(0, 8)}…\`. Ya podés enviarle XLM.`
        : `Agrego el contacto **${name}**. ⚠️ Usá una clave G… real de Testnet para pagos on-chain (podés editarlo en el panel de Contactos). Para el demo, creá otra wallet y usá esa public key.`,
      tools: [
        {
          toolName: "add_contact",
          result: {
            action: "ADD_CONTACT",
            name,
            publicKey: demoKey,
            note: "Demo contact",
            message: "Client should persist this contact.",
          },
        },
      ],
    };
  }

  // ── Payment intent ────────────────────────────────────────────────
  const payment = parsePayment(userMessage);
  if (payment || /envia|manda|pag[aá]|transfer|send\s+\d/.test(t)) {
    if (!hasWallet) {
      return {
        content:
          "Primero necesitás una wallet fondeada. Decime ‘crea una wallet y fóndala’.",
        tools: [
          {
            toolName: "create_wallet",
            result: {
              action: "CREATE_WALLET",
              message: "Client must generate and store the keypair locally.",
            },
          },
        ],
      };
    }
    const amount = payment?.amount || "5";
    const destination = payment?.destination || "Alice";
    return {
      content: `Intent de pago creado:\n• **${amount} XLM** → **${destination}**\n\n⚠️ El pago **no se envió**. Está pendiente de **confirmación humana** en el panel de Pending Payments. Revisá y confirmá para firmar la tx en Testnet.`,
      tools: [
        {
          toolName: "create_payment_intent",
          result: {
            action: "CREATE_PAYMENT_INTENT",
            destination,
            amount,
            memo: "Stellar Agent Layer demo",
            message:
              "Payment intent created. Waiting for human confirmation in the dashboard before any XLM is sent.",
            requiresHumanConfirmation: true,
          },
        },
      ],
    };
  }

  // ── History ───────────────────────────────────────────────────────
  if (/historial|history|movimientos|transaccion/.test(t)) {
    return {
      content:
        "Revisá el panel **History** a la derecha: combina intents locales + pagos on-chain de Horizon Testnet.",
      tools: [
        {
          toolName: "get_history",
          result: { action: "GET_HISTORY", limit: 10 },
        },
      ],
    };
  }

  // ── Wallet info ───────────────────────────────────────────────────
  if (/wallet|cuenta|mi\s+clave|public\s+key|direccion/.test(t)) {
    if (!hasWallet) {
      return {
        content: "No hay wallet todavía. Decime ‘crea una wallet y fóndala’.",
        tools: [],
      };
    }
    return {
      content: `Wallet activa:\n• Public: \`${walletContext!.publicKey}\`\n• Fondeada: ${funded ? "sí" : "no"}\n• Balance: ${balance} XLM`,
      tools: [
        {
          toolName: "get_wallet_info",
          result: { action: "GET_WALLET_INFO", context: walletContext },
        },
      ],
    };
  }

  // ── Help / default ────────────────────────────────────────────────
  return {
    content: `Soy el **Stellar Agent Layer** (modo demo offline — sin OpenAI).

Puedo ejecutar el flujo completo de inversores:
1. **“Crea una wallet y fóndala”**
2. **“Agrega contacto Alice”** (después poné una G… real en Contactos)
3. **“Envía 5 XLM a Alice”** → aparece intent pendiente
4. Confirmá el pago en el panel → tx real en Testnet
5. **“Mostrame el historial”**

¿Qué querés hacer?`,
    tools: [],
  };
}
