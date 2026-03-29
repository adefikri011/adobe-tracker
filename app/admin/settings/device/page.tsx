"use client";
import { useState } from "react";
import { Smartphone, Monitor, Tablet, Trash2 } from "lucide-react";

const activeSessions = [
  { id: 1, device: "Chrome / Windows",  type: "desktop", ip: "192.168.1.1",  location: "Jakarta, ID",    last: "Active now",    current: true  },
  { id: 2, device: "Safari / iPhone",   type: "mobile",  ip: "203.0.113.10", location: "Bandung, ID",    last: "2 hours ago",   current: false },
  { id: 3, device: "Chrome / Android",  type: "mobile",  ip: "198.51.100.9", location: "Surabaya, ID",   last: "Yesterday",     current: false },
  { id: 4, device: "Firefox / MacOS",   type: "desktop", ip: "203.0.113.55", location: "Singapore, SG",  last: "3 days ago",    current: false },
];

export default function DeviceLimitPage() {
  const [limit, setLimit] = useState(3);
  const [sessions, setSessions] = useState(activeSessions);
  const [saved, setSaved] = useState(false);

  const handleRevoke = (id: number) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const DeviceIcon = (type: string) => {
    if (type === "mobile") return <Smartphone size={16} className="text-slate-500" />;
    if (type === "tablet") return <Tablet size={16} className="text-slate-500" />;
    return <Monitor size={16} className="text-slate-500" />;
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Device Limit</h1>
        <p className="text-slate-400 text-sm mt-1">Control how many devices users can use simultaneously</p>
      </div>

      {/* Limit Config */}
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-900 mb-1 text-sm">Max Devices per User</h3>
        <p className="text-xs text-slate-400 mb-5">Users exceeding this limit will be logged out from older devices</p>

        {/* Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">1 device</span>
            <span className="text-2xl font-bold text-orange-500">{limit} {limit === 1 ? "device" : "devices"}</span>
            <span className="text-xs text-slate-500">10 devices</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={limit}
            onChange={e => setLimit(parseInt(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>

        {/* Per Plan Config */}
        <div className="border-t border-slate-100 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Per Plan Override</p>
          <div className="space-y-3">
            {[
              { plan: "Free",        devices: 1  },
              { plan: "Pro - 1 Day", devices: 2  },
              { plan: "Pro - 7 Day", devices: 3  },
              { plan: "Pro - 30 Day",devices: 5  },
            ].map((p) => (
              <div key={p.plan} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{p.plan}</span>
                <div className="flex items-center gap-2">
                  <button
                    className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-500 transition text-sm font-bold"
                    onClick={() => {}}
                  >−</button>
                  <span className="text-sm font-bold text-slate-900 w-4 text-center">{p.devices}</span>
                  <button
                    className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-500 transition text-sm font-bold"
                    onClick={() => {}}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 text-sm">Your Active Sessions</h3>
          <span className="text-xs text-slate-400">{sessions.length} / {limit} devices</span>
        </div>

        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
              s.current ? "border-orange-200 bg-orange-50/50" : "border-slate-100"
            }`}>
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                {DeviceIcon(s.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">{s.device}</p>
                  {s.current && (
                    <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{s.location} · {s.ip} · {s.last}</p>
              </div>
              {!s.current && (
                <button
                  onClick={() => handleRevoke(s.id)}
                  className="text-slate-300 hover:text-red-400 transition p-1"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
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