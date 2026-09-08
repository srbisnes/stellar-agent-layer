import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { publicKey } = await req.json();
    if (!publicKey) {
      return NextResponse.json({ success: false, error: "publicKey required" }, { status: 400 });
    }

    const url = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: data.detail || data.title || "Friendbot failed",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Account funded with 10,000 test XLM",
      txHash: data.hash,
      explorer: `https://stellar.expert/explorer/testnet/tx/${data.hash}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}