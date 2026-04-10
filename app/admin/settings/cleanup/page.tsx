"use client";

import { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, Settings, Trash2 } from "lucide-react";

interface CleanupSettings {
  cleanupFrequencyDays: number;
  keepPercentage: number;
  minDownloadThreshold: number;
  lastCleanupAt: string | null;
  nextCleanupAt: string | null;
  daysUntilNextCleanup: number;
}

export default function CleanupSettingsPage() {
  const [settings, setSettings] = useState<CleanupSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form fields
  const [frequencyDays, setFrequencyDays] = useState(7);
  const [keepPercentage, setKeepPercentage] = useState(70);
  const [minDownloads, setMinDownloads] = useState(5);

  // Fetch current settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings/cleanup");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      if (data.success) {
        const s = data.data;
        setSettings(s);
        setFrequencyDays(s.cleanupFrequencyDays);
        setKeepPercentage(s.keepPercentage);
        setMinDownloads(s.minDownloadThreshold);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings/cleanup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanupFrequencyDays: frequencyDays,
          keepPercentage: keepPercentage,
          minDownloadThreshold: minDownloads,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
        await fetchSettings();
      } else {
        setMessage({ type: "error", text: data.error || "Save failed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error saving settings" });
    } finally {
      setSaving(false);
    }
  };

  // Trigger manual cleanup
  const handleCleanupNow = async () => {
    if (!confirm("Run cleanup now? This will delete unpopular assets.")) return;

    try {
      setCleaning(true);
      const res = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });

      if (!res.ok) throw new Error("Cleanup failed");
      const data = await res.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: `Cleanup completed! Deleted ${data.data.deleted} assets`,
        });
        await fetchSettings();
      } else {
        setMessage({ type: "error", text: data.error || "Cleanup failed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error during cleanup" });
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cleanup Settings</h1>
          <p className="text-slate-500 mt-2">
            Configure automatic cleanup of unpopular assets to manage storage
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg flex gap-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-100"
                : "bg-red-50 border border-red-100"
            }`}
          >
            <AlertCircle
              size={20}
              className={message.type === "success" ? "text-green-600" : "text-red-600"}
            />
            <p
              className={
                message.type === "success" ? "text-green-700" : "text-red-700"
              }
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Settings Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          {/* Cleanup Frequency */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Cleanup Frequency
            </label>
            <p className="text-xs text-slate-500 mb-3">
              How often to automatically delete unpopular assets
            </p>
            <select
              value={frequencyDays}
              onChange={(e) => setFrequencyDays(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={1}>Every 1 day (Daily)</option>
              <option value={7}>Every 7 days (Weekly)</option>
              <option value={14}>Every 14 days (Biweekly)</option>
              <option value={30}>Every 30 days (Monthly)</option>
              <option value={60}>Every 60 days (Quarterly)</option>
            </select>
          </div>

          {/* Keep Percentage */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Keep Top {keepPercentage}% Popular Assets
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Delete bottom {100 - keepPercentage}% unpopular assets (by downloads)
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={keepPercentage}
                onChange={(e) => setKeepPercentage(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-2xl font-bold text-orange-500 min-w-12">
                {keepPercentage}%
              </span>
            </div>
            <div className="mt-2 flex gap-3">
              {[60, 70, 80, 90].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setKeepPercentage(pct)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    keepPercentage === pct
                      ? "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Min Download Threshold */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Minimum Download Threshold
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Keep assets with at least this many downloads (regardless of percentage)
            </p>
            <input
              type="number"
              min="0"
              max="100"
              value={minDownloads}
              onChange={(e) => setMinDownloads(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Assets with {minDownloads}+ downloads will be protected
            </p>
          </div>
        </div>

        {/* Schedule Info */}
        {settings && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Cleanup Schedule</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Last Cleanup</p>
                <p className="font-semibold text-slate-900">
                  {settings.lastCleanupAt
                    ? new Date(settings.lastCleanupAt).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Next Cleanup</p>
                <p className="font-semibold text-slate-900">
                  {settings.nextCleanupAt
                    ? new Date(settings.nextCleanupAt).toLocaleDateString()
                    : "Pending"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-600">Time Until Next Cleanup</p>
                <p className="font-semibold text-orange-600">
                  {settings.daysUntilNextCleanup} day{settings.daysUntilNextCleanup !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <RefreshCw size={16} className="animate-spin" />}
            Save Settings
          </button>
          <button
            onClick={handleCleanupNow}
            disabled={cleaning}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cleaning && <RefreshCw size={16} className="animate-spin" />}
            <Trash2 size={16} />
            Run Cleanup Now
          </button>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            <p className="font-semibold">⚠️ Cleanup will permanently delete assets</p>
            <p className="mt-1">
              Unpopular assets (low downloads) will be removed from database based on
              your settings. This action is irreversible!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
