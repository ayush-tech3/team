import { Link } from "react-router-dom";
import { MarketingNav } from "../components/Layout";

const plans = [
  {
    name: "Free",
    price: "₹0",
    features: ["Basic tracking", "Limited market data", "Standard support"],
    cta: "Start for Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "₹199",
    features: ["Full sentiment analysis", "AI recommendations", "Advanced charting", "Custom alerts"],
    cta: "Get Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["Dedicated support", "API access", "Custom integrations", "SLA guarantee"],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingPage() {
  return (
    <div>
      <MarketingNav />
      <main className="pt-32 pb-24 max-w-7xl mx-auto px-8">
        <h1 className="text-5xl font-headline font-extrabold text-primary text-center mb-4">Flexible Pricing</h1>
        <p className="text-on-surface-variant text-center max-w-xl mx-auto mb-16">
          From baseline tracking to AI-optimized portfolio management.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-8 flex flex-col ${
                plan.popular
                  ? "bg-white ring-2 ring-primary shadow-2xl scale-105"
                  : "bg-surface-container-low"
              }`}
            >
              {plan.popular && (
                <span className="text-xs font-bold uppercase bg-primary text-on-primary px-3 py-1 rounded-full self-start mb-4">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold font-headline text-primary">{plan.name}</h3>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-4xl font-bold text-primary">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-on-surface-variant">/mo</span>}
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`w-full py-3 rounded-full font-bold text-center ${
                  plan.popular
                    ? "hero-gradient text-on-primary"
                    : "border border-outline-variant text-primary hover:bg-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
