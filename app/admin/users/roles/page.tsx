"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  XCircle,
  Settings,
  Database,
  Users,
  LayoutDashboard
} from "lucide-react";

const roles = [
  {
    name: "Administrator",
    icon: ShieldCheck,
    description: "System owner with full control over configuration and data.",
    color: "bg-orange-500",
    shadow: "shadow-orange-200",
    features: [
      { name: "Full Dashboard Access", allowed: true },
      { name: "Adobe API Configuration", allowed: true },
      { name: "User Management & Bans", allowed: true },
      { name: "Edit Pro Package / Pricing", allowed: true },
      { name: "Database & Log Access", allowed: true },
    ]
  },
  {
    name: "Standard User",
    icon: User,
    description: "Member or client using asset tracking features.",
    color: "bg-slate-800",
    shadow: "shadow-slate-200",
    features: [
      { name: "Personal Dashboard Access", allowed: true },
      { name: "View Asset Statistics", allowed: true },
      { name: "Download Daily Reports", allowed: true },
      { name: "Edit API Configuration", allowed: false },
      { name: "Manage Other Users", allowed: false },
    ]
  }
];

export default function RolesPage() {
  return (
    <div className="p-4 md:p-8 bg-[#FBFCFE] min-h-screen space-y-8">
      
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-100">
            <ShieldCheck size={20} />
          </div>
          User Permissions
        </h1>
        <p className="text-sm text-slate-500 font-medium pl-11">
          Access settings to differentiate Admin and Standard Member features.
        </p>
      </div>

      {/* ── Roles Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        {roles.map((role, i) => (
          <motion.div
            key={role.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[40px] border border-slate-50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-8 relative group overflow-hidden"
          >
            {/* Header Card */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-4 rounded-3xl text-white ${role.color} ${role.shadow} transition-transform group-hover:rotate-6`}>
                <role.icon size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{role.name}</h3>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Role</span>
              </div>
            </div>

            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
              {role.description}
            </p>

            {/* Permissions List */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">
                Access List
              </p>
              {role.features.map((feature) => (
                <div key={feature.name} className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${feature.allowed ? 'text-slate-700' : 'text-slate-300 line-through decoration-slate-200'}`}>
                    {feature.name}
                  </span>
                  {feature.allowed ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-slate-200" />
                  )}
                </div>
              ))}
            </div>

            {/* Status Footer */}
            <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((u) => (
                  <div key={u} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    U
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-orange-50 text-orange-500 flex items-center justify-center text-[10px] font-bold">
                  +
                </div>
              </div>
              <button className="text-xs font-black text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-widest">
                Edit Role
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Quick Summary ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl">
        {[
          { label: "Active Admins", value: "2", icon: Settings },
          { label: "Standard Members", value: "142", icon: Users },
          { label: "Total Managed Data", value: "12.5k", icon: Database },
        ].map((item) => (
          <div key={item.label} className="bg-white/50 border border-slate-100 rounded-3xl p-5 flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400">
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
              <p className="text-lg font-black text-slate-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}