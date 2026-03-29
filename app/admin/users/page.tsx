"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, UserPlus, ShieldCheck, User, 
  Ban, Edit3, Key, Crown, MonitorSmartphone,
  X, Check, Calendar
} from "lucide-react";

type UserRole = "Admin" | "User";
type UserStatus = "Active" | "Banned";
// Tambahkan tipe plan sesuai kebutuhan manual setter
type PlanType = "Free" | "Pro 1D" | "Pro 3D" | "Pro 7D" | "Pro 15D" | "Pro 30D" | "Lifetime";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  plan: PlanType;
  deviceLimit: number;
}

const initialUsers: UserData[] = [
  { id: "1", name: "FikBocahDev", email: "fik@masyari.tech", role: "Admin", status: "Active", plan: "Lifetime", deviceLimit: 5 },
  { id: "2", name: "Adobe Hunter", email: "hunter@gmail.com", role: "User", status: "Active", plan: "Pro 30D", deviceLimit: 2 },
  { id: "3", name: "Stock Master", email: "master@stock.com", role: "User", status: "Banned", plan: "Free", deviceLimit: 1 },
  { id: "4", name: "Creative Soul", email: "soul@design.id", role: "User", status: "Active", plan: "Pro 7D", deviceLimit: 2 },
];

export default function UserListPage() {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"All" | UserRole>("All");
  
  // State untuk Modal Edit
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<PlanType>("Free");
  const [editLimit, setEditLimit] = useState(1);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = filterRole === "All" || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [searchTerm, filterRole, users]);

  // Fungsi untuk buka Modal Edit
  const handleEditClick = (user: UserData) => {
    setSelectedUser(user);
    setEditPlan(user.plan);
    setEditLimit(user.deviceLimit);
    setIsModalOpen(true);
  };

  // Fungsi Simpan Perubahan (Plan & Limit)
  const handleSaveSettings = () => {
    if (!selectedUser) return;
    setUsers(users.map(u => 
      u.id === selectedUser.id 
      ? { ...u, plan: editPlan, deviceLimit: editLimit } 
      : u
    ));
    setIsModalOpen(false);
  };

  // Fungsi Toggle Ban/Unban
  const handleToggleBan = (id: string) => {
    setUsers(users.map(u => 
      u.id === id ? { ...u, status: u.status === "Active" ? "Banned" : "Active" } : u
    ));
  };

  return (
    <div className="p-6 md:p-10 bg-[#FBFCFE] min-h-screen space-y-10 font-sans">
      
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1e293b] tracking-tight">User Management</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Manage memberships, device limits, and account status.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-[#1e293b] text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-[#ff6b00] transition-all shadow-md active:scale-[0.98]">
          <UserPlus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      {/* ── Search & Filter ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input 
            type="text" 
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-all font-medium shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {["All", "Admin", "User"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r as any)}
              className={`px-5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterRole === r 
                ? "bg-[#ff6b00] text-white shadow-md shadow-orange-100" 
                : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── User Table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-100/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fcfdfe]">
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] pl-8">User Information</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Role</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Plan</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Device</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Status</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff6b00] font-semibold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1e293b] group-hover:text-[#ff6b00] transition-colors">{user.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg w-fit text-[10px] font-bold uppercase tracking-wider border ${
                        user.role === 'Admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {user.role === 'Admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                        {user.role}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Crown size={14} className={user.plan !== 'Free' ? 'text-orange-500' : 'text-slate-300'} />
                        <span className="text-xs font-semibold">{user.plan}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MonitorSmartphone size={14} />
                        <span className="text-xs font-semibold text-slate-600">{user.deviceLimit}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-colors ${
                        user.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleEditClick(user)}
                          title="Edit Plan & Device" 
                          className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          title="Reset Password" 
                          className="p-2 text-slate-300 hover:text-orange-500 transition-colors"
                        >
                          <Key size={16} />
                        </button>
                        <button 
                          onClick={() => handleToggleBan(user.id)}
                          title={user.status === "Active" ? "Ban User" : "Unban User"} 
                          className={`p-2 transition-colors ${user.status === "Active" ? "text-slate-300 hover:text-red-500" : "text-red-500 hover:text-green-500"}`}
                        >
                          <Ban size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MANAGE MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 space-y-7">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1e293b]">User Access Control</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{selectedUser.name} • {selectedUser.email}</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                    <X size={18} className="text-slate-300" />
                  </button>
                </div>

                {/* Membership Grid */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} /> Plan Duration (Manual)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Free", "Pro 1D", "Pro 3D", "Pro 7D", "Pro 15D", "Pro 30D", "Lifetime"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setEditPlan(p as PlanType)}
                        className={`px-2 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                          editPlan === p 
                          ? "bg-[#ff6b00] text-white border-[#ff6b00] shadow-sm shadow-orange-100" 
                          : "bg-white text-slate-400 border-slate-100 hover:border-orange-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Device Limit Slider */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <MonitorSmartphone size={14} /> Max Device Limit
                  </label>
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <input 
                      type="range" min="1" max="10" 
                      value={editLimit}
                      onChange={(e) => setEditLimit(parseInt(e.target.value))}
                      className="flex-1 accent-[#ff6b00]"
                    />
                    <span className="text-sm font-bold text-[#1e293b] min-w-[20px] text-center">
                      {editLimit}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleSaveSettings}
                  className="w-full py-3.5 bg-[#1e293b] text-white rounded-2xl font-bold text-xs shadow-lg shadow-slate-200 hover:bg-[#ff6b00] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Save User Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}