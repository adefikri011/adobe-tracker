"use client";
import { useState } from "react";
import { Search, Download, ShieldCheck, ShieldX } from "lucide-react";

const loginLogs = [
  { id: 1,  user: "admin@trackstock.com", status: "Success", ip: "192.168.1.1",  device: "Chrome / Windows",  time: "2025-03-30 08:10:00" },
  { id: 2,  user: "john@example.com",     status: "Success", ip: "203.0.113.10", device: "Safari / iPhone",   time: "2025-03-30 07:54:00" },
  { id: 3,  user: "hacker@fake.com",      status: "Failed",  ip: "45.33.32.156", device: "Unknown",           time: "2025-03-30 07:30:00" },
  { id: 4,  user: "sarah@gmail.com",      status: "Success", ip: "198.51.100.5", device: "Chrome / MacOS",    time: "2025-03-30 07:00:00" },
  { id: 5,  user: "hacker@fake.com",      status: "Failed",  ip: "45.33.32.156", device: "Unknown",           time: "2025-03-30 06:58:00" },
  { id: 6,  user: "hacker@fake.com",      status: "Failed",  ip: "45.33.32.156", device: "Unknown",           time: "2025-03-30 06:57:00" },
  { id: 7,  user: "mike@yahoo.com",       status: "Success", ip: "203.0.113.55", device: "Firefox / Windows", time: "2025-03-29 22:00:00" },
  { id: 8,  user: "anna@gmail.com",       status: "Success", ip: "198.51.100.9", device: "Chrome / Android",  time: "2025-03-29 20:15:00" },
  { id: 9,  user: "unknown@spam.com",     status: "Failed",  ip: "198.20.69.74", device: "Unknown",           time: "2025-03-29 18:30:00" },
  { id: 10, user: "admin@trackstock.com", status: "Success", ip: "192.168.1.1",  device: "Chrome / Windows",  time: "2025-03-29 14:00:00" },
];

export default function LoginLogPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = loginLogs.filter(l => {
    const matchSearch = l.user.includes(search) || l.ip.includes(search);
    const matchFilter = filter === "All" || l.status === filter;
    return matchSearch && matchFilter;
  });

  const successCount = loginLogs.filter(l => l.status === "Success").length;
  const failedCount  = loginLogs.filter(l => l.status === "Failed").length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Login Log</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor all login attempts and suspicious activity</p>
        </div>
        <button className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition">
          <Download size={15} /> Export
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Attempts", value: loginLogs.length, color: "text-slate-900" },
          { label: "Successful",     value: successCount,     color: "text-green-600" },
          { label: "Failed",         value: failedCount,      color: "text-red-500"   },
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
            onChange={e => setSearch(e.target.value)}
            placeholder="Search user or IP..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Success", "Failed"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-orange-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-orange-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">IP Address</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Device</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-3.5 text-sm text-slate-700">{log.user}</td>
                <td className="px-6 py-3.5">
                  <span className={`flex items-center gap-1.5 w-fit text-xs font-medium px-2.5 py-1 rounded-full ${
                    log.status === "Success"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-500"
                  }`}>
                    {log.status === "Success"
                      ? <ShieldCheck size={11} />
                      : <ShieldX size={11} />
                    }
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 font-mono text-xs text-slate-400">{log.ip}</td>
                <td className="px-6 py-3.5 text-xs text-slate-500">{log.device}</td>
                <td className="px-6 py-3.5 text-xs text-slate-400">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <ShieldCheck size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No login records found</p>
          </div>
        )}
      </div>
    </div>
  );
}