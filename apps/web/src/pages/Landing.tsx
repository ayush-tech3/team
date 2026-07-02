import { Link } from "react-router-dom";
import { MarketingNav } from "../components/Layout";

export function LandingPage() {
  return (
    <div>
      <MarketingNav />
      <main className="pt-16">
        <section className="py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-xs font-bold uppercase mb-6">
                <span className="material-symbols-outlined text-sm filled">auto_awesome</span>
                Next Generation Ledger
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold font-headline text-primary tracking-tighter leading-tight mb-8">
                AI-powered financial assistant
              </h1>
              <p className="text-lg text-on-surface-variant max-w-xl mb-10 leading-relaxed">
                Track markets, get buy/sell insights, and manage your watchlist — powered by live data and an intelligent recommendation engine.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="px-8 py-4 hero-gradient text-on-primary rounded-full font-headline font-bold text-lg text-center shadow-lg hover:opacity-90">
                  Get Started
                </Link>
                <Link to="/market" className="px-8 py-4 border border-outline-variant/30 text-primary rounded-full font-headline font-bold text-lg text-center hover:bg-surface-container-low">
                  View Demo
                </Link>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-2xl border border-outline-variant/10">
              <div className="glass-ai p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-tertiary filled">lightbulb</span>
                  <div>
                    <p className="font-headline font-bold text-primary text-sm">AI Suggestion</p>
                    <p className="text-on-surface-variant text-xs mt-1">
                      NVDA shows bullish momentum with 94% confidence. Target $918 based on current trend analysis.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-surface p-4 rounded-lg">
                  <span className="text-2xl font-bold text-secondary font-headline">+3.4%</span>
                  <p className="text-xs text-on-surface-variant uppercase mt-1">Top Mover</p>
                </div>
                <div className="bg-surface p-4 rounded-lg">
                  <span className="text-2xl font-bold text-primary font-headline">Live</span>
                  <p className="text-xs text-on-surface-variant uppercase mt-1">Market Data</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <h2 className="text-4xl font-extrabold font-headline text-primary text-center mb-16">Built for modern investors</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: "monitoring", title: "Market Intelligence", desc: "Live quotes, sentiment analysis, and Fear & Greed indicators." },
                { icon: "auto_awesome", title: "AI Recommendations", desc: "Buy/sell signals with confidence scores and price targets." },
                { icon: "bookmark", title: "Personal Watchlist", desc: "Track your favorite stocks with real-time updates." },
              ].map((f) => (
                <div key={f.title} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <span className="material-symbols-outlined text-primary text-3xl mb-4">{f.icon}</span>
                  <h3 className="text-xl font-bold font-headline text-primary mb-2">{f.title}</h3>
                  <p className="text-on-surface-variant text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
