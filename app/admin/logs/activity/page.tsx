"use client";
import { useState } from "react";
import { Search, Download, Activity } from "lucide-react";

const logs = [
  { id: 1, user: "admin@trackstock.com", action: "Updated Plan",        detail: "Changed Pro-30 price to $19.99",              ip: "192.168.1.1",  time: "2025-03-30 08:12:33" },
  { id: 2, user: "john@example.com",     action: "Upgraded to Pro",     detail: "Subscribed to Pro - 30 Days plan",            ip: "203.0.113.10", time: "2025-03-30 07:55:21" },
  { id: 3, user: "admin@trackstock.com", action: "Deleted User",        detail: "Removed user spam@fake.com",                  ip: "192.168.1.1",  time: "2025-03-30 07:30:10" },
  { id: 4, user: "sarah@gmail.com",      action: "Searched Keyword",    detail: "Searched for 'nature photography'",           ip: "198.51.100.5", time: "2025-03-30 07:10:44" },
  { id: 5, user: "admin@trackstock.com", action: "API Key Updated",     detail: "Adobe Stock API key was updated",             ip: "192.168.1.1",  time: "2025-03-29 22:45:00" },
  { id: 6, user: "mike@yahoo.com",       action: "Searched Keyword",    detail: "Searched for 'business meeting'",             ip: "203.0.113.55", time: "2025-03-29 20:30:15" },
  { id: 7, user: "admin@trackstock.com", action: "Gateway Config",      detail: "Midtrans mode changed to production",         ip: "192.168.1.1",  time: "2025-03-29 18:00:00" },
  { id: 8, user: "anna@gmail.com",       action: "Upgraded to Pro",     detail: "Subscribed to Pro - 15 Days plan",            ip: "198.51.100.9", time: "2025-03-29 15:22:11" },
  { id: 9, user: "admin@trackstock.com", action: "Manual Sync",         detail: "Triggered manual API sync — 756 assets",     ip: "192.168.1.1",  time: "2025-03-29 14:00:00" },
  { id: 10, user: "bob@example.com",     action: "Searched Keyword",    detail: "Searched for 'abstract vector'",              ip: "203.0.113.20", time: "2025-03-29 12:10:05" },
];

const actionColor: Record<string, string> = {
  "Updated Plan":     "bg-blue-50 text-blue-600",
  "Upgraded to Pro":  "bg-green-50 text-green-600",
  "Deleted User":     "bg-red-50 text-red-500",
  "Searched Keyword": "bg-slate-100 text-slate-500",
  "API Key Updated":  "bg-orange-50 text-orange-600",
  "Gateway Config":   "bg-purple-50 text-purple-600",
  "Manual Sync":      "bg-teal-50 text-teal-600",
};

export default function ActivityLogPage() {
  const [search, setSearch] = useState("");

  const filtered = logs.filter(l =>
    l.user.includes(search) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.detail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="text-slate-400 text-sm mt-1">All user and admin actions recorded</p>
        </div>
        <button className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition">
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
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Detail</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">IP</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-3.5 text-sm text-slate-700">{log.user}</td>
                <td className="px-6 py-3.5">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${actionColor[log.action] ?? "bg-slate-100 text-slate-500"}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-xs text-slate-500 max-w-xs truncate">{log.detail}</td>
                <td className="px-6 py-3.5 font-mono text-xs text-slate-400">{log.ip}</td>
                <td className="px-6 py-3.5 text-xs text-slate-400">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Activity size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No activity found</p>
          </div>
        )}
      </div>
    </div>
  );
}