"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { apiFetch, getStoredUser, getToken, Result } from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Result[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiFetch<{ results: Result[] }>("/api/admin/results");
      setRows(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin data unavailable");
    }
  }

  useEffect(() => {
    const user = getStoredUser();
    if (!getToken()) router.push("/login");
    else if (!user?.is_admin) setError("Admin access required");
    else load();
  }, [router]);

  return (
    <Shell>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="caption">Admin</p>
            <h2>Global submissions</h2>
          </div>
          <ShieldCheck color="var(--emerald)" />
        </div>
        {error && <p className="error">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Text</th><th>Sentiment</th><th>Confidence</th><th /></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.user}</td>
                  <td>{row.text}</td>
                  <td>{row.sentiment}</td>
                  <td>{row.confidence}%</td>
                  <td><button className="danger-button" onClick={async () => { await apiFetch(`/api/admin/results/${row.id}`, { method: "DELETE" }); await load(); }}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
