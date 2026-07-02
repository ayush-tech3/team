import type { MarketNews, StockQuote } from "@ledge-ai/shared";

export type PriceBar = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        shortName?: string;
        longName?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketOpen?: number;
        regularMarketTime?: number;
        regularMarketChange?: number;
        regularMarketChangePercent?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error?: { description?: string };
  };
};

type YahooSearchResponse = {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    quoteType?: string;
  }>;
};

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; LedgeAI/1.0)",
  Accept: "application/json",
};

async function yahooFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: YAHOO_HEADERS });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getYahooQuote(symbol: string): Promise<StockQuote | null> {
  const sym = symbol.toUpperCase();
  const data = await yahooFetch<YahooChartResponse>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`
  );

  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta?.regularMarketPrice) return null;

  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
  const change = meta.regularMarketChange ?? meta.regularMarketPrice - previousClose;
  const changePercent =
    meta.regularMarketChangePercent ??
    (previousClose ? (change / previousClose) * 100 : 0);

  return {
    symbol: meta.symbol ?? sym,
    name: meta.longName ?? meta.shortName ?? sym,
    price: meta.regularMarketPrice,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    high: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
    low: meta.regularMarketDayLow ?? meta.regularMarketPrice,
    open: meta.regularMarketOpen ?? meta.regularMarketPrice,
    previousClose,
    timestamp: (meta.regularMarketTime ?? Date.now() / 1000) * 1000,
  };
}

export async function getYahooHistory(
  symbol: string,
  range: "5d" | "1mo" | "3mo" | "6mo" | "1y" = "1mo"
): Promise<PriceBar[]> {
  const sym = symbol.toUpperCase();
  const interval = range === "5d" ? "15m" : "1d";
  const data = await yahooFetch<YahooChartResponse>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=${interval}&range=${range}`
  );

  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const q = result?.indicators?.quote?.[0];
  if (!q?.close?.length) return [];

  const bars: PriceBar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = q.close[i];
    if (close == null) continue;
    bars.push({
      timestamp: timestamps[i] * 1000,
      open: q.open[i] ?? close,
      high: q.high[i] ?? close,
      low: q.low[i] ?? close,
      close,
      volume: q.volume[i] ?? 0,
    });
  }
  return bars;
}

export async function searchYahooSymbols(
  query: string
): Promise<{ symbol: string; name: string }[]> {
  if (query.length < 1) return [];

  const data = await yahooFetch<YahooSearchResponse>(
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`
  );

  return (data?.quotes ?? [])
    .filter((q) => q.symbol && (q.quoteType === "EQUITY" || q.quoteType === "ETF"))
    .slice(0, 10)
    .map((q) => ({
      symbol: q.symbol!,
      name: q.longname ?? q.shortname ?? q.symbol!,
    }));
}

export async function getYahooNews(symbol?: string): Promise<MarketNews[]> {
  const url = symbol
    ? `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol.toUpperCase())}&region=US&lang=en-US`
    : "https://finance.yahoo.com/news/rssindex";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseYahooRss(xml);
  } catch {
    return [];
  }
}

function parseYahooRss(xml: string): MarketNews[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return items.slice(0, 12).map((item, i) => {
    const title = extractTag(item, "title") ?? "Market update";
    const link = extractTag(item, "link") ?? "#";
    const pubDate = extractTag(item, "pubDate");
    const description = stripHtml(extractTag(item, "description") ?? "");
    const source = extractTag(item, "source") ?? "Yahoo Finance";

    return {
      id: `yahoo-${i}-${hash(title)}`,
      headline: decodeEntities(title),
      summary: decodeEntities(description).slice(0, 280),
      source,
      url: link,
      datetime: pubDate ? Date.parse(pubDate) : Date.now() - i * 3600_000,
      category: "markets",
      sentiment: inferSentiment(title + " " + description),
    };
  });
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? null;
}

function stripHtml(text: string) {
  return text.replace(/<[^>]+>/g, "").trim();
}

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h).toString(36);
}

function inferSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
  const positive = ["surge", "gain", "record", "bullish", "growth", "beat", "rise", "rally", "soar"];
  const negative = ["fall", "drop", "crash", "bearish", "miss", "decline", "plunge", "slump", "loss"];
  const pos = positive.filter((w) => lower.includes(w)).length;
  const neg = negative.filter((w) => lower.includes(w)).length;
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

export function computeRsiFromCloses(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}
