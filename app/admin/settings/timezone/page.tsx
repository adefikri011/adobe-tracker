"use client";
import { useState } from "react";
import { Check } from "lucide-react";

const timezones = [
  { zone: "Asia/Jakarta",    label: "Jakarta",       offset: "UTC+7",  flag: "🇮🇩" },
  { zone: "Asia/Singapore",  label: "Singapore",     offset: "UTC+8",  flag: "🇸🇬" },
  { zone: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", offset: "UTC+8", flag: "🇲🇾" },
  { zone: "Asia/Tokyo",      label: "Tokyo",         offset: "UTC+9",  flag: "🇯🇵" },
  { zone: "America/New_York",label: "New York",      offset: "UTC-5",  flag: "🇺🇸" },
  { zone: "America/Los_Angeles", label: "Los Angeles", offset: "UTC-8", flag: "🇺🇸" },
  { zone: "Europe/London",   label: "London",        offset: "UTC+0",  flag: "🇬🇧" },
  { zone: "Europe/Paris",    label: "Paris",         offset: "UTC+1",  flag: "🇫🇷" },
];

export default function TimezoneSettingsPage() {
  const [selected, setSelected] = useState("Asia/Jakarta");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [saved, setSaved] = useState(false);

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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Timezone Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure platform timezone and time format</p>
      </div>

      {/* Current Time Preview */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-5">
        <p className="text-xs text-orange-600 font-medium mb-1">Current time in selected timezone</p>
        <p className="text-lg font-bold text-slate-900">{now}</p>
      </div>

      {/* Timezone List */}
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-900 mb-4 text-sm">Select Timezone</h3>
        <div className="space-y-2">
          {timezones.map((tz) => (
            <button
              key={tz.zone}
              onClick={() => setSelected(tz.zone)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                selected === tz.zone
                  ? "border-orange-400 bg-orange-50"
                  : "border-slate-100 hover:border-orange-200 hover:bg-slate-50"
              }`}
            >
              <span className="text-xl">{tz.flag}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{tz.label}</p>
                <p className="text-xs text-slate-400">{tz.zone}</p>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                {tz.offset}
              </span>
              {selected === tz.zone && (
                <Check size={14} className="text-orange-500" />
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
              <span className="block text-xs font-normal mt-0.5 text-slate-400">{f.example}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
          saved ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}
      >
        {saved ? "✓ Saved!" : "Save Changes"}
      </button>
    </div>
  );
}