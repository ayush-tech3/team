export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
};

export type StockInsight = {
  symbol: string;
  signal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  confidence: number;
  summary: string;
  targetPrice: number | null;
  stopLoss: number | null;
  buyPressure: number;
  indicators: {
    rsi: number;
    trend: "bullish" | "bearish" | "neutral";
    momentum: "up" | "down" | "flat";
  };
};

export type MarketNews = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  category: string;
  sentiment: "positive" | "negative" | "neutral";
};

export type WatchlistItem = {
  id: string;
  symbol: string;
  addedAt: string;
  quote?: StockQuote;
  insight?: StockInsight;
};

export type DashboardStats = {
  watchlistCount: number;
  bullishCount: number;
  bearishCount: number;
  topMover: StockQuote | null;
};

export type PriceBar = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type DataSource = "yahoo" | "finnhub" | "mock";

export type LiveMeta = {
  live: boolean;
  source: DataSource;
};
