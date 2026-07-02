import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function MarketingNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="flex justify-between items-center h-16 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold tracking-tighter text-primary font-headline">
            Ledge AI
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/features" className="text-sm font-semibold text-primary">Features</NavLink>
            <NavLink to="/pricing" className="text-sm font-semibold text-on-surface-variant hover:text-primary">Pricing</NavLink>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-primary hover:opacity-80">Login</Link>
          <Link to="/register" className="px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-white text-primary font-bold shadow-sm"
        : "text-on-surface-variant hover:bg-white/60"
    }`;

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-surface-container-low border-r border-outline-variant/20 z-40">
      <div className="p-6">
        <Link to="/" className="block">
          <h1 className="text-lg font-black text-primary font-headline tracking-tighter">Ledge AI</h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Premium Ledger</p>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        <NavLink to="/dashboard" className={linkClass}>
          <span className="material-symbols-outlined">dashboard</span>
          Dashboard
        </NavLink>
        <NavLink to="/market" className={linkClass}>
          <span className="material-symbols-outlined">monitoring</span>
          Market
        </NavLink>
        <NavLink to="/watchlist" className={linkClass}>
          <span className="material-symbols-outlined">bookmark</span>
          Watchlist
        </NavLink>
      </nav>
      <div className="p-4 border-t border-outline-variant/20">
        <p className="text-xs text-on-surface-variant mb-3 truncate">{user?.email}</p>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-error hover:bg-error/5 w-full px-3 py-2 rounded-lg"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppSidebar />
      <main className="ml-64 min-h-screen p-8 lg:p-12">{children}</main>
    </div>
  );
}
