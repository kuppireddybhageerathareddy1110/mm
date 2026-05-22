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
        body: JSON.stringify({ email, password })
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
        <div className="brand"><span className="brand-mark"><BrainCircuit size={20} /></span><span>Sentiment Studio</span></div>
        <div>
          <h1>Understand tone before it becomes a trend.</h1>
          <p>Analyze customer text, inspect model explanations, and review sentiment history from a focused AI operations console.</p>
        </div>
      </section>
      <section className="auth-panel">
        <h2>Sign in</h2>
        <p className="muted">Use your existing account to enter the workspace.</p>
        <form onSubmit={submit}>
          <label className="label">Email<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className="label">Password<input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <p className="error">{error}</p>}
          <button className="primary-button" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
        </form>
        <p className="muted">New here? <Link className="link" href="/register">Create an account</Link></p>
      </section>
    </div>
  );
}
