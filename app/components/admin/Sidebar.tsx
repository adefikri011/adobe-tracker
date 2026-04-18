"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  Bell,
  Plug,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Download,
  ImageIcon,
  Activity,
  UserCog,
  FileBarChart2,
  ShieldCheck,
  ScrollText,
  CreditCard,
  Globe,
  Clock,
  Smartphone,
  Tag,
  Receipt,
  Landmark,
  Lock,
  Trash2,
} from "lucide-react";
import { useSidebar } from "@/components/admin/SidebarContext";

const SETTINGS_ITEMS = [
  { label: "General", href: "/admin/settings/general", icon: Globe },
  { label: "Currency", href: "/admin/settings/currency", icon: CreditCard },
  { label: "Timezone", href: "/admin/settings/timezone", icon: Clock },
  { label: "Device Limit", href: "/admin/settings/device", icon: Smartphone },
  { label: "Cleanup", href: "/admin/settings/cleanup", icon: Trash2 },
];

const navGroups = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Assets", href: "/admin/assets", icon: ImageIcon },

    ],
  },
  // {
  //   group: "Analytics",
  //   items: [
  //     { label: "Total Earning", href: "/admin/stats/earning", icon: TrendingUp },
  //     { label: "Downloads", href: "/admin/stats/downloads", icon: Download },
  //     { label: "Assets", href: "/admin/stats/assets", icon: ImageIcon },
  //     { label: "Top Keywords", href: "/admin/stats/keywords", icon: BarChart3 },
  //     { label: "Activity", href: "/admin/stats/activity", icon: Activity },

  //   ],
  // },
  {
    group: "Users",
    items: [
      { label: "User List", href: "/admin/users", icon: Users },
    ],
  },
  {
    group: "API & Sync",
    items: [
      { label: "API Integration", href: "/admin/api", icon: Plug },
    ],
  },
  {
    group: "Reports",
    items: [
      { label: "Reports", href: "/admin/reports", icon: FileBarChart2 },
    ],
  },
  {
    group: "Billing",
    items: [
      { label: "Plans & Pricing", href: "/admin/billing/plans", icon: CreditCard },
      { label: "Transactions", href: "/admin/billing/transactions", icon: Receipt },
      { label: "Gateway Config", href: "/admin/billing/gateway", icon: Landmark },
      { label: "Billing History", href: "/admin/billing/history", icon: Lock },

    ],
  },
  {
    group: "System",
    items: [
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Activity Log", href: "/admin/logs/activity", icon: ScrollText },
      { label: "Login Log", href: "/admin/logs/login", icon: ShieldCheck },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith("/admin/settings") || pathname.startsWith("/admin/billing")
  );
  const [adminLogo, setAdminLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  // Fetch admin logo on mount
  useEffect(() => {
    const fetchAdminLogo = async () => {
      try {
        // Add cache busting with timestamp
        const res = await fetch(`/api/admin/logos/upload?t=${Date.now()}`, {
          cache: "no-store",
        });
        const { data } = await res.json();

        const adminLogoData = data.find((logo: any) => logo.sectionType === "admin");

        if (adminLogoData?.fileUrl) {
          console.log("✅ Logo found in DB:", adminLogoData.fileUrl);

          // Add timestamp to force image reload
          const imageUrl = `${adminLogoData.fileUrl}?v=${Date.now()}`;

          // Pre-check if image exists before setting
          const imgCheck = new Image();
          imgCheck.onload = () => {
            console.log("✅ Image loaded successfully");
            setAdminLogo(imageUrl);
            setLogoError(false);
          };
          imgCheck.onerror = () => {
            console.error("❌ Image failed to load. URL:", imageUrl);
            setAdminLogo(null);
            setLogoError(false);
          };
          imgCheck.src = imageUrl;
        } else {
          console.log("ℹ️ No logo in database");
          setAdminLogo(null);
          setLogoError(false);
        }
      } catch (error) {
        console.error("❌ Failed to fetch logos from API:", error);
        setAdminLogo(null);
        setLogoError(false);
      } finally {
        setLogoLoading(false);
      }
    };

    fetchAdminLogo();
  }, []);

  const allNavItems = navGroups.flatMap((g) => g.items);
  const activeHref = allNavItems.reduce<string | null>((best, item) => {
    const isMatch = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!isMatch) return best;
    if (!best || item.href.length > best.length) return item.href;
    return best;
  }, null);

  const isActive = (href: string) => href === activeHref;
  const isSettingsActive = pathname.startsWith("/admin/settings");

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative h-screen bg-white border-r border-orange-100/80 flex flex-col flex-shrink-0 overflow-hidden shadow-[2px_0_16px_0_rgba(249,115,22,0.06)]"
    >
      {/* Brand */}
      <div className="flex items-center justify-center h-24 px-4 border-b border-orange-50 flex-shrink-0 overflow-hidden">
        <div className="relative group cursor-pointer flex-shrink-0 flex items-center justify-center">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-orange-600/10 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

          {/* Logo container — fixed size, no layout shift */}
          <div className="relative flex items-center justify-center">
            {logoLoading ? (
              <div className={`bg-slate-200 rounded-lg animate-pulse ${collapsed ? "w-10 h-10" : "w-44 h-14"}`} />
            ) : adminLogo && !logoError ? (
              <img
                src={adminLogo}
                alt="Admin Logo"
                className={`object-contain transition-all duration-300 group-hover:scale-105 ${collapsed ? "w-10 h-10" : "w-44 h-14"
                  }`}
                onError={() => {
                  console.warn("Failed to load image");
                  setLogoError(true);
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

        {/* Regular groups */}
        {navGroups.map((group) => (
          <div key={group.group}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] px-3 mb-1.5"
                >
                  {group.group}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: collapsed ? 0 : 3 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      title={collapsed ? item.label : undefined}
                      className={`
                        relative flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer
                        transition-colors duration-150 group
                        ${active
                          ? "bg-orange-50 text-orange-500"
                          : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}
                        ${collapsed ? "justify-center" : ""}
                      `}
                    >
                      {active && (
                        <motion.div
                          layoutId="activePill"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-orange-500 rounded-r-full"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                      <Icon
                        size={17}
                        className={`flex-shrink-0 transition-colors ${active
                          ? "text-orange-500"
                          : "text-slate-400 group-hover:text-slate-600"
                          }`}
                      />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`text-sm font-medium whitespace-nowrap overflow-hidden flex-1 ${active ? "text-orange-600" : ""
                              }`}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && active && (
                        <ChevronRight size={12} className="text-orange-400 flex-shrink-0" />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Settings Dropdown */}
        <div>
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] px-3 mb-1.5"
              >
                Configuration
              </motion.p>
            )}
          </AnimatePresence>

          {/* Trigger */}
          <motion.div
            whileHover={{ x: collapsed ? 0 : 3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { if (!collapsed) setSettingsOpen(!settingsOpen); }}
            title={collapsed ? "Settings" : undefined}
            className={`
              relative flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer
              transition-colors duration-150 group
              ${isSettingsActive
                ? "bg-orange-50 text-orange-500"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}
              ${collapsed ? "justify-center" : ""}
            `}
          >
            {isSettingsActive && (
              <motion.div
                layoutId="activePill"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-orange-500 rounded-r-full"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <Settings
              size={17}
              className={`flex-shrink-0 ${isSettingsActive
                ? "text-orange-500"
                : "text-slate-400 group-hover:text-slate-600"
                }`}
            />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className={`text-sm font-medium whitespace-nowrap overflow-hidden flex-1 ${isSettingsActive ? "text-orange-600" : ""
                    }`}
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
            {!collapsed && (
              <motion.div
                animate={{ rotate: settingsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />
              </motion.div>
            )}
          </motion.div>

          {/* Submenu */}
          <AnimatePresence>
            {settingsOpen && !collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden ml-3 mt-1 border-l-2 border-orange-100 pl-3 space-y-0.5"
              >
                {SETTINGS_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.97 }}
                        className={`
                          flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer
                          transition-colors duration-150
                          ${active
                            ? "bg-orange-50 text-orange-500 font-semibold"
                            : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}
                        `}
                      >
                        <Icon size={13} className="flex-shrink-0" />
                        <span className="text-xs font-medium whitespace-nowrap">
                          {item.label}
                        </span>
                        {active && (
                          <ChevronRight size={10} className="text-orange-400 ml-auto" />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-4 border-t border-orange-50 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggle}
          className={`
            flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
            text-slate-400 hover:bg-orange-50 hover:text-orange-500
            transition-colors duration-150
            ${collapsed ? "justify-center" : ""}
          `}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}