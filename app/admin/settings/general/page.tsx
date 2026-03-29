"use client";
import { useState } from "react";

export default function GeneralSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    siteName: "TrackStock",
    siteUrl: "https://trackstock.com",
    adminEmail: "admin@trackstock.com",
    supportEmail: "support@trackstock.com",
    maxFreeSearches: "5",
    maintenanceMode: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">General Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Basic platform configuration</p>
      </div>

      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm space-y-5">

        {/* Site Name */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Site Name</label>
          <input
            value={form.siteName}
            onChange={e => setForm({ ...form, siteName: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>

        {/* Site URL */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Site URL</label>
          <input
            value={form.siteUrl}
            onChange={e => setForm({ ...form, siteUrl: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>

        {/* Admin Email */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Admin Email</label>
          <input
            type="email"
            value={form.adminEmail}
            onChange={e => setForm({ ...form, adminEmail: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>

        {/* Support Email */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Support Email</label>
          <input
            type="email"
            value={form.supportEmail}
            onChange={e => setForm({ ...form, supportEmail: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>

        {/* Free Search Limit */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Free User Search Limit <span className="text-slate-400 font-normal">(per day)</span>
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={form.maxFreeSearches}
            onChange={e => setForm({ ...form, maxFreeSearches: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
          />
          <p className="text-xs text-slate-400 mt-1">Free users can only search this many times per day</p>
        </div>

        {/* Maintenance Mode */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">Maintenance Mode</p>
            <p className="text-xs text-slate-400">Disable public access temporarily</p>
          </div>
          <button
            onClick={() => setForm({ ...form, maintenanceMode: !form.maintenanceMode })}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              form.maintenanceMode ? "bg-red-500" : "bg-slate-200"
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              form.maintenanceMode ? "translate-x-5" : "translate-x-0.5"
            }`} />
          </button>
        </div>

        {form.maintenanceMode && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
            ⚠️ Maintenance mode is ON — public users cannot access the site
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        className={`mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
          saved ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}
      >
        {saved ? "✓ Saved!" : "Save Changes"}
      </button>
    </div>
  );
}