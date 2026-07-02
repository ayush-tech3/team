import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { DataSource, MarketNews, StockInsight, StockQuote } from "@ledge-ai/shared";
import { AppLayout } from "../components/Layout";
import { LiveBadge } from "../components/LiveBadge";
import { request } from "../lib/api";
import { changeColor, formatCurrency, formatPercent, signalColor, signalLabel, timeAgo } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

type DashboardData = {
  stats: {
    watchlistCount: number;
    bullishCount: number;
    bearishCount: number;
    topMover: StockQuote | null;
  };
  quotes: StockQuote[];
  insights: StockInsight[];
  news: MarketNews[];
  live?: boolean;
  source?: DataSource;
};

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => request<DashboardData>("/api/dashboard"),
    refetchInterval: 30_000,
  });

  return (
    <AppLayout>
      <header className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-headline font-extrabold text-primary">Executive Summary</h2>
          <p className="text-on-surface-variant text-xs tracking-widest mt-2 uppercase">
            Welcome back, {user?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveBadge live={data?.live} source={data?.source} />
          {dataUpdatedAt > 0 && (
            <span className="text-[10px] text-on-surface-variant">
              Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {isLoading && <p className="text-on-surface-variant">Loading dashboard...</p>}
      {error && <p className="text-error">Failed to load dashboard. Is the API running?</p>}

      {data && (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <StatCard label="Watchlist" value={String(data.stats.watchlistCount)} sub="Tracked symbols" />
            <StatCard label="Bullish Signals" value={String(data.stats.bullishCount)} sub="Buy recommendations" accent="secondary" />
            <StatCard label="Bearish Signals" value={String(data.stats.bearishCount)} sub="Sell / caution" accent="error" />
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <section className="lg:col-span-8 space-y-6">
              <h3 className="font-headline font-bold text-primary text-lg">Market Overview</h3>
              <div className="space-y-3">
                {data.quotes.map((q) => {
                  const insight = data.insights.find((i) => i.symbol === q.symbol);
                  return (
                    <Link
                      key={q.symbol}
                      to={`/market/${q.symbol}`}
                      className="flex items-center justify-between bg-white p-4 rounded-xl border border-outline-variant/10 hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="font-bold text-primary">{q.symbol}</p>
                        <p className="text-xs text-on-surface-variant">{q.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(q.price)}</p>
                        <p className={`text-sm font-semibold ${changeColor(q.changePercent)}`}>
                          {formatPercent(q.changePercent)}
                        </p>
                      </div>
                      {insight && (
                        <span className={`text-[10px] font-bold uppercase ${signalColor(insight.signal)}`}>
                          {signalLabel(insight.signal)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>

            <aside className="lg:col-span-4 space-y-6">
              <div className="glass-ai rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4 text-tertiary">
                  <span className="material-symbols-outlined filled">auto_awesome</span>
                  <h4 className="font-headline font-bold">AI Oracle</h4>
                </div>
                {data.insights[0] && (
                  <>
                    <p className="text-sm font-bold text-primary mb-2">
                      {data.insights[0].symbol} — {signalLabel(data.insights[0].signal)}
                    </p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{data.insights[0].summary}</p>
                    <p className="text-xs text-tertiary font-bold mt-3">Confidence: {data.insights[0].confidence}%</p>
                  </>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 border border-outline-variant/10">
                <h4 className="font-headline font-bold text-primary mb-4">News Brief</h4>
                <div className="space-y-4">
                  {data.news.map((n) => (
                    <a
                      key={n.id}
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block border-l-2 border-primary-container pl-3 hover:border-secondary transition-colors"
                    >
                      <p className="text-[10px] text-on-surface-variant">{timeAgo(n.datetime)} · {n.source}</p>
                      <p className="text-sm font-semibold text-primary mt-1">{n.headline}</p>
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "secondary" | "error";
}) {
  const color = accent === "secondary" ? "text-secondary" : accent === "error" ? "text-error" : "text-primary";
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm">
      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</span>
      <h3 className={`text-3xl font-headline font-bold mt-1 ${color}`}>{value}</h3>
      <p className="text-xs text-on-surface-variant mt-2">{sub}</p>
    </div>
  );
}
