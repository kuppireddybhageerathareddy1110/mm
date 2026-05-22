"use client";
import { useEffect } from "react";
import { Shell } from "@/components/Shell";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Activity, Send, Wand2 } from "lucide-react";
import { apiFetch, getToken, Result } from "@/lib/api";

function sentimentClass(sentiment?: string) {
  return sentiment === "Negative" ? "sentiment-negative" : sentiment === "Neutral" ? "sentiment-neutral" : "sentiment-positive";
}


export default function AnalyzePage() {
  const router = useRouter();
  const [text, setText] = useState("The onboarding was smooth, the dashboard feels clear, and support solved my issue quickly.");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<Result>("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ text })
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const confidence = result?.confidence ?? 0;
  const meterPosition = `${(((result?.polarity ?? 0) + 1) / 2) * 100}%`;

  return (
    <Shell>
      <div className="workspace">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="caption">Analyze</p>
              <h2>Review text</h2>
            </div>
            <Wand2 color="var(--cyan)" />
          </div>
          <form onSubmit={submit}>
            <label className="label">
              Text sample
              <textarea className="textarea" value={text} onChange={(event) => setText(event.target.value)} />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="primary-button" disabled={loading || !text.trim()}>
              <Send size={18} />
              {loading ? "Analyzing..." : "Analyze sentiment"}
            </button>
          </form>
          {result?.lime_html && (
            <div style={{ marginTop: 20 }}>
              <div className="panel-header">
                <div>
                  <p className="caption">LIME</p>
                  <h3>Explanation</h3>
                </div>
              </div>
              <div className="lime-box" dangerouslySetInnerHTML={{ __html: result.lime_html }} />
            </div>
          )}
        </section>
        <aside className="panel result-stack">
          <div className="panel-header">
            <div>
              <p className="caption">Result</p>
              <h2 className={sentimentClass(result?.sentiment)}>{result?.sentiment ?? "Ready"}</h2>
            </div>
            <Activity color="var(--emerald)" />
          </div>
          <div className="confidence-ring" style={{ "--value": `${confidence}%` } as React.CSSProperties}>
            <div>
              <span style={{ fontSize: 30 }}>{confidence}%</span>
              <span className="muted" style={{ fontSize: 12 }}>confidence</span>
            </div>
          </div>
          <div>
            <p className="label">Polarity</p>
            <div className="meter" style={{ "--position": meterPosition } as React.CSSProperties}><span /></div>
            <p className="muted">{result ? `${result.polarity} on a -1 to 1 scale` : "Submit text to calculate polarity."}</p>
          </div>
          <div>
            <p className="label">Negative words</p>
            <div className="word-list">
              {result?.negative_words?.length ? result.negative_words.map((word) => <span key={word}>{word}</span>) : <span style={{ background: "var(--surface-2)", color: "var(--muted)" }}>None detected</span>}
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
