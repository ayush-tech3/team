import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../db";
import { watchlist } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import {
  getQuote,
  getDefaultQuotes,
  getMultipleQuotes,
  searchSymbols,
  getMarketNews,
  generateInsight,
  getPriceHistory,
} from "../lib/market";
import type { Env } from "../types";

type AuthEnv = {
  Bindings: Env;
  Variables: { userId: string; email: string; name: string };
};

const market = new Hono<AuthEnv>();

market.get("/quotes", async (c) => {
  const symbols = c.req.query("symbols");
  const apiKey = c.env.FINNHUB_API_KEY;

  if (symbols) {
    const list = symbols.split(",").filter(Boolean);
    const { quotes, source } = await getMultipleQuotes(list, apiKey);
    return c.json({ quotes, source, live: source !== "mock" });
  }

  const { quotes, source } = await getDefaultQuotes(apiKey);
  return c.json({ quotes, source, live: source !== "mock" });
});

market.get("/quote/:symbol", async (c) => {
  const symbol = c.req.param("symbol");
  const apiKey = c.env.FINNHUB_API_KEY;
  const { quote, source } = await getQuote(symbol, apiKey);
  const insight = await generateInsight(quote, apiKey);
  return c.json({ quote, insight, source, live: source !== "mock" });
});

market.get("/quote/:symbol/history", async (c) => {
  const symbol = c.req.param("symbol");
  const range = (c.req.query("range") ?? "1mo") as "5d" | "1mo" | "3mo" | "6mo" | "1y";
  const { bars, source } = await getPriceHistory(symbol, range);
  return c.json({ bars, source, live: source !== "mock" });
});

market.get("/search", async (c) => {
  const q = c.req.query("q") ?? "";
  const results = await searchSymbols(q, c.env.FINNHUB_API_KEY);
  return c.json({ results });
});

market.get("/news", async (c) => {
  const symbol = c.req.query("symbol");
  const { news, source } = await getMarketNews(c.env.FINNHUB_API_KEY, symbol ?? undefined);
  return c.json({ news, source, live: source !== "mock" });
});

market.get("/insights/:symbol", async (c) => {
  const symbol = c.req.param("symbol");
  const apiKey = c.env.FINNHUB_API_KEY;
  const { quote } = await getQuote(symbol, apiKey);
  const insight = await generateInsight(quote, apiKey);
  return c.json({ insight });
});

market.get("/watchlist", authMiddleware, async (c) => {
  const db = createDb(c.env.DB);
  const userId = c.get("userId");
  const apiKey = c.env.FINNHUB_API_KEY;

  const items = await db.select().from(watchlist).where(eq(watchlist.userId, userId)).all();
  const symbols = items.map((i) => i.symbol);

  if (symbols.length === 0) {
    return c.json({ items: [], source: "yahoo", live: true });
  }

  const { quotes, source } = await getMultipleQuotes(symbols, apiKey);
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  const enriched = await Promise.all(
    items.map(async (item) => {
      const quote = quoteMap.get(item.symbol.toUpperCase());
      return {
        id: item.id,
        symbol: item.symbol,
        addedAt: new Date(item.createdAt).toISOString(),
        quote,
        insight: quote ? await generateInsight(quote, apiKey) : undefined,
      };
    })
  );

  return c.json({ items: enriched, source, live: source !== "mock" });
});

const addSchema = z.object({ symbol: z.string().min(1).max(10) });

market.post("/watchlist", authMiddleware, zValidator("json", addSchema), async (c) => {
  const { symbol } = c.req.valid("json");
  const sym = symbol.toUpperCase();
  const db = createDb(c.env.DB);
  const userId = c.get("userId");
  const apiKey = c.env.FINNHUB_API_KEY;

  const existing = await db
    .select()
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.symbol, sym)))
    .get();

  if (existing) {
    return c.json({ error: "Already in watchlist" }, 409);
  }

  const id = crypto.randomUUID();
  await db.insert(watchlist).values({
    id,
    userId,
    symbol: sym,
    createdAt: new Date(),
  });

  const { quote, source } = await getQuote(sym, apiKey);
  const insight = await generateInsight(quote, apiKey);

  return c.json({
    item: {
      id,
      symbol: sym,
      addedAt: new Date().toISOString(),
      quote,
      insight,
    },
    source,
    live: source !== "mock",
  });
});

market.delete("/watchlist/:symbol", authMiddleware, async (c) => {
  const symbol = c.req.param("symbol").toUpperCase();
  const db = createDb(c.env.DB);
  const userId = c.get("userId");

  await db
    .delete(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.symbol, symbol)));

  return c.json({ ok: true });
});

market.get("/dashboard", authMiddleware, async (c) => {
  const db = createDb(c.env.DB);
  const userId = c.get("userId");
  const apiKey = c.env.FINNHUB_API_KEY;

  const items = await db.select().from(watchlist).where(eq(watchlist.userId, userId)).all();
  const symbols = items.map((i) => i.symbol);

  const { quotes, source } = symbols.length
    ? await getMultipleQuotes(symbols, apiKey)
    : await getDefaultQuotes(apiKey);

  const insights = await Promise.all(quotes.map((q) => generateInsight(q, apiKey)));
  const bullishCount = insights.filter(
    (i) => i.signal === "buy" || i.signal === "strong_buy"
  ).length;
  const bearishCount = insights.filter(
    (i) => i.signal === "sell" || i.signal === "strong_sell"
  ).length;

  const topMover = [...quotes].sort(
    (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
  )[0] ?? null;

  const { news } = await getMarketNews(apiKey);

  return c.json({
    stats: {
      watchlistCount: items.length,
      bullishCount,
      bearishCount,
      topMover,
    },
    quotes: quotes.slice(0, 6),
    insights: insights.slice(0, 6),
    news: news.slice(0, 5),
    source,
    live: source !== "mock",
  });
});

market.get("/me", authMiddleware, async (c) => {
  return c.json({
    user: {
      id: c.get("userId"),
      email: c.get("email"),
      name: c.get("name"),
    },
  });
});

export default market;
