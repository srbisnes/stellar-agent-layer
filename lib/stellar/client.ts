import {
  Horizon,
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  StrKey,
} from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "./config";

export const server = new Horizon.Server(STELLAR_CONFIG.horizonUrl);

export function isValidPublicKey(address: string): boolean {
  try {
    return StrKey.isValidEd25519PublicKey(address);
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

export async function fundWithFriendbot(publicKey: string): Promise<{
  success: boolean;
  message: string;
  txHash?: string;
}> {
  try {
    const url = `${STELLAR_CONFIG.friendbotUrl}?addr=${encodeURIComponent(publicKey)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.detail || data.title || "Friendbot failed",
      };
    }
    return {
      success: true,
      message: "Account funded with 10,000 test XLM",
      txHash: data.hash,
    };
  } catch (err: any) {
    return { success: false, message: err.message || "Friendbot request failed" };
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

export async function buildPaymentTransaction({
  sourceSecret,
  destination,
  amount,
  memo,
}: {
  sourceSecret: string;
  destination: string;
  amount: string;
  memo?: string;
}) {
  const sourceKeypair = Keypair.fromSecret(sourceSecret);
  const sourcePublic = sourceKeypair.publicKey();

  if (!isValidPublicKey(destination)) {
    throw new Error("Invalid destination public key");
  }

  const account = await server.loadAccount(sourcePublic);

  let builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  }).addOperation(
    Operation.payment({
      destination,
      asset: Asset.native(),
      amount: amount.toString(),
    })
  );

  if (memo) {
    builder = builder.addMemo(
      // @ts-ignore
      require("@stellar/stellar-sdk").Memo.text(memo.slice(0, 28))
    );
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

export async function getPaymentHistory(publicKey: string, limit = 20) {
  try {
    const payments = await server
      .payments()
      .forAccount(publicKey)
      .order("desc")
      .limit(limit)
      .call();

    return payments.records.map((p: any) => ({
      id: p.id,
      type: p.type,
      from: p.from,
      to: p.to,
      amount: p.amount,
      asset: p.asset_type === "native" ? "XLM" : p.asset_code,
      createdAt: p.created_at,
      transactionHash: p.transaction_hash,
      successful: p.transaction_successful,
    }));
  } catch (err: any) {
    if (err.response?.status === 404) return [];
    throw err;
  }
}