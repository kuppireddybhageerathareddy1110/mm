"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Shell } from "@/components/Shell";
import { apiFetch, getToken, Result } from "@/lib/api";

const colors: Record<string, string> = {
  Positive: "#10b981",
  Negative: "#f9735b",
  Neutral: "#f59e0b"
};

export default function HistoryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Result[]>([]);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("recent");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await apiFetch<{ results: Result[] }>(`/api/history?limit=${limit}&sort_by=${sortBy}`);
      setRows(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load history");
    }
  }

  async function exportCsv() {
    const token = getToken();
    const response = await fetch("/api/export.csv", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) {
      setError("CSV export failed");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sentiment_history.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (!getToken()) router.push("/login");
    else load();
  }, [router, limit, sortBy]);

  const chartData = useMemo(() => {
    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.sentiment] = (acc[row.sentiment] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rows]);

  return (
    <Shell>
      <div className="history-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="caption">History</p>
              <h2>Previous analyses</h2>
            </div>
            <button className="secondary-button" onClick={load}><RefreshCw size={16} /> Refresh</button>
          </div>
          <div className="toolbar">
            <select className="select" value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>
            <select className="select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="recent">Recent</option>
              <option value="polarity">Highest polarity</option>
              <option value="sentiment">Sentiment</option>
            </select>
            <button className="secondary-button" onClick={exportCsv}><Download size={16} /> Export CSV</button>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Text</th><th>Sentiment</th><th>Polarity</th><th>Confidence</th><th /></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.text}</td>
                    <td>{row.sentiment}</td>
                    <td>{row.polarity}</td>
                    <td>{row.confidence}%</td>
                    <td><button className="danger-button" onClick={async () => { await apiFetch(`/api/history/${row.id}`, { method: "DELETE" }); await load(); }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="panel chart-card">
          <p className="caption">Distribution</p>
          <h3>Sentiment mix</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78}>
                {chartData.map((entry) => <Cell key={entry.name} fill={colors[entry.name]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </aside>
      </div>
    </Shell>
  );
}
