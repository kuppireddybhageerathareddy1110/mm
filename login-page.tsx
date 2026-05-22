"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrainCircuit } from "lucide-react";
import { apiFetch, AuthResponse, storeAuth } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const auth = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      storeAuth(auth);
      router.push(auth.is_admin ? "/admin" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <div className="brand">
          <span className="brand-mark"><BrainCircuit size={18} /></span>
          <span>Sentiment Studio</span>
        </div>
        <div>
          <p className="auth-tagline">AI-Powered Sentiment Analysis</p>
          <h1>
            Understand <em>tone</em> before it becomes a trend.
          </h1>
          <p>
            Analyze customer text, inspect model explanations, and review
            sentiment history from a focused AI operations console.
          </p>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { num: "99.2%", label: "Accuracy" },
            { num: "<200ms", label: "Response time" },
            { num: "3 labels", label: "Classification" },
          ].map((stat) => (
            <div key={stat.label} style={{ display: "grid", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>
                {stat.num}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-panel">
        <h2>Sign in</h2>
        <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
          Use your existing account to enter the workspace.
        </p>
        <form onSubmit={submit}>
          <label className="label">
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </label>
          <label className="label">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary-button" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="muted" style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}>
          New here?{" "}
          <Link className="link" href="/register">
            Create an account
          </Link>
        </p>
      </section>
    </div>
  );
}
