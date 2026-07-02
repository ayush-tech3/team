import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import market from "./routes/market";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.get("/api/health", async (c) => {
  const finnhubKey = c.env.FINNHUB_API_KEY;
  const { quote, source } = await import("./lib/market").then((m) =>
    m.getQuote("AAPL", finnhubKey)
  );

  return c.json({
    status: "ok",
    service: "ledge-ai-api",
    timestamp: new Date().toISOString(),
    data: {
      live: source !== "mock" && quote.price > 0,
      source,
      finnhubConfigured: Boolean(finnhubKey),
      samplePrice: quote.price > 0 ? { symbol: quote.symbol, price: quote.price } : null,
    },
  });
});

app.route("/api/auth", auth);
app.route("/api", market);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
