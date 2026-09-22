/**
 * Intent agent for Stellar Testnet.
 * When OPENAI_API_KEY is set, /api/agent uses GPT tool-calling.
 * Otherwise this deterministic router drives the same tools so the
 * full on-chain flow (wallet → Friendbot → intent → signed tx) still works.
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
  if (nameOnly) return { name: capitalize(nameOnly[1]) };
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

  if (
    /crea(r)?\s+(una\s+)?wallet|create\s+(a\s+)?wallet|nueva\s+wallet|genera(r)?\s+(una\s+)?wallet/.test(
      t
    )
  ) {
    const alsoFund = /fund|fonda|fonde|friendbot/.test(t);
    return {
      content: alsoFund
        ? "Genero una keypair ed25519 en **Stellar Testnet** y la activo con Friendbot (10.000 XLM). La clave secreta queda solo en tu navegador."
        : "Genero una keypair efímera en Stellar Testnet. Después podés fondearla con Friendbot.",
      tools: [
        {
          toolName: "create_wallet",
          result: {
            action: "CREATE_WALLET",
            autoFund: alsoFund,
            message: "Client generates and stores the keypair locally.",
          },
        },
      ],
    };
  }

  if (/fond|fund|friendbot|fonde/.test(t)) {
    if (!hasWallet) {
      return {
        content: "No hay cuenta aún. Creo la wallet y la fondeo con Friendbot ahora.",
        tools: [
          {
            toolName: "create_wallet",
            result: {
              action: "CREATE_WALLET",
              autoFund: true,
              message: "Client generates and stores the keypair locally.",
            },
          },
        ],
      };
    }
    return {
      content: `Solicito funding a Friendbot para \`${walletContext!.publicKey!.slice(0, 12)}…\`. En unos segundos Horizon debería mostrar ~10.000 XLM.`,
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

  if (/balance|saldo|cu[aá]nto\s+tengo|how\s+much/.test(t)) {
    if (!hasWallet) {
      return {
        content: "No hay wallet. Pedime crear y fondear una cuenta Testnet.",
        tools: [],
      };
    }
    return {
      content: funded
        ? `Balance en Horizon Testnet: **${balance} XLM**\nCuenta: \`${walletContext!.publicKey}\`\n[Ver en Stellar Expert](https://stellar.expert/explorer/testnet/account/${walletContext!.publicKey})`
        : `Cuenta creada pero aún no fondeada.\n\`${walletContext!.publicKey}\`\nPedime fondearla con Friendbot.`,
      tools: [
        {
          toolName: "get_balance",
          result: { action: "GET_BALANCE", publicKey: walletContext!.publicKey },
        },
      ],
    };
  }

  const contact = parseContact(userMessage);
  if (contact || /agreg[aá].*contacto|add\s+contact|nuevo\s+contacto/.test(t)) {
    const name = contact?.name || "Alice";
    return {
      content: contact?.publicKey
        ? `Guardé **${name}** (\`${contact.publicKey.slice(0, 8)}…\`) en la agenda. Ya podés crear un intent de pago.`
        : `Creo el contacto **${name}**: genero una cuenta Testnet real, la fondeo con Friendbot y la guardo en la agenda para que el pago on-chain funcione de punta a punta.`,
      tools: [
        {
          toolName: "add_contact",
          result: {
            action: "ADD_CONTACT",
            name,
            publicKey: contact?.publicKey || null,
            generateIfMissing: !contact?.publicKey,
            fundIfGenerated: true,
            note: "Testnet contact",
          },
        },
      ],
    };
  }

  const payment = parsePayment(userMessage);
  if (payment || /envia|manda|pag[aá]|transfer|send\s+\d/.test(t)) {
    if (!hasWallet) {
      return {
        content: "Primero necesitás una cuenta fondeada en Testnet.",
        tools: [
          {
            toolName: "create_wallet",
            result: {
              action: "CREATE_WALLET",
              autoFund: true,
              message: "Client generates and stores the keypair locally.",
            },
          },
        ],
      };
    }
    const amount = payment?.amount || "5";
    const destination = payment?.destination || "Alice";
    return {
      content: `**Payment intent**\n• ${amount} XLM → **${destination}**\n• Red: Stellar Testnet\n\nNo firmé ni envié nada. Confirmá en **Pending Confirmations** para construir la operación Payment, firmar con tu clave local y submit a Horizon.`,
      tools: [
        {
          toolName: "create_payment_intent",
          result: {
            action: "CREATE_PAYMENT_INTENT",
            destination,
            amount,
            memo: "Stellar Agent Layer",
            requiresHumanConfirmation: true,
          },
        },
      ],
    };
  }

  if (/historial|history|movimientos|transaccion/.test(t)) {
    return {
      content:
        "El panel **History** combina intents del agente con pagos reales leídos desde Horizon Testnet. Cada tx exitosa tiene link a Stellar Expert.",
      tools: [{ toolName: "get_history", result: { action: "GET_HISTORY", limit: 15 } }],
    };
  }

  if (/wallet|cuenta|mi\s+clave|public\s+key|direccion/.test(t)) {
    if (!hasWallet) {
      return { content: "Sin cuenta activa. Pedime crear una wallet Testnet.", tools: [] };
    }
    return {
      content: `**Cuenta activa**\n• Public: \`${walletContext!.publicKey}\`\n• Fondeada: ${funded ? "sí" : "no"}\n• Balance: ${balance} XLM\n• [Stellar Expert](https://stellar.expert/explorer/testnet/account/${walletContext!.publicKey})`,
      tools: [
        {
          toolName: "get_wallet_info",
          result: { action: "GET_WALLET_INFO", context: walletContext },
        },
      ],
    };
  }

  return {
    content: `Soy el **Stellar Agent** sobre **Stellar Testnet**.

Puedo:
• Crear y fondear cuentas (Friendbot)
• Administrar contactos
• Crear payment intents (vos confirmás y firmás)
• Leer balances e historial desde Horizon

Probá: **“Crea una wallet y fóndala”** → **“Agrega contacto Alice”** → **“Envía 5 XLM a Alice”** → confirmá el pago.`,
    tools: [],
  };
}
