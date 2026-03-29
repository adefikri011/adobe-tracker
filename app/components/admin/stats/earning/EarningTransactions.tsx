"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Receipt, Download, ChevronUp, ChevronDown,
  CheckCircle2, Clock, XCircle,
} from "lucide-react";

type Status = "paid" | "pending" | "failed";

interface Transaction {
  id:       string;
  asset:    string;
  type:     string;
  amount:   number;
  date:     string;
  status:   Status;
}

const transactions: Transaction[] = [
  { id: "TXN-001", asset: "Modern Technology Background", type: "Photo",  amount: 12.50, date: "2025-07-14", status: "paid"    },
  { id: "TXN-002", asset: "Abstract Business Vector",     type: "Vector", amount: 8.00,  date: "2025-07-13", status: "paid"    },
  { id: "TXN-003", asset: "Nature Landscape Pack",        type: "Photo",  amount: 15.00, date: "2025-07-13", status: "pending" },
  { id: "TXN-004", asset: "Corporate Meeting Stock",      type: "Video",  amount: 24.00, date: "2025-07-12", status: "paid"    },
  { id: "TXN-005", asset: "Health & Wellness Icons",      type: "Vector", amount: 6.50,  date: "2025-07-11", status: "failed"  },
  { id: "TXN-006", asset: "Minimalist UI Kit",            type: "Vector", amount: 10.00, date: "2025-07-10", status: "paid"    },
  { id: "TXN-007", asset: "Aerial City Drone Shot",       type: "Photo",  amount: 18.00, date: "2025-07-09", status: "pending" },
];

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; bg: string; text: string }> = {
  paid:    { label: "Paid",    icon: CheckCircle2, bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-600" },
  pending: { label: "Pending", icon: Clock,        bg: "bg-amber-50 border-amber-100",     text: "text-amber-600"  },
  failed:  { label: "Failed",  icon: XCircle,      bg: "bg-red-50 border-red-100",         text: "text-red-500"    },
};

const TYPE_COLOR: Record<string, string> = {
  Photo:  "bg-blue-50 text-blue-500 border-blue-100",
  Vector: "bg-orange-50 text-orange-500 border-orange-100",
  Video:  "bg-emerald-50 text-emerald-500 border-emerald-100",
};

export default function EarningTransactions() {
  const [filter, setFilter]   = useState<Status | "all">("all");
  const [sortAmt, setSortAmt] = useState<"asc" | "desc">("desc");

  const filtered = transactions
    .filter((t) => filter === "all" || t.status === filter)
    .sort((a, b) => sortAmt === "desc" ? b.amount - a.amount : a.amount - b.amount);

  const handleDownload = () => {
    const csv = [
      ["ID", "Asset", "Type", "Amount", "Date", "Status"],
      ...filtered.map((t) => [t.id, t.asset, t.type, `$${t.amount}`, t.date, t.status]),
    ]
      .map((r) => r.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "earnings-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-50 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Receipt size={15} className="text-orange-400" />
          <h2 className="text-sm font-bold text-slate-800">Recent Transactions</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className="flex gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl">
            {(["all", "paid", "pending", "failed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === f
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Download CSV */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-orange-200 text-xs font-semibold text-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Download size={13} />
            Export CSV
          </motion.button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50">
              {["ID", "Asset", "Type", "Date", "Status"].map((h) => (
                <th key={h} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-3 pr-4">
                  {h}
                </th>
              ))}
              <th className="text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-3">
                <button
                  onClick={() => setSortAmt((s) => s === "desc" ? "asc" : "desc")}
                  className="flex items-center gap-0.5 ml-auto hover:text-orange-500 transition-colors"
                >
                  Amount
                  {sortAmt === "desc" ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const sc  = STATUS_CONFIG[t.status];
              const SIcon = sc.icon;
              return (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="border-b border-slate-50 hover:bg-orange-50/40 transition-colors group"
                >
                  <td className="py-3 pr-4 font-mono text-xs text-slate-400">{t.id}</td>
                  <td className="py-3 pr-4">
                    <span className="font-medium text-slate-700 text-sm">{t.asset}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLOR[t.type] ?? ""}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-400">{t.date}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.text}`}>
                      <SIcon size={11} />
                      {sc.label}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-slate-800">
                    ${t.amount.toFixed(2)}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">No transactions found.</p>
        )}
      </div>
    </div>
  );
}