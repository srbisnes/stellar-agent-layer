export const STELLAR_CONFIG = {
  network: process.env.STELLAR_NETWORK || "testnet",
  horizonUrl: process.env.HORIZON_URL || "https://horizon-testnet.stellar.org",
  friendbotUrl: process.env.FRIENDBOT_URL || "https://friendbot.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  baseFee: "100",
} as const;

export type NetworkType = "testnet" | "public" | "futurenet";