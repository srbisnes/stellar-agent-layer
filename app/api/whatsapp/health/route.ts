import { NextResponse } from "next/server";
import { isWhatsAppConfigured } from "@/lib/whatsapp/api";

export async function GET() {
  return NextResponse.json({
    service: "stellar-agent-whatsapp",
    configured: isWhatsAppConfigured(),
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? "set" : "missing",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ? "set" : "missing",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ? "set" : "missing",
  });
}
