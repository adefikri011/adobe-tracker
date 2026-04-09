"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

export default function DeviceLimitPage() {
  const [globalMaxDevices, setGlobalMaxDevices] = useState(1);
  const [suspendDurationMinutes, setSuspendDurationMinutes] = useState(30);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [updatedCount, setUpdatedCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings/device", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error("Failed to load device settings");
        }

        const data = await res.json();
        console.log("[Admin] Loaded settings from API:", data);
        
        if (!isMounted) {
          return;
        }

        if (typeof data.globalMaxDevices === "number") {
          setGlobalMaxDevices(Math.max(1, Math.floor(data.globalMaxDevices)));
        }

        if (typeof data.suspendDurationMinutes === "number") {
          setSuspendDurationMinutes(Math.max(1, Math.floor(data.suspendDurationMinutes)));
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load settings. Please refresh.");
        }
      } finally {
        if (isMounted) {
          setLoaded(true);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setUpdatedCount(0);

    const payload = {
      globalMaxDevices: Math.max(1, Math.floor(globalMaxDevices)),
      suspendDurationMinutes: Math.max(1, Math.floor(suspendDurationMinutes)),
    };

    console.log("[Admin] Sending to API:", payload);

    try {
      const res = await fetch("/api/admin/settings/device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save device settings");
      }

      const data = await res.json();
      console.log("[Admin] Response from API:", data);
      setUpdatedCount(data.updatedProfileCount || 0);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("[Admin] Error:", err);
      setError(err.message || "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm flex items-center gap-3 text-slate-600">
          <Loader2 size={18} className="animate-spin" />
          Loading device settings...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Device Management</h1>
          <p className="text-slate-400 text-sm mt-1">Configure device limits and policies</p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Global Device Policy Card */}
        <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Global Device Policy</h3>
              <p className="text-xs text-slate-500 mt-1">For free users</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-3">Set max devices and suspend duration for all free plan users.</p>
          <div className="mt-4 text-xs font-semibold text-orange-600">← You're here</div>
        </div>

        {/* Per-Plan Device Limits Card */}
        <Link href="/admin/settings/plans-device-limits">
          <div className="bg-white border-2 border-slate-200 hover:border-blue-200 rounded-2xl p-5 shadow-sm cursor-pointer transition hover:bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Per-Plan Device Limits</h3>
                <p className="text-xs text-slate-500 mt-1">For paid users</p>
              </div>
              <ArrowRight size={18} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-600 mt-3">Set device limits for each subscription plan independently.</p>
            <div className="mt-4 text-xs font-semibold text-blue-600">Click to configure →</div>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200"></div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-700 font-semibold">Settings saved successfully!</p>
            {updatedCount > 0 && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Updated {updatedCount} user{updatedCount !== 1 ? 's' : ''} to new device limit
              </p>
            )}
          </div>
        </div>
      )}

      {/* Max Devices Card */}
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">Max Devices (Global)</h3>
          <p className="text-xs text-slate-400 mt-1">
            Global fallback device limit for free users without an active paid plan.
          </p>
          <p className="text-xs text-slate-500 mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2">
            💡 Paid subscribers will use their plan's device limit instead.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Current Setting</span>
            <span className="text-3xl font-bold text-orange-500">{globalMaxDevices}</span>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <input
              type="range"
              min="1"
              max="20"
              value={globalMaxDevices}
              onChange={e => setGlobalMaxDevices(parseInt(e.target.value, 10))}
              className="flex-1 accent-orange-500"
            />
            <div className="text-right">
              <p className="text-xs text-slate-500">Max</p>
              <p className="text-sm font-bold text-slate-700">20</p>
            </div>
          </div>

          <div className="flex gap-3 text-xs">
            {[1, 2, 3, 5, 10].map(num => (
              <button
                key={num}
                onClick={() => setGlobalMaxDevices(num)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  globalMaxDevices === num
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Suspend Duration Card */}
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">Suspend Duration</h3>
          <p className="text-xs text-slate-400 mt-1">
            How long to suspend user account when they exceed device limit
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Current Setting</span>
            <span className="text-3xl font-bold text-orange-500">{suspendDurationMinutes}</span>
            <span className="text-sm text-slate-500">minutes</span>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <input
              type="range"
              min="1"
              max="1440"
              step="5"
              value={suspendDurationMinutes}
              onChange={e => setSuspendDurationMinutes(parseInt(e.target.value, 10))}
              className="flex-1 accent-orange-500"
            />
            <div className="text-right">
              <p className="text-xs text-slate-500">Max</p>
              <p className="text-sm font-bold text-slate-700">24h</p>
            </div>
          </div>

          <div className="flex gap-3 text-xs flex-wrap">
            {[5, 15, 30, 60, 120, 240].map(num => (
              <button
                key={num}
                onClick={() => setSuspendDurationMinutes(num)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  suspendDurationMinutes === num
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {num}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition ${
          saving
            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
            : saved
            ? "bg-green-500 text-white"
            : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
        }`}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Saving...
          </span>
        ) : saved ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle size={16} />
            Saved!
          </span>
        ) : (
          "Save Global Settings"
        )}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-xs text-blue-700 font-medium">
          <strong>ℹ️ How it works:</strong> When a user tries to connect a new device beyond the limit, their account is automatically suspended for the duration set above. They regain access after the suspension period expires or an admin manually unlocks them.
        </p>
      </div>
    </div>
  );
}