import type { StockInsight } from "@ledge-ai/shared";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function signalLabel(signal: StockInsight["signal"]) {
  return signal.replace("_", " ").toUpperCase();
}

export function signalColor(signal: StockInsight["signal"]) {
  switch (signal) {
    case "strong_buy":
    case "buy":
      return "text-secondary";
    case "sell":
    case "strong_sell":
      return "text-error";
    default:
      return "text-on-surface-variant";
  }
}

export function changeColor(value: number) {
  return value >= 0 ? "text-secondary" : "text-error";
}

export function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
