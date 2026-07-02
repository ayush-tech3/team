import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { register } from "../lib/auth";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await register(email, password, name);
      setUser(user);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Link to="/" className="text-xl font-black text-primary font-headline">Ledge AI</Link>
        <h1 className="text-2xl font-bold font-headline text-primary mt-6 mb-2">Create account</h1>
        <p className="text-on-surface-variant text-sm mb-8">Start tracking markets with AI insights</p>

        {error && (
          <div className="mb-4 p-3 bg-error/10 text-error text-sm rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low rounded-lg border-0 focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low rounded-lg border-0 focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="w-full px-4 py-3 bg-surface-container-low rounded-lg border-0 focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 hero-gradient text-on-primary rounded-full font-bold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account? <Link to="/login" className="text-primary font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
