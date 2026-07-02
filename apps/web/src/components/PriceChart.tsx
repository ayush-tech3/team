import type { PriceBar } from "@ledge-ai/shared";

export function PriceChart({ bars, label }: { bars: PriceBar[]; label: string }) {
  if (!bars.length) {
    return (
      <div className="h-48 flex items-center justify-center text-on-surface-variant text-sm">
        No chart data available
      </div>
    );
  }

  const closes = bars.map((b) => b.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const up = closes[closes.length - 1] >= closes[0];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-headline font-bold text-primary">{label}</h3>
        <span className={`text-xs font-bold ${up ? "text-secondary" : "text-error"}`}>
          {bars.length} data points
        </span>
      </div>
      <div className="h-52 flex items-end gap-px">
        {bars.map((bar) => {
          const h = ((bar.close - min) / range) * 100;
          const isUp = bar.close >= bar.open;
          return (
            <div
              key={bar.timestamp}
              title={`${new Date(bar.timestamp).toLocaleDateString()}: $${bar.close.toFixed(2)}`}
              className={`flex-1 min-w-0 rounded-t transition-colors cursor-crosshair ${
                isUp ? "bg-secondary/70 hover:bg-secondary" : "bg-error/50 hover:bg-error/70"
              }`}
              style={{ height: `${Math.max(4, h)}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant font-medium">
        <span>{new Date(bars[0].timestamp).toLocaleDateString()}</span>
        <span>Low {min.toFixed(2)} · High {max.toFixed(2)}</span>
        <span>{new Date(bars[bars.length - 1].timestamp).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
