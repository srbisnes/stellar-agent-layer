import { NextRequest, NextResponse } from "next/server";
import {
  buildPaymentTransaction,
  submitTransaction,
  isValidPublicKey,
} from "@/lib/stellar/client";

/**
 * Server-side confirmation endpoint.
 * The secret key is sent only at the moment of human confirmation
 * and is never stored on the server.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secretKey, destination, amount, memo } = body;

    if (!secretKey || !destination || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isValidPublicKey(destination)) {
      return NextResponse.json(
        { success: false, error: "Invalid destination" },
        { status: 400 }
      );
    }

    const tx = await buildPaymentTransaction({
      sourceSecret: secretKey,
      destination,
      amount: String(amount),
      memo,
    });

    const result = await submitTransaction(tx);

    if (result.success) {
      return NextResponse.json({
        success: true,
        hash: result.hash,
        ledger: result.ledger,
        explorer: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Transaction failed" },
      { status: 500 }
    );
  }
}