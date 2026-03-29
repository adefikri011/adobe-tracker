"use client";
import { useState } from "react";
import { Download, Search } from "lucide-react";

const transactions = [
  { id: "TRX-001", user: "john@example.com", plan: "Pro - 30 Days", amount: 19.99, status: "Success",  date: "2025-03-28", method: "Midtrans" },
  { id: "TRX-002", user: "sarah@gmail.com",  plan: "Pro - 7 Days",  amount: 7.99,  status: "Success",  date: "2025-03-27", method: "Midtrans" },
  { id: "TRX-003", user: "mike@yahoo.com",   plan: "Pro - 1 Day",   amount: 1.99,  status: "Failed",   date: "2025-03-27", method: "Stripe"   },
  { id: "TRX-004", user: "anna@gmail.com",   plan: "Pro - 15 Days", amount: 12.99, status: "Success",  date: "2025-03-26", method: "Midtrans" },
  { id: "TRX-005", user: "bob@example.com",  plan: "Pro - 3 Days",  amount: 4.99,  status: "Pending",  date: "2025-03-26", method: "Stripe"   },
  { id: "TRX-006", user: "lisa@gmail.com",   plan: "Pro - 30 Days", amount: 19.99, status: "Success",  date: "2025-03-25", method: "Midtrans" },
  { id: "TRX-007", user: "tom@yahoo.com",    plan: "Pro - 7 Days",  amount: 7.99,  status: "Refunded", date: "2025-03-24", method: "Stripe"   },
];

const statusStyle: Record<string, string> = {
  Success:  "bg-green-50 text-green-600",
  Failed:   "bg-red-50 text-red-500",
  Pending:  "bg-yellow-50 text-yellow-600",
  Refunded: "bg-slate-100 text-slate-500",
};

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = transactions.filter(t => {
    const matchSearch = t.user.includes(search) || t.id.includes(search);
    const matchFilter = filter === "All" || t.status === filter;
    return matchSearch && matchFilter;
  });

  const total = transactions.filter(t => t.status === "Success").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">All billing history and payment records</p>
        </div>
        <button className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Revenue",    value: `$${total.toFixed(2)}`, color: "text-green-600"  },
          { label: "Successful",       value: transactions.filter(t => t.status === "Success").length,  color: "text-slate-900"  },
          { label: "Failed",           value: transactions.filter(t => t.status === "Failed").length,   color: "text-red-500"    },
          { label: "Pending",          value: transactions.filter(t => t.status === "Pending").length,  color: "text-yellow-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search user or ID..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Success", "Failed", "Pending", "Refunded"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === s ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-orange-300"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-orange-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Method</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{t.id}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{t.user}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{t.plan}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">${t.amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{t.method}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{t.date}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[t.status]}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}