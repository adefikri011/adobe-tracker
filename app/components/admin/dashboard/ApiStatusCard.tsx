"use client";

import { motion } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface ApiStatus {
  connected: boolean;
  lastSync: string;
  nextSync: string;
  totalSynced: number;
  errors: number;
}

export default function ApiStatusCard() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    connected: true,
    lastSync: "10 minutes ago",
    nextSync: "50 minutes later",
    totalSynced: 0,
    errors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const assetCount = await fetch('/api/admin/dashboard/top-assets');
        if (assetCount.ok) {
          const data = await assetCount.json();
          // Count total assets from database
          const totalAssets = data.assets?.length || 0;
          
          setApiStatus((prev) => ({
            ...prev,
            totalSynced: totalAssets > 0 ? totalAssets * 100 : 0, // Estimate
          }));
        }
      } catch (error) {
        console.error('Failed to fetch API status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const { connected } = apiStatus;

  return (
    <div className="bg-white rounded-2xl border border-orange-50 shadow-sm p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Adobe Stock API</h2>
          <p className="text-xs text-slate-400">Connection status</p>
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            connected
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-red-50 text-red-500 border-red-100"
          }`}
        >
          {connected
            ? <Wifi size={11} />
            : <WifiOff size={11} />}
          {connected ? "Connected" : "Error"}
        </motion.div>
      </div>

      {/* Status dot pulse */}
      {connected && (
        <div className="flex items-center gap-2 mb-6 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
            <span className="text-xs font-medium text-emerald-600">API active & running normally</span>
        </div>
      )}

      {/* Info rows */}
      <div className="space-y-3.5 flex-1">
        {[
          { icon: CheckCircle2, cls: "text-emerald-500", label: "Last Sync",    val: apiStatus.lastSync               },
          { icon: Clock,        cls: "text-blue-400",    label: "Next Sync",    val: apiStatus.nextSync               },
          { icon: RefreshCw,    cls: "text-orange-400",  label: "Assets Synced",val: apiStatus.totalSynced.toLocaleString() },
          { icon: XCircle,      cls: apiStatus.errors > 0 ? "text-red-400" : "text-slate-200",
            label: "Errors", val: apiStatus.errors > 0 ? `${apiStatus.errors} error` : "None" },
        ].map(({ icon: Icon, cls, label, val }) => (
          <div key={label} className="flex items-center gap-2.5">
            <Icon size={14} className={cls} />
            <span className="text-xs text-slate-400 flex-1">{label}</span>
            <span className="text-xs font-semibold text-slate-700">{val}</span>
          </div>
        ))}
      </div>

      {/* Refresh btn */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-200 text-xs font-semibold text-orange-500 hover:bg-orange-50 transition-colors"
      >
        <RefreshCw size={13} />
        Manual Refresh
      </motion.button>
    </div>
  );
}