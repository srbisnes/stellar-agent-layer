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

function parsePayment(text: string): { amount: string; destination: string } | null {
  const t = normalize(text);
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
  // "alice" alone after add-ish verbs
  const short = t.match(/(?:contacto|contact)\s+([a-z0-9_]+)/);
  if (short) return { name: capitalize(short[1]) };
  return null;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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

  // Create wallet
  if (
    /crea(r)?\s+(una\s+)?wallet|create\s+(a\s+)?wallet|nueva\s+wallet|genera(r)?\s+(una\s+)?wallet/.test(
      t
    )
  ) {
    const alsoFund = /fund|fonda|fonde|friendbot/.test(t);
    return {
      content: alsoFund
        ? "Perfecto. Creo una wallet efímera en **Stellar Testnet** y la fondeo con Friendbot (10.000 XLM de prueba). Mirá el panel Wallet."
        : "Creando wallet efímera en Stellar Testnet. Después decime ‘fóndala’ o usá el botón Fund.",
      tools: [
        {
          toolName: "create_wallet",
          result: {
            action: "CREATE_WALLET",
            autoFund: alsoFund,
            message: "Client must generate and store the keypair locally.",
          },
        },
      ],
    };
  }

  // Fund
  if (/fond|fund|friendbot|fonde/.test(t)) {
    if (!hasWallet) {
      return {
        content: "No hay wallet. Creo una y la fondeo ahora.",
        tools: [
          {
            toolName: "create_wallet",
            result: {
              action: "CREATE_WALLET",
              autoFund: true,
              message: "Client must generate and store the keypair locally.",
            },
          },
        ],
      };
    }
    return {
      content: `Fondeando \`${walletContext!.publicKey!.slice(0, 10)}…\` con Friendbot (10.000 XLM). El balance se actualiza en segundos.`,
      tools: [
        {
          toolName: "fund_wallet",
          result: {
            action: "FUND_WALLET",
            publicKey: walletContext!.publicKey,
          },
        },
      ],
    };
  }

  // Balance
  if (/balance|saldo|cu[aá]nto\s+tengo|how\s+much/.test(t)) {
    if (!hasWallet) {
      return {
        content: "No hay wallet. Decime: **crea una wallet y fóndala**.",
        tools: [],
      };
    }
    return {
      content: funded
        ? `**Balance:** ${balance} XLM (Testnet)\n**Public key:** \`${walletContext!.publicKey}\``
        : `Wallet lista pero sin fondos.\n\`${walletContext!.publicKey}\`\nDecime **fóndala** para 10.000 XLM de prueba.`,
      tools: [
        {
          toolName: "get_balance",
          result: { action: "GET_BALANCE", publicKey: walletContext!.publicKey },
        },
      ],
    };
  }

  // Add contact — client will generate a REAL keypair if none provided
  const contact = parseContact(userMessage);
  if (contact || /agreg[aá].*contacto|add\s+contact|nuevo\s+contacto/.test(t)) {
    const name = contact?.name || "Alice";
    return {
      content: contact?.publicKey
        ? `Contacto **${name}** guardado. Ya podés enviarle XLM.`
        : `Creo el contacto **${name}** con una wallet Testnet real (keypair generado + Friendbot). Así el pago on-chain funciona en la demo de inversores.`,
      tools: [
        {
          toolName: "add_contact",
          result: {
            action: "ADD_CONTACT",
            name,
            publicKey: contact?.publicKey || null, // null → client generates real KP
            generateIfMissing: !contact?.publicKey,
            fundIfGenerated: true,
            note: "Demo contact (Testnet)",
          },
        },
      ],
    };
  }

  // Payment intent
  const payment = parsePayment(userMessage);
  if (payment || /envia|manda|pag[aá]|transfer|send\s+\d/.test(t)) {
    if (!hasWallet) {
      return {
        content: "Primero una wallet fondeada. Decime: **crea una wallet y fóndala**.",
        tools: [
          {
            toolName: "create_wallet",
            result: {
              action: "CREATE_WALLET",
              autoFund: true,
              message: "Client must generate and store the keypair locally.",
            },
          },
        ],
      };
    }
    const amount = payment?.amount || "5";
    const destination = payment?.destination || "Alice";
    return {
      content: `**Intent de pago creado**\n• ${amount} XLM → **${destination}**\n\nEl dinero **no se movió**. Confirmá en el panel **Pending Payments** (human gate) para firmar y enviar la tx en Testnet.`,
      tools: [
        {
          toolName: "create_payment_intent",
          result: {
            action: "CREATE_PAYMENT_INTENT",
            destination,
            amount,
            memo: "Investor demo",
            requiresHumanConfirmation: true,
          },
        },
      ],
    };
  }

  if (/historial|history|movimientos|transaccion/.test(t)) {
    return {
      content:
        "Abrí el panel **History**: combina intents locales + pagos Horizon Testnet.",
      tools: [{ toolName: "get_history", result: { action: "GET_HISTORY", limit: 10 } }],
    };
  }

  if (/wallet|cuenta|mi\s+clave|public\s+key|direccion/.test(t)) {
    if (!hasWallet) {
      return {
        content: "Sin wallet. Decime: **crea una wallet y fóndala**.",
        tools: [],
      };
    }
    return {
      content: `**Wallet**\n• Public: \`${walletContext!.publicKey}\`\n• Fondeada: ${funded ? "sí" : "no"}\n• Balance: ${balance} XLM`,
      tools: [
        {
          toolName: "get_wallet_info",
          result: { action: "GET_WALLET_INFO", context: walletContext },
        },
      ],
    };
  }

  return {
    content: `**Stellar Agent Layer** — modo demo listo para inversores (sin OpenAI).

Script sugerido:
1. **Crea una wallet y fóndala**
2. **Agrega un contacto llamado Alice**
3. **Envía 5 XLM a Alice**
4. Confirmá el pago en *Pending Payments*
5. **Mostrame el historial** / Stellar Expert Testnet

Todo corre en **Stellar Testnet**. Los pagos requieren confirmación humana.`,
    tools: [],
  };
}
