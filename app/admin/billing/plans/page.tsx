"use client";
import { useState, useEffect } from "react";
import { Check, Pencil, Plus, Trash2, Tag, X, Loader2, Save } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  discount: number;
  durationDays: number;
  deviceLimit: number;
  features: string[];
  isActive: boolean;
}

interface CurrencySettings {
  currency: string;
  exchangeRate: number;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState({ price: "", discount: "", deviceLimit: "" });
  const [showAddFeature, setShowAddFeature] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState("");

  // Form untuk Plan Baru
  const [newPlanForm, setNewPlanForm] = useState({
    name: "",
    slug: "",
    price: 0,
    durationDays: 1,
    discount: 0,
    deviceLimit: 1,
  });

  // Fetch currency settings
  const fetchCurrencySettings = async () => {
    try {
      const res = await fetch("/api/settings/currency");
      const data = await res.json();
      if (data.success) {
        setCurrencySettings(data.data);
      }
    } catch (err) {
      console.error("Error fetching currency settings:", err);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchCurrencySettings();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/billing/admin/plans");
      const data = await res.json();
      if (data.plans) setPlans(data.plans);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = async () => {
    try {
      const res = await fetch("/api/billing/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlanForm),
      });
      if (res.ok) {
        fetchPlans();
        setIsAdding(false);
        setNewPlanForm({ name: "", slug: "", price: 0, durationDays: 1, discount: 0, deviceLimit: 1 });
        alert("✅ Plan created successfully");
      }
    } catch (err) {
      alert("Failed to add plan");
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch("/api/billing/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          price: parseFloat(editData.price),
          discount: parseFloat(editData.discount),
          deviceLimit: parseInt(editData.deviceLimit),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(plans.map(p => p.id === id ? data.plan : p));
        setEditing(null);
        if (data.syncedProfiles > 0) {
          alert(`✅ Plan updated and synced to ${data.syncedProfiles} active subscribers!`);
        }
      }
    } catch (err) {
      alert("Failed to update plan");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/billing/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      if (res.ok) {
        setPlans(plans.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const syncFeatures = async (id: string, features: string[]) => {
    await fetch("/api/billing/admin/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, features }),
    });
  };

  const handleRemoveFeature = (planId: string, feature: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const updated = plan.features.filter(f => f !== feature);
    setPlans(plans.map(p => p.id === planId ? { ...p, features: updated } : p));
    syncFeatures(planId, updated);
  };

  const handleAddFeature = (planId: string) => {
    if (!newFeature.trim()) return;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const updated = [...plan.features, newFeature.trim()];
    setPlans(plans.map(p => p.id === planId ? { ...p, features: updated } : p));
    syncFeatures(planId, updated);
    setNewFeature("");
    setShowAddFeature(null);
  };

  // Format harga sesuai currency
  const formatPrice = (priceUSD: number) => {
    if (!currencySettings) return `$${priceUSD.toFixed(2)}`;

    if (currencySettings.currency === "IDR") {
      const idrPrice = priceUSD * currencySettings.exchangeRate;
      return `Rp ${Math.round(idrPrice).toLocaleString("id-ID")}`;
    }

    return `$${priceUSD.toFixed(2)}`;
  };

  const getCurrencySymbol = () => {
    return currencySettings?.currency === "IDR" ? "🇮🇩" : "🇺🇸";
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plans & Pricing</h1>
          <p className="text-slate-400 text-sm mt-1">Manage subscription plans, pricing, and discounts</p>
          
          {/* Currency Info Badge */}
          {currencySettings && (
            <div className="mt-3 inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg text-sm text-slate-600">
              <span>{getCurrencySymbol()}</span>
              <span>Pricing in <strong>{currencySettings.currency}</strong></span>
              {currencySettings.currency === "IDR" && (
                <span className="text-xs text-slate-400 ml-1">
                  (1 USD = Rp {currencySettings.exchangeRate.toLocaleString("id-ID")})
                </span>
              )}
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <Plus size={16} /> Add Plan
        </button>
      </div>

      {/* Modal Add Plan Sederhana */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Create New Plan</h2>
              <button onClick={() => setIsAdding(false)}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Plan Name (ex: Pro - 7 Days)" className="w-full border rounded-lg p-2 text-sm" onChange={e => setNewPlanForm({...newPlanForm, name: e.target.value})} />
              <input placeholder="Slug (ex: pro-7)" className="w-full border rounded-lg p-2 text-sm" onChange={e => setNewPlanForm({...newPlanForm, slug: e.target.value})} />
              <div className="flex gap-4">
                <input type="number" placeholder="Price" className="w-1/2 border rounded-lg p-2 text-sm" onChange={e => setNewPlanForm({...newPlanForm, price: parseFloat(e.target.value)})} />
                <input type="number" placeholder="Days" className="w-1/2 border rounded-lg p-2 text-sm" onChange={e => setNewPlanForm({...newPlanForm, durationDays: parseInt(e.target.value)})} />
              </div>
              <div className="flex gap-4">
                <input type="number" placeholder="Max Devices" min="1" max="20" className="w-1/2 border rounded-lg p-2 text-sm" onChange={e => setNewPlanForm({...newPlanForm, deviceLimit: parseInt(e.target.value) || 1})} />
                <input type="number" placeholder="Discount %" className="w-1/2 border rounded-lg p-2 text-sm" onChange={e => setNewPlanForm({...newPlanForm, discount: parseFloat(e.target.value) || 0})} />
              </div>
              <button onClick={handleAddPlan} className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold">Create Plan</button>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isEditing = editing === plan.id;
          return (
            <div key={plan.id} className={`bg-white border rounded-2xl p-6 shadow-sm transition ${plan.isActive ? "border-orange-100" : "border-slate-100 opacity-60"}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.isActive ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                  <h3 className="font-bold text-slate-900 mt-2">{plan.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{plan.durationDays} Days</span>
                    <span>•</span>
                    <span>📱 {plan.deviceLimit} Device{plan.deviceLimit !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setEditing(plan.id); setEditData({price: String(plan.price), discount: String(plan.discount), deviceLimit: String(plan.deviceLimit)}) }} className="p-1.5 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-500 transition"><Pencil size={14} /></button>
                  <button onClick={() => handleToggleActive(plan.id, plan.isActive)} className={`p-1.5 rounded-lg transition ${plan.isActive ? "hover:bg-red-50 text-slate-400 hover:text-red-500" : "hover:bg-green-50 text-slate-400 hover:text-green-500"}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="mb-4 space-y-3 bg-orange-50/50 border border-orange-100 rounded-xl p-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Price (USD - Base)</label>
                    <input type="number" value={editData.price} onChange={e => setEditData({...editData, price: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Discount %</label>
                    <input type="number" value={editData.discount} onChange={e => setEditData({...editData, discount: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" placeholder="Discount %" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Max Devices 📱</label>
                    <input type="number" min="1" max="20" value={editData.deviceLimit} onChange={e => setEditData({...editData, deviceLimit: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" placeholder="Max devices" />
                    <p className="text-xs text-slate-400 mt-1">Subscribers to this plan will get this device limit</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(plan.id)} className="flex-1 bg-orange-500 text-white py-1.5 rounded-lg text-sm">Save</button>
                    <button onClick={() => setEditing(null)} className="flex-1 border text-slate-500 py-1.5 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  {plan.discount > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-slate-400 line-through text-sm">{formatPrice(plan.price)}</span>
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">{plan.discount}% OFF</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900">{formatPrice(plan.finalPrice)}</span>
                        <span className="text-slate-400 text-sm">/ {plan.durationDays}d</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-slate-900">{formatPrice(plan.price)}</div>
                  )}
                </div>
              )}

              <ul className="space-y-2 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center justify-between text-sm text-slate-600 group">
                    <span className="flex items-center gap-2"><Check size={13} className="text-orange-500" />{f}</span>
                    <button onClick={() => handleRemoveFeature(plan.id, f)} className="opacity-0 group-hover:opacity-100 text-red-400"><X size={11} /></button>
                  </li>
                ))}
              </ul>
              {showAddFeature === plan.id ? (
                <div className="flex gap-2"><input value={newFeature} onChange={e => setNewFeature(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFeature(plan.id)} className="flex-1 border rounded-lg px-2 py-1 text-xs" /><button onClick={() => handleAddFeature(plan.id)} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Add</button></div>
              ) : (
                <button onClick={() => setShowAddFeature(plan.id)} className="w-full text-xs text-slate-400 border border-dashed py-1.5 rounded-lg">+ Add feature</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}