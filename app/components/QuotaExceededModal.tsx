"use client";
import { X, Zap } from "lucide-react";
import Link from "next/link";

interface QuotaExceededModalProps {
  isOpen: boolean;
  searchesUsed: number;
  limit: number;
  resetInMinutes: number;
  onClose: () => void;
}

export default function QuotaExceededModal({
  isOpen,
  searchesUsed,
  limit,
  resetInMinutes,
  onClose,
}: QuotaExceededModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>

          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Zap size={32} className="text-white" fill="white" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-white">Daily Search Limit Reached</h2>
          <p className="text-white/80 text-sm mt-2">
            You've used all your searches for today
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Quota Status */}
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {searchesUsed}/{limit}
            </div>
            <div className="text-sm text-slate-600">searches used today</div>
          </div>

          {/* Reset Time */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
            <div className="text-sm font-semibold text-slate-900">
              ⏰ Reset in {resetInMinutes} minutes
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Come back after midnight to search again
            </div>
          </div>

          {/* Pro Plan Benefits */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Get Unlimited With Pro
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Unlimited searches daily
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Advanced analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Export data to CSV/Excel
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm"
          >
            Wait for Reset
          </button>
          <Link
            href="/dashboard/billing/plans"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Zap size={14} fill="currentColor" />
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
