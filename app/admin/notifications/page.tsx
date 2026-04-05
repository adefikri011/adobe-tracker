"use client";
import { useState, useEffect } from "react";
import { Bell, ShoppingCart, AlertTriangle, Info, Check, Trash2, Filter } from "lucide-react";

const typeConfig: Record<string, { icon: any; bg: string; iconColor: string; label: string }> = {
  sale:  { icon: ShoppingCart,  bg: "bg-green-50",  iconColor: "text-green-500",  label: "Sale"   },
  error: { icon: AlertTriangle, bg: "bg-red-50",    iconColor: "text-red-500",    label: "Error"  },
  info:  { icon: Info,          bg: "bg-blue-50",   iconColor: "text-blue-500",   label: "Info"   },
};

interface Notification {
  id: string;
  type: "sale" | "error" | "info";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface Preferences {
  emailNotif: boolean;
  saleNotif: boolean;
  errorNotif: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    emailNotif: true,
    saleNotif: true,
    errorNotif: true,
  });
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Fetch notifications and preferences
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [notifRes, prefRes] = await Promise.all([
          fetch("/api/admin/notifications"),
          fetch("/api/admin/notification-preferences"),
        ]);

        const notifData = await notifRes.json();
        const prefData = await prefRes.json();

        setNotifications(notifData);
        setPreferences({
          emailNotif: prefData.emailNotif,
          saleNotif: prefData.saleNotif,
          errorNotif: prefData.errorNotif,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format date to relative time
  const formatTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return notifDate.toLocaleDateString();
  };

  const filtered = notifications.filter(n => {
    if (filter === "All") return true;
    if (filter === "Unread") return !n.read;
    return n.type === filter.toLowerCase();
  });

  const markAllRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => !n.read)
          .map(n =>
            fetch("/api/admin/notifications", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: n.id }),
            })
          )
      );

      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      setNotifications(notifications.map(n => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const togglePreference = async (key: "emailNotif" | "saleNotif" | "errorNotif", value: boolean) => {
    try {
      await fetch("/api/admin/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      setPreferences(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap"
        >
          <Check size={15} /> Mark all read
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left — Notification List */}
        <div className="lg:col-span-2">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {["All", "Unread", "Sale", "Error", "Info"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
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
                      <p className="text-[10px] text-slate-400 mt-1">{formatTime(n.createdAt)}</p>
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
                { label: "New Sale",       sub: "Get notified on every purchase",   key: "saleNotif" as const,  value: preferences.saleNotif },
                { label: "API Errors",     sub: "Alert when API fails or hits limit", key: "errorNotif" as const, value: preferences.errorNotif },
                { label: "Email Notifications", sub: "Send to admin email",         key: "emailNotif" as const, value: preferences.emailNotif },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.sub}</p>
                  </div>
                  <button
                    onClick={() => togglePreference(item.key, !item.value)}
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