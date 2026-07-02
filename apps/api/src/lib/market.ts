import type { StockInsight, StockQuote, MarketNews } from "@ledge-ai/shared";
import {
  computeRsiFromCloses,
  getYahooHistory,
  getYahooNews,
  getYahooQuote,
  searchYahooSymbols,
  type PriceBar,
} from "./yahoo";

const DEFAULT_SYMBOLS = ["AAPL", "NVDA", "MSFT", "GOOGL", "TSLA", "AMZN"];

export type DataSource = "yahoo" | "finnhub" | "mock";

type FinnhubQuote = {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
};

type FinnhubProfile = { name?: string };
type FinnhubNews = {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  category: string;
};

async function finnhubFetch<T>(path: string, apiKey: string): Promise<T | null> {
  try {
    const res = await fetch(`https://finnhub.io/api/v1${path}&token=${apiKey}`);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function getFinnhubQuote(symbol: string, apiKey: string): Promise<StockQuote | null> {
  const sym = symbol.toUpperCase();
  const [quote, profile] = await Promise.all([
    finnhubFetch<FinnhubQuote>(`/quote?symbol=${sym}`, apiKey),
    finnhubFetch<FinnhubProfile>(`/stock/profile2?symbol=${sym}`, apiKey),
  ]);

  if (!quote?.c || quote.c <= 0) return null;

  return {
    symbol: sym,
    name: profile?.name ?? sym,
    price: quote.c,
    change: quote.d ?? 0,
    changePercent: quote.dp ?? 0,
    high: quote.h ?? quote.c,
    low: quote.l ?? quote.c,
    open: quote.o ?? quote.c,
    previousClose: quote.pc ?? quote.c,
    timestamp: (quote.t ?? Date.now() / 1000) * 1000,
  };
}

export async function getQuote(
  symbol: string,
  finnhubKey?: string
): Promise<{ quote: StockQuote; source: DataSource }> {
  const sym = symbol.toUpperCase();

  if (finnhubKey) {
    const finnhub = await getFinnhubQuote(sym, finnhubKey);
    if (finnhub) return { quote: finnhub, source: "finnhub" };
  }

  const yahoo = await getYahooQuote(sym);
  if (yahoo) return { quote: yahoo, source: "yahoo" };

  return {
    quote: {
      symbol: sym,
      name: sym,
      price: 0,
      change: 0,
      changePercent: 0,
      high: 0,
      low: 0,
      open: 0,
      previousClose: 0,
      timestamp: Date.now(),
    },
    source: "mock",
  };
}

export async function getMultipleQuotes(
  symbols: string[],
  finnhubKey?: string
): Promise<{ quotes: StockQuote[]; source: DataSource }> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const results = await Promise.all(unique.map((s) => getQuote(s, finnhubKey)));

  const sources = results.map((r) => r.source);
  const source: DataSource = sources.includes("finnhub")
    ? "finnhub"
    : sources.includes("yahoo")
      ? "yahoo"
      : "mock";

  return {
    quotes: results.map((r) => r.quote).filter((q) => q.price > 0),
    source,
  };
}

export async function getDefaultQuotes(finnhubKey?: string) {
  return getMultipleQuotes(DEFAULT_SYMBOLS, finnhubKey);
}

export async function searchSymbols(query: string, finnhubKey?: string) {
  if (finnhubKey && query.length >= 1) {
    type SearchResult = { result?: { symbol: string; description: string }[] };
    const data = await finnhubFetch<SearchResult>(
      `/search?q=${encodeURIComponent(query)}`,
      finnhubKey
    );
    if (data?.result?.length) {
      return data.result.slice(0, 10).map((r) => ({
        symbol: r.symbol,
        name: r.description,
      }));
    }
  }

  return searchYahooSymbols(query);
}

export async function getMarketNews(finnhubKey?: string, symbol?: string): Promise<{
  news: MarketNews[];
  source: DataSource;
}> {
  if (finnhubKey) {
    const path = symbol
      ? `/company-news?symbol=${symbol.toUpperCase()}&from=${daysAgo(7)}&to=${today()}`
      : `/news?category=general`;
    const data = await finnhubFetch<FinnhubNews[]>(path, finnhubKey);
    if (data?.length) {
      return {
        news: data.slice(0, 12).map((n) => ({
          id: String(n.id),
          headline: n.headline,
          summary: n.summary,
          source: n.source,
          url: n.url,
          datetime: n.datetime * 1000,
          category: n.category,
          sentiment: inferSentiment(n.headline + " " + n.summary),
        })),
        source: "finnhub",
      };
    }
  }

  const yahooNews = await getYahooNews(symbol);
  if (yahooNews.length) return { news: yahooNews, source: "yahoo" };

  // Merge headlines from top symbols if general feed unavailable
  if (!symbol) {
    const merged = (
      await Promise.all(["AAPL", "NVDA", "MSFT"].map((s) => getYahooNews(s)))
    ).flat();
    const unique = [...new Map(merged.map((n) => [n.headline, n])).values()].slice(0, 12);
    if (unique.length) return { news: unique, source: "yahoo" };
  }

  return { news: [], source: "mock" };
}

export async function getPriceHistory(
  symbol: string,
  range: "5d" | "1mo" | "3mo" | "6mo" | "1y" = "1mo"
): Promise<{ bars: PriceBar[]; source: DataSource }> {
  const bars = await getYahooHistory(symbol, range);
  return { bars, source: bars.length ? "yahoo" : "mock" };
}

export async function generateInsight(
  quote: StockQuote,
  finnhubKey?: string
): Promise<StockInsight> {
  const { bars } = await getPriceHistory(quote.symbol, "3mo");
  const closes = bars.map((b) => b.close);
  const realRsi = computeRsiFromCloses(closes);
  const rsi = realRsi ?? estimateRsi(quote.changePercent);

  const trend =
    rsi > 60 && quote.changePercent > 0
      ? "bullish"
      : rsi < 40 && quote.changePercent < 0
        ? "bearish"
        : quote.changePercent > 1
          ? "bullish"
          : quote.changePercent < -1
            ? "bearish"
            : "neutral";

  const momentum =
    quote.changePercent > 0.5 ? "up" : quote.changePercent < -0.5 ? "down" : "flat";

  let signal: StockInsight["signal"] = "neutral";
  let confidence = 55;

  if (quote.changePercent > 2 && rsi < 70 && rsi > 40) {
    signal = "strong_buy";
    confidence = 88;
  } else if (quote.changePercent > 0.5 && rsi < 75) {
    signal = "buy";
    confidence = 72;
  } else if (rsi > 75) {
    signal = "sell";
    confidence = 78;
  } else if (quote.changePercent < -2) {
    signal = "sell";
    confidence = 75;
  } else if (quote.changePercent < -0.5) {
    signal = "neutral";
    confidence = 60;
  }

  const buyPressure = Math.min(95, Math.max(5, Math.round(50 + (rsi - 50) * 0.6 + quote.changePercent * 4)));

  const targetPrice =
    signal === "strong_buy" || signal === "buy"
      ? Math.round(quote.price * (1 + (100 - rsi) / 500) * 100) / 100
      : signal === "sell" || signal === "strong_sell"
        ? Math.round(quote.price * 0.96 * 100) / 100
        : null;

  const stopLoss =
    signal === "strong_buy" || signal === "buy"
      ? Math.round(quote.price * 0.93 * 100) / 100
      : null;

  const rsiNote = realRsi != null ? `RSI(14) at ${rsi.toFixed(1)}` : `estimated RSI ${rsi.toFixed(1)}`;

  return {
    symbol: quote.symbol,
    signal,
    confidence,
    summary: `${quote.name} shows ${trend} momentum (${momentum}). ${rsiNote}, 24h change ${formatPct(quote.changePercent)}. Engine suggests ${signal.replace("_", " ")}.${realRsi != null ? " Analysis uses live 3-month price history." : ""}`,
    targetPrice,
    stopLoss,
    buyPressure,
    indicators: { rsi, trend, momentum },
  };
}

function estimateRsi(changePercent: number) {
  return Math.min(85, Math.max(15, 50 + changePercent * 5));
}

function formatPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function inferSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
  const positive = ["surge", "gain", "record", "bullish", "growth", "beat", "rise", "rally"];
  const negative = ["fall", "drop", "crash", "bearish", "miss", "decline", "plunge"];
  const pos = positive.filter((w) => lower.includes(w)).length;
  const neg = negative.filter((w) => lower.includes(w)).length;
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export { DEFAULT_SYMBOLS };
