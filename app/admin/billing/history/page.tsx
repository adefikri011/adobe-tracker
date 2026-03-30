"use client";

import React from "react";
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreHorizontal,
  Search
} from "lucide-react";

// DATA MOCKUP (Disesuaikan dengan gaya Plans & Pricing kamu)
const HISTORY_DATA = [
  { id: "1", user: "Ade Fikri", plan: "Pro - 7 Days", price: "$7.19", date: "30 Mar 2026", expiry: "06 Apr 2026", status: "Active", progress: 85 },
  { id: "2", user: "Masyari Studio", plan: "Pro - 30 Days", price: "$15.99", date: "01 Mar 2026", expiry: "31 Mar 2026", status: "Active", progress: 10 },
  { id: "3", user: "Klien SDN 1", plan: "Pro - 1 Day", price: "$1.99", date: "20 Mar 2026", expiry: "21 Mar 2026", status: "Expired", progress: 0 },
];

export default function BillingHistoryPage() {
  return (
    <div className="p-8 space-y-6 bg-[#f9fafb] min-h-screen">
      
      {/* HEADER SECTION - Ringan & Clean */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Billing History</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and manage all user subscription cycles.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari user..." 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-500 transition-all w-64"
          />
        </div>
      </div>

      {/* TABLE AREA */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
            {HISTORY_DATA.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                
                {/* MEMBER & PLAN */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.status === 'Active' ? 'bg-orange-50 text-orange-500' : 'bg-slate-100 text-slate-400'}`}>
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
                          item.status === 'Active' ? 'bg-orange-500' : 'bg-slate-300'
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
                      item.status === 'Active' 
                        ? 'bg-green-50 text-green-600 border border-green-100' 
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </td>

                {/* AMOUNT */}
                <td className="px-6 py-5 text-right">
                  <p className="text-sm font-bold text-slate-700">{item.price}</p>
                  <p className="text-[10px] text-slate-400 italic">Success</p>
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
          <p className="text-[11px] text-slate-400 font-medium tracking-wide">Showing 3 of 15 Transactions</p>
          <div className="flex gap-2">
             <button className="px-3 py-1 border border-slate-200 rounded text-[11px] font-bold text-slate-500 bg-white hover:bg-slate-50 disabled:opacity-50">Prev</button>
             <button className="px-3 py-1 border border-slate-200 rounded text-[11px] font-bold text-slate-500 bg-white hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}