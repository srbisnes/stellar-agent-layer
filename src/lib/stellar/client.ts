import {
  Horizon,
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  StrKey,
  Memo,
} from "@stellar/stellar-sdk";
import {
  HORIZON_URL,
  FRIENDBOT_URL,
  TESTNET_USDC_ISSUER,
  TESTNET_ARST_ISSUER,
} from "./config";
import type { NetworkStats } from "@/types";

export const server = new Horizon.Server(HORIZON_URL);

export function isValidPublicKey(address: string): boolean {
  try {
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
}

export function isValidSecretKey(secret: string): boolean {
  try {
    return StrKey.isValidEd25519SecretSeed(secret);
  } catch {
    return false;
  }
}

export function generateKeypair() {
  const kp = Keypair.random();
  return {
    publicKey: kp.publicKey(),
    secretKey: kp.secret(),
  };
}

/**
 * Fund a testnet account.
 * 1) Prefer backend /api/friendbot (no CORS, more reliable)
 * 2) Fallback to direct Friendbot call
 */
export async function fundWithFriendbot(publicKey: string): Promise<{
  success: boolean;
  message: string;
  txHash?: string;
  explorer?: string;
}> {
  // 1) Backend proxy
  try {
    const res = await fetch("/api/friendbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || "Account funded with ~10,000 test XLM",
        txHash: data.txHash,
        explorer:
          data.explorer ||
          (data.txHash
            ? `https://stellar.expert/explorer/testnet/tx/${data.txHash}`
            : `https://stellar.expert/explorer/testnet/account/${publicKey}`),
      };
    }
    // If backend returned a clear error (not network), surface it
    if (res.status >= 400 && data.message) {
      // continue to direct fallback only on 5xx / network-ish cases
      if (res.status < 500) {
        return { success: false, message: data.message };
      }
    }
  } catch {
    // network error → try direct
  }

  // 2) Direct Friendbot fallback
  try {
    const url = `${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.detail || data.title || data.message || "Friendbot failed",
      };
    }
    const txHash = data.hash || data.transaction_hash;
    return {
      success: true,
      message: "Account funded with ~10,000 test XLM",
      txHash,
      explorer: txHash
        ? `https://stellar.expert/explorer/testnet/tx/${txHash}`
        : `https://stellar.expert/explorer/testnet/account/${publicKey}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Friendbot request failed. Try again in a few seconds.",
    };
  }
}

export async function getAccountBalance(publicKey: string) {
  try {
    const account = await server.loadAccount(publicKey);
    const balances = account.balances.map((b: any) => ({
      asset:
        b.asset_type === "native"
          ? "XLM"
          : `${b.asset_code}:${b.asset_issuer}`,
      balance: b.balance,
      code: b.asset_code,
      issuer: b.asset_issuer,
      assetType: b.asset_type,
    }));
    return { success: true, balances, sequence: account.sequenceNumber() };
  } catch (err: any) {
    if (err.response?.status === 404) {
      return { success: false, error: "Account not found (not funded yet)", balances: [] };
    }
    return { success: false, error: err.message, balances: [] };
  }
}

export function getUsdcArsRate(): { rate: number; timestamp: string; spreadPercent: number } {
  return {
    rate: 1285.5,
    timestamp: new Date().toISOString(),
    spreadPercent: 0.25,
  };
}

export async function buildPaymentTransaction({
  sourceSecret,
  destination,
  amount,
  assetCode = "XLM",
  issuerPublicKey,
  memo,
}: {
  sourceSecret: string;
  destination: string;
  amount: string;
  assetCode?: string;
  issuerPublicKey?: string;
  memo?: string;
}) {
  const sourceKeypair = Keypair.fromSecret(sourceSecret);
  const sourcePublic = sourceKeypair.publicKey();
  if (!isValidPublicKey(destination)) {
    throw new Error("Invalid destination public key");
  }
  const account = await server.loadAccount(sourcePublic);

  let stellarAsset: Asset;
  if (!assetCode || assetCode === "XLM") {
    stellarAsset = Asset.native();
  } else {
    const issuer =
      issuerPublicKey ||
      (assetCode === "USDC" ? TESTNET_USDC_ISSUER : TESTNET_ARST_ISSUER);
    stellarAsset = new Asset(assetCode, issuer);
  }

  let builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  }).addOperation(
    Operation.payment({
      destination,
      asset: stellarAsset,
      amount: amount.toString(),
    })
  );
  if (memo) {
    builder = builder.addMemo(Memo.text(memo.slice(0, 28)));
  }
  const tx = builder.setTimeout(180).build();
  tx.sign(sourceKeypair);
  return tx;
}

export async function submitTransaction(tx: any) {
  try {
    const result = await server.submitTransaction(tx);
    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    };
  } catch (err: any) {
    const extras = err.response?.data?.extras;
    return {
      success: false,
      error: extras?.result_codes || err.message,
      raw: extras,
    };
  }
}

export async function addTrustline({
  sourceSecret,
  assetCode,
  issuerPublicKey,
}: {
  sourceSecret: string;
  assetCode: string;
  issuerPublicKey: string;
}) {
  const sourceKeypair = Keypair.fromSecret(sourceSecret);
  const sourcePublic = sourceKeypair.publicKey();
  if (!isValidPublicKey(issuerPublicKey)) {
    throw new Error("Invalid issuer public key");
  }
  const account = await server.loadAccount(sourcePublic);
  const customAsset = new Asset(assetCode, issuerPublicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: customAsset,
      })
    )
    .setTimeout(180)
    .build();

  tx.sign(sourceKeypair);
  return await submitTransaction(tx);
}

export async function getNetworkStats(): Promise<NetworkStats | null> {
  try {
    const ledger = await server.ledgers().order("desc").limit(1).call();
    const latest = ledger.records[0];
    return {
      ledgerSequence: latest.sequence,
      protocolVersion: latest.protocol_version,
      baseFee: latest.base_fee_in_stroops,
      closedAt: latest.closed_at,
      networkPassphrase: Networks.TESTNET,
      horizonUrl: HORIZON_URL,
      healthy: true,
    };
  } catch {
    return null;
  }
}
