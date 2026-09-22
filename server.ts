import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Simple agent endpoint with local fallback (Gemini optional)
app.post("/api/agent", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "message required" });

    // If GEMINI_API_KEY is set, you can call Google GenAI here.
    // For now we return a neutral response so the client localAgent handles the logic.
    res.json({
      reply: null, // force client-side local engine
      source: "server-fallback",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, network: "testnet", version: "2.0.0" });
});

// Serve static in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist/client")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "dist/client/index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Stellar Agent Layer v2 listening on http://localhost:${PORT}`);
});
