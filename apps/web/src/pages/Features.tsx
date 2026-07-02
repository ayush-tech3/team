import { Link } from "react-router-dom";
import { MarketingNav } from "../components/Layout";

export function FeaturesPage() {
  const features = [
    { title: "Smart Expense Tracking", desc: "Automatic categorization with anomaly detection." },
    { title: "AI Budget Planner", desc: "Dynamic budgets that adapt to your spending patterns." },
    { title: "Market Intelligence", desc: "Live global market data tied to your portfolio exposure." },
    { title: "AI Financial Advisor", desc: "LLM-powered guidance on tax, growth, and allocation." },
    { title: "Predictive Spending", desc: "Forecast cash flow up to 12 months ahead." },
    { title: "Investment Engine", desc: "Buy/sell signals with confidence scores and targets." },
  ];

  return (
    <div>
      <MarketingNav />
      <main className="pt-32 pb-24 max-w-7xl mx-auto px-8">
        <h1 className="text-5xl font-headline font-extrabold text-primary mb-4">Powerful Features</h1>
        <p className="text-on-surface-variant max-w-2xl mb-16">
          Institutional-grade security meets AI-driven market intelligence.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold font-headline text-primary mb-2">{f.title}</h3>
              <p className="text-on-surface-variant text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Link to="/register" className="px-8 py-4 hero-gradient text-on-primary rounded-full font-bold inline-block">
            Start Free
          </Link>
        </div>
      </main>
    </div>
  );
}
