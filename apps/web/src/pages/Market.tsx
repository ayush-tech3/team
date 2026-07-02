import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { DataSource, StockInsight, StockQuote } from "@ledge-ai/shared";
import { AppLayout, MarketingNav } from "../components/Layout";
import { LiveBadge } from "../components/LiveBadge";
import { useAuth } from "../context/AuthContext";
import { request } from "../lib/api";
import { changeColor, formatCurrency, formatPercent, signalColor, signalLabel } from "../lib/utils";

function MarketContent() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["quotes"],
    queryFn: () => request<{ quotes: StockQuote[]; live?: boolean; source?: DataSource }>("/api/quotes"),
    refetchInterval: 30_000,
  });

  const quotes = data?.quotes ?? [];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-headline font-extrabold text-primary">Market Intelligence</h2>
          <p className="text-on-surface-variant text-sm mt-2">Live sentiment and high-momentum assets</p>
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

      {isLoading ? (
        <p className="text-on-surface-variant">Loading live market data...</p>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden border border-outline-variant/10">
          <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b">
            <div className="col-span-4">Asset</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">24h</div>
            <div className="col-span-2 text-center">Signal</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {quotes.map((q) => (
            <MarketRow key={q.symbol} quote={q} />
          ))}
        </div>
      )}
    </>
  );
}

function MarketRow({ quote: q }: { quote: StockQuote }) {
  const { data } = useQuery({
    queryKey: ["insight", q.symbol],
    queryFn: () => request<{ insight: StockInsight }>(`/api/insights/${q.symbol}`),
    staleTime: 60_000,
  });

  const insight = data?.insight;

  return (
    <div className="grid grid-cols-12 items-center px-6 py-4 border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors">
      <div className="col-span-4">
        <p className="font-bold text-primary">{q.symbol}</p>
        <p className="text-xs text-on-surface-variant">{q.name}</p>
      </div>
      <div className="col-span-2 text-right font-bold">{formatCurrency(q.price)}</div>
      <div className={`col-span-2 text-right font-bold ${changeColor(q.changePercent)}`}>
        {formatPercent(q.changePercent)}
      </div>
      <div className="col-span-2 text-center">
        {insight && (
          <span className={`text-[10px] font-bold uppercase ${signalColor(insight.signal)}`}>
            {signalLabel(insight.signal)}
          </span>
        )}
      </div>
      <div className="col-span-2 text-right">
        <Link to={`/market/${q.symbol}`} className="text-xs font-bold text-tertiary hover:underline">
          Analyze →
        </Link>
      </div>
    </div>
  );
}

export function MarketPage() {
  const { user } = useAuth();
  if (user) {
    return (
      <AppLayout>
        <MarketContent />
      </AppLayout>
    );
  }
  return (
    <div>
      <MarketingNav />
      <main className="pt-24 max-w-7xl mx-auto px-8 pb-12">
        <MarketContent />
      </main>
    </div>
  );
}
