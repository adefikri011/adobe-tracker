"use client";
import { useState, useEffect } from "react";
import { Search, Download, ShieldCheck, ShieldX } from "lucide-react";

interface LoginLog {
  id: string;
  email: string;
  fullName: string;
  status: string;
  ipAddress: string | null;
  device: string | null;
  loginTime: string;
}

interface ApiResponse {
  logs: LoginLog[];
  stats: {
    totalAttempts: number;
    successCount: number;
    failedCount: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function LoginLogPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [stats, setStats] = useState({ totalAttempts: 0, successCount: 0, failedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLoginLogs();
  }, [page]);

  const fetchLoginLogs = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      
      if (search) {
        params.append('email', search);
      }
      
      if (filter !== 'All') {
        params.append('status', filter.toLowerCase());
      }
      
      const response = await fetch(`/api/admin/logs/login?${params}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch login logs");
      }

      const data: ApiResponse = await response.json();
      setLoginLogs(data.logs || []);
      setStats(data.stats);
    } catch (err) {
      setError("Error loading login logs");
      console.error("Error fetching login logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Login Log</h1>
            <p className="text-slate-400 text-sm mt-1">Monitor all login attempts and suspicious activity</p>
          </div>
        </div>
        <div className="bg-white border border-orange-100 rounded-2xl shadow-sm p-8 text-center">
          <p className="text-slate-400">Loading login logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Login Log</h1>
            <p className="text-slate-400 text-sm mt-1">Monitor all login attempts and suspicious activity</p>
          </div>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-8 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchLoginLogs}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Login Log</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor all login attempts and suspicious activity</p>
        </div>
        <button 
          onClick={() => {
            const csv = [
              ["Email", "Full Name", "Status", "IP Address", "Device", "Time"],
              ...loginLogs.map(l => [
                l.email,
                l.fullName,
                l.status,
                l.ipAddress || '-',
                l.device || '-',
                new Date(l.loginTime).toLocaleString()
              ])
            ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
            
            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "login-logs.csv";
            a.click();
          }}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <Download size={15} /> Export
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Attempts", value: stats.totalAttempts, color: "text-slate-900" },
          { label: "Successful",     value: stats.successCount,     color: "text-green-600" },
          { label: "Failed",         value: stats.failedCount,      color: "text-red-500"   },
        ].map(s => (
          <div key={s.label} className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search email or IP..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
          />
        </div>
        <div className="flex gap-2">
          {["All", "success", "failed"].map(f => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-orange-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-orange-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">IP Address</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Device</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loginLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-3.5 text-sm text-slate-700 font-mono">{log.email}</td>
                <td className="px-6 py-3.5 text-sm text-slate-600">{log.fullName || '-'}</td>
                <td className="px-6 py-3.5">
                  <span className={`flex items-center gap-1.5 w-fit text-xs font-medium px-2.5 py-1 rounded-full ${
                    log.status === "success"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-500"
                  }`}>
                    {log.status === "success"
                      ? <ShieldCheck size={11} />
                      : <ShieldX size={11} />
                    }
                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-3.5 font-mono text-xs text-slate-400">{log.ipAddress || '-'}</td>
                <td className="px-6 py-3.5 text-xs text-slate-500">{log.device || '-'}</td>
                <td className="px-6 py-3.5 text-xs text-slate-400">
                  {new Date(log.loginTime).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loginLogs.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <ShieldCheck size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No login records found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {stats.totalAttempts > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {loginLogs.length} of {stats.totalAttempts} records
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs text-slate-600">Page {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={loginLogs.length < 50}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}