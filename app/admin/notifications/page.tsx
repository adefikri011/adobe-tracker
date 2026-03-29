"use client";
import { useState } from "react";
import { Bell, ShoppingCart, AlertTriangle, Info, Check, Trash2, Filter } from "lucide-react";

const initialNotifications = [
  { id: 1, type: "sale",    title: "New Sale",          message: "john@example.com upgraded to Pro - 30 Days",     time: "2 minutes ago",  read: false },
  { id: 2, type: "error",   title: "API Error",         message: "Adobe Stock API rate limit reached. Auto-switched to cache.", time: "15 minutes ago", read: false },
  { id: 3, type: "sale",    title: "New Sale",          message: "sarah@gmail.com upgraded to Pro - 7 Days",        time: "1 hour ago",     read: false },
  { id: 4, type: "info",    title: "System Update",     message: "Cache database successfully synced. 756 assets updated.", time: "3 hours ago",    read: true  },
  { id: 5, type: "error",   title: "API Error",         message: "Failed to connect to Adobe Stock API. Retrying...",time: "5 hours ago",    read: true  },
  { id: 6, type: "sale",    title: "New Sale",          message: "mike@yahoo.com upgraded to Pro - 1 Day",          time: "Yesterday",      read: true  },
  { id: 7, type: "info",    title: "New User",          message: "anna@gmail.com registered a new account",         time: "Yesterday",      read: true  },
  { id: 8, type: "sale",    title: "New Sale",          message: "bob@example.com upgraded to Pro - 15 Days",       time: "2 days ago",     read: true  },
];

const typeConfig: Record<string, { icon: any; bg: string; iconColor: string; label: string }> = {
  sale:  { icon: ShoppingCart,  bg: "bg-green-50",  iconColor: "text-green-500",  label: "Sale"   },
  error: { icon: AlertTriangle, bg: "bg-red-50",    iconColor: "text-red-500",    label: "Error"  },
  info:  { icon: Info,          bg: "bg-blue-50",   iconColor: "text-blue-500",   label: "Info"   },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState("All");
  const [emailNotif, setEmailNotif] = useState(true);
  const [saleNotif, setSaleNotif] = useState(true);
  const [errorNotif, setErrorNotif] = useState(true);

  const filtered = notifications.filter(n => {
    if (filter === "All") return true;
    if (filter === "Unread") return !n.read;
    return n.type === filter.toLowerCase();
  });

  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  const deleteNotif = (id: number) => setNotifications(notifications.filter(n => n.id !== id));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <Check size={15} /> Mark all read
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left — Notification List */}
        <div className="col-span-2">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {["All", "Unread", "Sale", "Error", "Info"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filter === f
                    ? "bg-orange-500 text-white"
                    : "bg-white border border-slate-200 text-slate-500 hover:border-orange-300"
                }`}
              >
                {f}
                {f === "Unread" && unreadCount > 0 && (
                  <span className="ml-1.5 bg-white/30 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Bell size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              filtered.map((n) => {
                const config = typeConfig[n.type];
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition ${
                      n.read
                        ? "bg-white border-slate-100"
                        : "bg-orange-50/30 border-orange-100"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} className={config.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-slate-900">{n.title}</span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-slate-300 hover:text-green-500 transition"
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotif(n.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right — Notification Settings */}
        <div className="space-y-4">
          <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 text-sm">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { label: "New Sale",       sub: "Get notified on every purchase",   value: saleNotif,  set: setSaleNotif  },
                { label: "API Errors",     sub: "Alert when API fails or hits limit",value: errorNotif, set: setErrorNotif },
                { label: "Email Notifications", sub: "Send to admin email",         value: emailNotif, set: setEmailNotif },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.sub}</p>
                  </div>
                  <button
                    onClick={() => item.set(!item.value)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                      item.value ? "bg-orange-500" : "bg-slate-200"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      item.value ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 text-sm">Summary</h3>
            <div className="space-y-3">
              {[
                { label: "Total",   value: notifications.length,                          color: "text-slate-900" },
                { label: "Unread",  value: notifications.filter(n => !n.read).length,     color: "text-orange-500" },
                { label: "Sales",   value: notifications.filter(n => n.type === "sale").length,  color: "text-green-500" },
                { label: "Errors",  value: notifications.filter(n => n.type === "error").length, color: "text-red-500"   },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{s.label}</span>
                  <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}