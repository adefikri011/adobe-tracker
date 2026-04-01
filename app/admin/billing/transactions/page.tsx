"use client";
import { useState, useEffect } from "react";
import { Download, Search, Loader2 } from "lucide-react";

interface Transaction {
  id: string;
  orderId: string;
  user: string;
  plan: string;
  amount: number;
  status: string;
  date: string;
  method: string;
}

interface CurrencySettings {
  currency: string;
  exchangeRate: number;
}

const statusStyle: Record<string, string> = {
  success: "bg-green-50 text-green-600",
  failed: "bg-red-50 text-red-500",
  pending: "bg-yellow-50 text-yellow-600",
  refunded: "bg-slate-100 text-slate-500",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [currency, setCurrency] = useState<string>("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(15800);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch currency settings
        const currRes = await fetch("/api/settings/currency");
        const currData = await currRes.json();
        if (currData.success) {
          setCurrency(currData.data.currency);
          setExchangeRate(currData.data.exchangeRate);
        }

        // Fetch transactions
        const txnRes = await fetch("/api/admin/billing/transactions");
        const txnData = await txnRes.json();
        if (txnData.transactions) {
          setTransactions(txnData.transactions);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format harga sesuai currency
  const formatPrice = (amountUSD: number): string => {
    if (currency === "IDR") {
      const idrPrice = amountUSD * exchangeRate;
      return `Rp ${Math.round(idrPrice).toLocaleString("id-ID")}`;
    }
    return `$${amountUSD.toFixed(2)}`;
  };

  const filtered = transactions.filter((t) => {
    const matchSearch = t.user.includes(search) || t.orderId.includes(search);
    const matchFilter = filter === "All" || t.status.toLowerCase() === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  const total = transactions
    .filter((t) => t.status.toLowerCase() === "success")
    .reduce((s, t) => s + t.amount, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">All billing history and payment records</p>
        </div>
        <button className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: "Total Revenue",    value: formatPrice(total), color: "text-green-600"  },
          { label: "Successful",       value: transactions.filter(t => t.status.toLowerCase() === "success").length,  color: "text-slate-900"  },
          { label: "Failed",           value: transactions.filter(t => t.status.toLowerCase() === "failed").length,   color: "text-red-500"    },
          { label: "Pending",          value: transactions.filter(t => t.status.toLowerCase() === "pending").length,  color: "text-yellow-600" },
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
        <div className="flex gap-2 flex-wrap">
          {["All", "Success", "Failed", "Pending", "Refunded"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${filter === s ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-orange-300"}`}
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
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{t.orderId}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{t.user}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{t.plan}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatPrice(t.amount)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{t.method}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{t.date}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[t.status.toLowerCase()] || "bg-slate-100 text-slate-500"}`}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1).toLowerCase()}
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