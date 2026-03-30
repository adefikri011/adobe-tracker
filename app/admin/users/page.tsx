"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, UserPlus, ShieldCheck, User, 
  Ban, Edit3, Key, Crown, MonitorSmartphone,
  X, Check, Calendar, Loader
} from "lucide-react";

type UserRole = "admin" | "user";
type UserStatus = "active" | "suspended";
type PlanType = "free" | "pro_1d" | "pro_3d" | "pro_7d" | "pro_15d" | "pro_30d" | "lifetime";

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  plan: PlanType;
  deviceLimit: number;
}

export default function UserListPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | UserRole>("all");
  
  // Edit Modal
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<PlanType>("free");
  const [editLimit, setEditLimit] = useState(1);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("user");
  const [newUserPlan, setNewUserPlan] = useState<PlanType>("free");
  const [isCreating, setIsCreating] = useState(false);

  // Ban/Unban Confirmation Modal
  const [banConfirmModal, setBanConfirmModal] = useState<{ isOpen: boolean; userId: string }>({ isOpen: false, userId: "" });
  const [isBanProcessing, setIsBanProcessing] = useState(false);

  // Fetch users from Supabase
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/admin/users", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error("Failed to load users");
        }

        const payload = await res.json();
        const serverUsers = Array.isArray(payload?.users) ? payload.users : [];

        const formattedUsers: UserData[] = serverUsers.map((user: UserData) => ({
          id: user.id,
          fullName: user.fullName || (user.email ? user.email.split("@")[0] : "Unknown User"),
          email: user.email,
          role: user.role || "user",
          status: user.status || "active",
          plan: user.plan || "free",
          deviceLimit: user.deviceLimit || 1,
        }));

        setUsers(formattedUsers);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = filterRole === "all" || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [searchTerm, filterRole, users]);

  const handleEditClick = (user: UserData) => {
    setSelectedUser(user);
    setEditPlan(user.plan);
    setEditLimit(user.deviceLimit);
    setIsModalOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedUser) return;

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUser.id,
        plan: editPlan,
        deviceLimit: editLimit,
      }),
    });

    if (!res.ok) {
      console.error("Error updating user");
      return;
    }

    setUsers(users.map(u => 
      u.id === selectedUser.id 
      ? { ...u, plan: editPlan, deviceLimit: editLimit } 
      : u
    ));
    setIsModalOpen(false);
  };

  const handleToggleBan = (id: string) => {
    setBanConfirmModal({ isOpen: true, userId: id });
  };

  const handleConfirmBanAction = async () => {
    if (!banConfirmModal.userId) return;

    setIsBanProcessing(true);
    const user = users.find(u => u.id === banConfirmModal.userId);
    if (!user) {
      setIsBanProcessing(false);
      return;
    }

    try {
      const unlockRes = await fetch("/api/admin/unlock-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: banConfirmModal.userId })
      });

      if (!unlockRes.ok) {
        console.error("Failed to clear session suspension");
      }
    } catch (err) {
      console.error("Error clearing session:", err);
    }

    setUsers(users.map(u => 
      u.id === banConfirmModal.userId ? { ...u, status: "active" } : u
    ));
    
    setBanConfirmModal({ isOpen: false, userId: "" });
    setIsBanProcessing(false);
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert("Name and Email required!");
      return;
    }

    setIsCreating(true);
    
    try {
      const createRes = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newUserName,
          email: newUserEmail,
          role: newUserRole,
          plan: newUserPlan,
          status: "active",
          deviceLimit: 1,
        }),
      });

      if (!createRes.ok) {
        console.error("Error creating user");
        alert("Failed to create user");
        setIsCreating(false);
        return;
      }

      const payload = await createRes.json();
      const created = payload?.user as UserData | undefined;
      if (!created) {
        alert("Failed to create user");
        setIsCreating(false);
        return;
      }

      // Add to local state
      const newUser: UserData = {
        id: created.id,
        fullName: created.fullName,
        email: created.email,
        role: created.role,
        plan: created.plan,
        status: created.status,
        deviceLimit: created.deviceLimit,
      };

      setUsers([...users, newUser]);
      setIsCreateModalOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole("user");
      setNewUserPlan("free");
      setIsCreating(false);
    } catch (err) {
      console.error("Error:", err);
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 bg-[#FBFCFE] min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-[#ff6b00]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-[#FBFCFE] min-h-screen space-y-10 font-sans">
      
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1e293b] tracking-tight">User Management</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Manage memberships, device limits, and account status.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#1e293b] text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-[#ff6b00] transition-all shadow-md active:scale-[0.98]">
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
          {["all", "admin", "user"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r as any)}
              className={`px-5 py-1.5 text-xs font-bold rounded-xl transition-all capitalize ${
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
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1e293b] group-hover:text-[#ff6b00] transition-colors">{user.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg w-fit text-[10px] font-bold uppercase tracking-wider border ${
                        user.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {user.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                        {user.role}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Crown size={14} className={user.plan !== 'free' ? 'text-orange-500' : 'text-slate-300'} />
                        <span className="text-xs font-semibold capitalize">{user.plan}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MonitorSmartphone size={14} />
                        <span className="text-xs font-semibold text-slate-600">{user.deviceLimit}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-colors capitalize ${
                        user.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
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
                        {user.status === "suspended" && (
                          <button 
                            onClick={() => handleToggleBan(user.id)}
                            title="Unlock Suspended User" 
                            className="p-2 text-red-500 hover:text-green-500 transition-colors"
                          >
                            <Ban size={16} />
                          </button>
                        )}
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
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{selectedUser.fullName} • {selectedUser.email}</p>
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
                    {["free", "pro_1d", "pro_3d", "pro_7d", "pro_15d", "pro_30d", "lifetime"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setEditPlan(p as PlanType)}
                        className={`px-2 py-2 rounded-xl text-[10px] font-bold transition-all border capitalize ${
                          editPlan === p 
                          ? "bg-[#ff6b00] text-white border-[#ff6b00] shadow-sm shadow-orange-100" 
                          : "bg-white text-slate-400 border-slate-100 hover:border-orange-100"
                        }`}
                      >
                        {p.replace(/_/g, " ")}
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

      {/* ── CREATE USER MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1e293b]">Create New User</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Add a new user to the system</p>
                  </div>
                  <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                    <X size={18} className="text-slate-300" />
                  </button>
                </div>

                {/* Full Name Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-all font-medium"
                  />
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-all font-medium"
                  />
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} /> User Role
                  </label>
                  <div className="flex gap-2">
                    {["user", "admin"].map((role) => (
                      <button
                        key={role}
                        onClick={() => setNewUserRole(role as UserRole)}
                        className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border capitalize ${
                          newUserRole === role 
                          ? "bg-[#ff6b00] text-white border-[#ff6b00] shadow-sm shadow-orange-100" 
                          : "bg-white text-slate-400 border-slate-100 hover:border-orange-100"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plan Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Crown size={14} /> Initial Plan
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["free", "pro_1d", "pro_7d", "pro_30d", "lifetime"].map((plan) => (
                      <button
                        key={plan}
                        onClick={() => setNewUserPlan(plan as PlanType)}
                        className={`px-2 py-2 rounded-xl text-[10px] font-bold transition-all border capitalize ${
                          newUserPlan === plan 
                          ? "bg-[#ff6b00] text-white border-[#ff6b00] shadow-sm shadow-orange-100" 
                          : "bg-white text-slate-400 border-slate-100 hover:border-orange-100"
                        }`}
                      >
                        {plan.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleCreateUser}
                  disabled={isCreating}
                  className="w-full py-3.5 bg-[#1e293b] text-white rounded-2xl font-bold text-xs shadow-lg shadow-slate-200 hover:bg-[#ff6b00] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader size={16} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Create User
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BAN/UNBAN CONFIRMATION MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {banConfirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setBanConfirmModal({ isOpen: false, userId: "" })}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-[28px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                    <Check size={24} />
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-lg font-semibold text-[#1e293b] mb-2">
                    Unlock Suspended User?
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    This user will regain access to the platform immediately.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setBanConfirmModal({ isOpen: false, userId: "" })}
                    disabled={isBanProcessing}
                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBanAction}
                    disabled={isBanProcessing}
                    className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-green-600"
                  >
                    {isBanProcessing ? (
                      <>
                        <Loader size={14} className="animate-spin" /> Processing...
                      </>
                    ) : (
                      "Unlock User"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}