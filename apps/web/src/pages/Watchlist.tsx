import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { WatchlistItem } from "@ledge-ai/shared";
import { AppLayout } from "../components/Layout";
import { request } from "../lib/api";
import { changeColor, formatCurrency, formatPercent, signalColor, signalLabel } from "../lib/utils";

export function WatchlistPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => request<{ items: WatchlistItem[] }>("/api/watchlist"),
  });

  const remove = useMutation({
    mutationFn: (symbol: string) =>
      request(`/api/watchlist/${symbol}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const items = data?.items ?? [];

  return (
    <AppLayout>
      <header className="mb-10">
        <h2 className="text-4xl font-headline font-extrabold text-primary">Your Watchlist</h2>
        <p className="text-on-surface-variant text-sm mt-2">
          {items.length} symbol{items.length !== 1 ? "s" : ""} tracked
        </p>
      </header>

      {isLoading && <p className="text-on-surface-variant">Loading watchlist...</p>}

      {!isLoading && items.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border border-outline-variant/10">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">bookmark</span>
          <p className="text-on-surface-variant mb-4">No stocks in your watchlist yet.</p>
          <Link to="/market" className="text-primary font-bold text-sm hover:underline">
            Browse market →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-white p-5 rounded-xl border border-outline-variant/10"
          >
            <div className="flex-1">
              <Link to={`/market/${item.symbol}`} className="font-bold text-primary hover:underline">
                {item.symbol}
              </Link>
              {item.quote && (
                <p className="text-xs text-on-surface-variant mt-1">{item.quote.name}</p>
              )}
            </div>
            {item.quote && (
              <>
                <div className="text-right mx-6">
                  <p className="font-bold">{formatCurrency(item.quote.price)}</p>
                  <p className={`text-sm font-semibold ${changeColor(item.quote.changePercent)}`}>
                    {formatPercent(item.quote.changePercent)}
                  </p>
                </div>
                {item.insight && (
                  <span className={`text-[10px] font-bold uppercase mr-6 ${signalColor(item.insight.signal)}`}>
                    {signalLabel(item.insight.signal)}
                  </span>
                )}
              </>
            )}
            <button
              onClick={() => remove.mutate(item.symbol)}
              className="text-error text-sm hover:bg-error/5 px-3 py-1 rounded-lg"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
