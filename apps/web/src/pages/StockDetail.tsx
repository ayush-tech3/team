import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import type { DataSource, PriceBar, StockInsight, StockQuote } from "@ledge-ai/shared";
import { AppLayout, MarketingNav } from "../components/Layout";
import { LiveBadge } from "../components/LiveBadge";
import { PriceChart } from "../components/PriceChart";
import { useAuth } from "../context/AuthContext";
import { request } from "../lib/api";
import { changeColor, formatCurrency, formatPercent, signalColor, signalLabel } from "../lib/utils";

export function StockDetailPage() {
  const { user } = useAuth();
  const content = <StockDetailContent />;
  if (user) return <AppLayout>{content}</AppLayout>;
  return (
    <div>
      <MarketingNav />
      <main className="pt-24 max-w-7xl mx-auto px-8 pb-12">{content}</main>
    </div>
  );
}

function StockDetailContent() {
  const { user } = useAuth();
  const { symbol = "" } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["quote", symbol],
    queryFn: () =>
      request<{ quote: StockQuote; insight: StockInsight; live?: boolean; source?: DataSource }>(
        `/api/quote/${symbol}`
      ),
    enabled: !!symbol,
    refetchInterval: 30_000,
  });

  const { data: history } = useQuery({
    queryKey: ["history", symbol],
    queryFn: () =>
      request<{ bars: PriceBar[]; live?: boolean }>(`/api/quote/${symbol}/history?range=1mo`),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
  });

  const addWatchlist = useMutation({
    mutationFn: () =>
      request("/api/watchlist", {
        method: "POST",
        body: JSON.stringify({ symbol }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (isLoading) {
    return <p className="text-on-surface-variant">Loading live data for {symbol}...</p>;
  }

  if (error || !data?.quote?.price) {
    return (
      <>
        <p className="text-error">Failed to load stock data for {symbol}.</p>
        <Link to="/market" className="text-primary text-sm mt-2 inline-block">← Back to market</Link>
      </>
    );
  }

  const { quote, insight } = data;

  return (
    <>
      <Link to="/market" className="text-sm text-on-surface-variant hover:text-primary mb-6 inline-block">
        ← Back to market
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-headline font-extrabold text-primary">{quote.symbol}</h2>
          <p className="text-on-surface-variant">{quote.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveBadge live={data.live} source={data.source} />
          {dataUpdatedAt > 0 && (
            <span className="text-[10px] text-on-surface-variant">
              {new Date(dataUpdatedAt).toLocaleTimeString()}
            </span>
          )}
          {user ? (
            <button
              onClick={() => addWatchlist.mutate()}
              disabled={addWatchlist.isPending}
              className="px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-bold hover:opacity-90 disabled:opacity-50"
            >
              {addWatchlist.isSuccess ? "Added ✓" : addWatchlist.isPending ? "Adding..." : "+ Watchlist"}
            </button>
          ) : (
            <Link to="/login" className="px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-bold">
              Login to Watchlist
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-4 mb-8">
        <span className="text-5xl font-headline font-extrabold text-primary">
          {formatCurrency(quote.price)}
        </span>
        <span className={`text-lg font-bold ${changeColor(quote.changePercent)}`}>
          {formatPercent(quote.changePercent)} ({formatCurrency(quote.change)})
        </span>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl p-8 border border-outline-variant/10">
            <PriceChart bars={history?.bars ?? []} label="Price Chart (1 month · live)" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Open", quote.open],
              ["High", quote.high],
              ["Low", quote.low],
              ["Prev Close", quote.previousClose],
            ].map(([label, val]) => (
              <div key={label as string} className="bg-surface-container-low p-4 rounded-lg">
                <p className="text-[10px] uppercase text-on-surface-variant font-bold">{label as string}</p>
                <p className="font-bold text-primary mt-1">{formatCurrency(val as number)}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="glass-ai rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-tertiary">
              <span className="material-symbols-outlined filled">auto_awesome</span>
              <h3 className="font-headline font-bold">AI Signal Analysis</h3>
            </div>
            <p className={`text-sm font-bold uppercase mb-2 ${signalColor(insight.signal)}`}>
              {signalLabel(insight.signal)} · {insight.confidence}% confidence
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{insight.summary}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>RSI (14)</span>
                <span className="font-bold">{insight.indicators.rsi.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Buy Pressure</span>
                <span className="font-bold text-secondary">{insight.buyPressure}%</span>
              </div>
              {insight.targetPrice && (
                <div className="flex justify-between text-xs">
                  <span>Target</span>
                  <span className="font-bold">{formatCurrency(insight.targetPrice)}</span>
                </div>
              )}
              {insight.stopLoss && (
                <div className="flex justify-between text-xs">
                  <span>Stop Loss</span>
                  <span className="font-bold text-error">{formatCurrency(insight.stopLoss)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-primary text-on-primary rounded-xl p-6">
            <h4 className="text-[10px] uppercase tracking-widest opacity-60 mb-4">Fear & Greed (derived)</h4>
            <p className="text-4xl font-headline font-black">
              {Math.round(Math.min(100, Math.max(0, insight.indicators.rsi)))}
            </p>
            <p className="text-xs text-secondary-container mt-1 uppercase font-bold">
              {insight.indicators.rsi > 60 ? "Greed" : insight.indicators.rsi < 40 ? "Fear" : "Neutral"}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
