"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreHorizontal,
  Search,
  Loader2
} from "lucide-react";

interface HistoryItem {
  id: string;
  user: string;
  plan: string;
  amount: number;
  date: string;
  expiry: string;
  status: "active" | "expired" | "cancelled";
  progress: number;
  isAdminGrant?: boolean;
}

interface CurrencySettings {
  currency: string;
  exchangeRate: number;
}

export default function BillingHistoryPage() {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState<string>("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(15800);

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

        // Fetch history
        const histRes = await fetch("/api/admin/billing/history");
        const histData = await histRes.json();
        if (histData.history) {
          setHistoryData(histData.history);
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

  const filteredData = historyData.filter(item =>
    item.user.toLowerCase().includes(search.toLowerCase()) ||
    item.plan.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 bg-[#f9fafb] min-h-screen">
      
      {/* HEADER SECTION - Clean & Minimal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Billing History</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Monitor and manage all user subscription cycles.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search user..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500 transition-all w-full sm:w-64"
          />
        </div>
      </div>

      {/* TABLE AREA */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Member</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Timeline</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Amount</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                
                {/* MEMBER & PLAN */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.status === 'active' ? 'bg-orange-50 text-orange-500' : 'bg-slate-100 text-slate-400'}`}>
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.user}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{item.plan}</p>
                    </div>
                  </div>
                </td>

                {/* TIMELINE PROGRESS - Dibuat tipis & rapi */}
                <td className="px-6 py-5">
                  <div className="w-56 space-y-1.5">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>{item.date}</span>
                      <span>{item.expiry}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          item.status === 'active' ? 'bg-orange-500' : 'bg-slate-300'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* STATUS BADGE - Kecil sesuai UI di foto */}
                <td className="px-6 py-5">
                  <div className="flex justify-center">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'active' 
                        ? 'bg-green-50 text-green-600 border border-green-100' 
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      {item.status === 'active' ? 'Active' : item.status === 'expired' ? 'Expired' : 'Cancelled'}
                    </span>
                  </div>
                </td>

                {/* AMOUNT */}
                <td className="px-6 py-5 text-right">
                  {item.isAdminGrant ? (
                    <>
                      <p className="text-sm font-bold text-emerald-600">Complimentary</p>
                      <p className="text-[10px] text-emerald-500 italic">Granted by Admin</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-700">{formatPrice(item.amount)}</p>
                      <p className="text-[10px] text-slate-400 italic">Success</p>
                    </>
                  )}
                </td>

                {/* ACTION */}
                <td className="px-6 py-5 text-right">
                  <button className="p-1 hover:bg-slate-100 rounded text-slate-400">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER - Pagination tipis */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <p className="text-[11px] text-slate-400 font-medium tracking-wide">Showing {filteredData.length} of {historyData.length} Subscriptions</p>
          <div className="flex gap-2">
             <button className="px-3 py-1 border border-slate-200 rounded text-[11px] font-bold text-slate-500 bg-white hover:bg-slate-50 disabled:opacity-50">Prev</button>
             <button className="px-3 py-1 border border-slate-200 rounded text-[11px] font-bold text-slate-500 bg-white hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}