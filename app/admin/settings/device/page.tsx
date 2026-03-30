"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function DeviceLimitPage() {
  const [maxDevices, setMaxDevices] = useState(2);
  const [suspendMinutes, setSuspendMinutes] = useState(5);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPolicy() {
      try {
        const res = await fetch("/api/admin/device-policy", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error("Failed to load device policy");
        }

        const data = await res.json();
        if (!isMounted) {
          return;
        }

        if (typeof data.maxDevices === "number") {
          setMaxDevices(Math.max(1, Math.floor(data.maxDevices)));
        }

        if (typeof data.suspendMinutes === "number") {
          setSuspendMinutes(Math.max(1, Math.floor(data.suspendMinutes)));
        }
      } catch {
        if (isMounted) {
          setError("Failed to load policy. Please refresh.");
        }
      } finally {
        if (isMounted) {
          setLoaded(true);
        }
      }
    }

    loadPolicy();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/device-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxDevices: Math.max(1, Math.floor(maxDevices)),
          suspendMinutes: Math.max(1, Math.floor(suspendMinutes)),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save device policy");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setError("Failed to save policy. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm flex items-center gap-3 text-slate-600">
          <Loader2 size={18} className="animate-spin" />
          Loading device policy...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Global Device Policy</h1>
        <p className="text-slate-400 text-sm mt-1">Set max devices and suspend duration for all users</p>
      </div>

      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-900 mb-1 text-sm">Max Devices (All Users)</h3>
        <p className="text-xs text-slate-400 mb-5">If a new device exceeds this limit, account will be suspended</p>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">1 device</span>
            <span className="text-2xl font-bold text-orange-500">{maxDevices} {maxDevices === 1 ? "device" : "devices"}</span>
            <span className="text-xs text-slate-500">20 devices</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={maxDevices}
            onChange={e => setMaxDevices(parseInt(e.target.value, 10))}
            className="w-full accent-orange-500"
          />
        </div>

        <div className="border-t border-slate-100 pt-4 mt-2">
          <h3 className="font-semibold text-slate-900 mb-1 text-sm">Suspend Duration</h3>
          <p className="text-xs text-slate-400 mb-3">Duration when user exceeds max devices</p>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={120}
              value={suspendMinutes}
              onChange={(e) => setSuspendMinutes(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
            <span className="text-sm text-slate-600">minutes</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Effective policy now: up to <span className="font-semibold text-slate-900">{maxDevices}</span> device(s), suspend for <span className="font-semibold text-slate-900">{suspendMinutes}</span> minute(s) when exceeded.
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
          saved ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}