import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function LoginPage() {
  const { login, authLoading, authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <span className="font-display text-lg font-bold text-canvas">P</span>
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">PulseChat</span>
        </div>

        <h1 className="font-display text-2xl font-semibold text-text">Welcome back</h1>
        <p className="mt-1 text-sm text-text-muted">Sign in to keep the conversation going.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-panel px-3.5 py-2.5 text-sm text-text outline-none transition focus:border-accent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-panel px-3.5 py-2.5 text-sm text-text outline-none transition focus:border-accent"
              placeholder="••••••••"
            />
          </div>

          {authError && (
            <p className="rounded-lg border border-accent-dim/40 bg-accent-dim/10 px-3 py-2 text-sm text-accent">
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-canvas transition hover:opacity-90 disabled:opacity-50"
          >
            {authLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          New here?{" "}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
