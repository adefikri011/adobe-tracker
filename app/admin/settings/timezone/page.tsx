"use client";
import { useState, useEffect } from "react";
import { Check, Loader } from "lucide-react";
import { AVAILABLE_TIMEZONES } from "../../../../lib/geolocation";

export default function TimezoneSettingsPage() {
  const [selected, setSelected] = useState("Asia/Jakarta");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch timezone settings saat page load
  useEffect(() => {
    fetchTimezoneSettings();
  }, []);

  const fetchTimezoneSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/settings/timezone");

      if (!response.ok) {
        throw new Error("Failed to fetch timezone settings");
      }

      const data = await response.json();
      setSelected(data.data.timezone);
      setTimeFormat(data.data.timeFormat);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load timezone settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetect = async () => {
    try {
      setDetecting(true);
      setError("");
      
      // Detect timezone dari browser (Intl API)
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      if (browserTimezone) {
        setSelected(browserTimezone);
        setSuccess(`Auto-detected: ${browserTimezone}`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error("Could not detect timezone");
      }
    } catch (err) {
      console.error("Auto-detect error:", err);
      setError("Failed to auto-detect timezone");
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/settings/timezone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timezone: selected,
          timeFormat: timeFormat,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      const data = await response.json();
      setSaved(true);
      setSuccess("Settings saved successfully!");
      setTimeout(() => {
        setSaved(false);
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save timezone settings");
    } finally {
      setSaving(false);
    }
  };

  const now = new Date().toLocaleString("en-US", {
    timeZone: selected,
    hour12: timeFormat === "12h",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Timezone Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure your timezone & time format sesuai lokasi device Anda
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-5 text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-orange-500" size={32} />
          <span className="ml-3 text-slate-600">Loading your settings...</span>
        </div>
      ) : (
        <>
          {/* Current Time Preview */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-5">
            <p className="text-xs text-orange-600 font-medium mb-1">
              Current time in selected timezone
            </p>
            <p className="text-lg font-bold text-slate-900">{now}</p>
          </div>

          {/* Auto-Detect Button */}
          <div className="mb-5">
            <button
              onClick={handleAutoDetect}
              disabled={detecting}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition"
            >
              {detecting ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  🌍 Auto-detect dari Device
                </>
              )}
            </button>
            <p className="text-xs text-slate-500 mt-2">
              Deteksi timezone otomatis dari browser/lokasi device Anda
            </p>
          </div>

          {/* Timezone List */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-5">
            <h3 className="font-semibold text-slate-900 mb-4 text-sm">Select Timezone</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
              {AVAILABLE_TIMEZONES.map((tz) => (
                <button
                  key={tz.zone}
                  onClick={() => setSelected(tz.zone)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                    selected === tz.zone
                      ? "border-orange-400 bg-orange-50"
                      : "border-slate-100 hover:border-orange-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xl">{tz.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{tz.label}</p>
                    <p className="text-xs text-slate-400 truncate">{tz.zone}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                    {tz.offset}
                  </span>
                  {selected === tz.zone && (
                    <Check size={14} className="text-orange-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Time Format */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-5">
            <h3 className="font-semibold text-slate-900 mb-4 text-sm">Time Format</h3>
            <div className="flex gap-3">
              {[
                { value: "24h", label: "24 Hour", example: "14:30" },
                { value: "12h", label: "12 Hour", example: "2:30 PM" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setTimeFormat(f.value)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition ${
                    timeFormat === f.value
                      ? "border-orange-400 bg-orange-50 text-orange-600"
                      : "border-slate-200 text-slate-500 hover:border-orange-200"
                  }`}
                >
                  {f.label}
                  <span className="block text-xs font-normal mt-0.5 text-slate-400">
                    {f.example}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white disabled:bg-orange-300"
              }`}
            >
              {saving ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check size={14} />
                  Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}