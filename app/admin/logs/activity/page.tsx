"use client";
import { useState, useEffect } from "react";
import { Search, Download, Activity, X, Eye } from "lucide-react";

type ActivityLog = {
  id: string;
  user: string;
  email: string;
  action: string;
  detail: string;
  ipAddress: string | null;
  createdAt: string;
};

const actionColor: Record<string, string> = {
  "Updated Plan":     "bg-blue-50 text-blue-600",
  "Upgraded to Pro":  "bg-green-50 text-green-600",
  "Deleted User":     "bg-red-50 text-red-500",
  "Searched Keyword": "bg-slate-100 text-slate-500",
  "API Key Updated":  "bg-orange-50 text-orange-600",
  "Gateway Config":   "bg-purple-50 text-purple-600",
  "Manual Sync":      "bg-teal-50 text-teal-600",
  "Created User":     "bg-emerald-50 text-emerald-600",
  "Payment Successful": "bg-green-50 text-green-600",
  "Device Settings": "bg-indigo-50 text-indigo-600",
  "Updated User":     "bg-blue-50 text-blue-600",
};

export default function ActivityLogPage() {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Fetch activity logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const query = new URLSearchParams({
          search: search || "",
          limit: "100",
          offset: "0",
        });

        const response = await fetch(`/api/admin/logs/activity?${query}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch activity logs");
        }

        const result = await response.json();
        setLogs(result.data || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const filtered = logs.filter(l =>
    l.user.includes(search) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.detail.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const isAdmin = (user: string) => user.includes("(admin)");

  const getDisplayName = (user: string) => {
    return user.replace(" (admin)", "").trim();
  };

  const handleExport = async () => {
    try {
      // Create CSV content
      const headers = ["User", "Action", "Detail", "IP", "Time"];
      const rows = filtered.map(log => [
        log.user,
        log.action,
        log.detail,
        log.ipAddress || "N/A",
        formatTime(log.createdAt),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-log-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error exporting:", err);
      alert("Failed to export logs");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="text-slate-400 text-sm mt-1">All user and admin actions recorded</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <Download size={15} /> Export
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search user, action..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-orange-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">IP</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  <div className="flex justify-center items-center gap-2">
                    <div className="animate-spin">⟳</div>
                    <span>Loading activity logs...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-red-500">
                  Error: {error}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <Activity size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-slate-400">No activity found</p>
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3.5 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <span>{log.email}</span>
                      {isAdmin(log.user) && (
                        <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${actionColor[log.action] ?? "bg-slate-100 text-slate-500"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400">{log.ipAddress || "N/A"}</td>
                  <td className="px-6 py-3.5 text-xs text-slate-400">{formatTime(log.createdAt)}</td>
                  <td className="px-6 py-3.5">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <>
          {/* Backdrop blur */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedLog(null)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Activity Details</h2>
                  <p className="text-sm text-slate-400 mt-1">Full information about this activity</p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Email */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{selectedLog.email}</p>
                    {isAdmin(selectedLog.user) && (
                      <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Action</p>
                  <div>
                    <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${actionColor[selectedLog.action] ?? "bg-slate-100 text-slate-500"}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                </div>

                {/* Detail */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Detail</p>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 break-words">
                    {selectedLog.detail}
                  </div>
                </div>

                {/* IP Address */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">IP Address</p>
                    <p className="text-sm font-mono text-slate-600">{selectedLog.ipAddress || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Timestamp</p>
                    <p className="text-sm text-slate-600">{formatTime(selectedLog.createdAt)}</p>
                  </div>
                </div>

                {/* ID */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Activity ID</p>
                  <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                    <p className="text-xs font-mono text-slate-600 break-all">{selectedLog.id}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedLog.id);
                        alert("ID copied to clipboard");
                      }}
                      className="ml-2 px-2 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded transition whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}