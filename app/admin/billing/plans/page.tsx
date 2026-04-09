"use client";
import { useState, useEffect } from "react";
import { Check, Edit2, Plus, Trash2, X, Loader2, ChevronDown } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  discount: number;
  durationDays: number;
  deviceLimit: number;
  suspendDurationMinutes: number;
  dailySearchLimit: number;
  maxSearches: string;
  features: string[];
  isActive: boolean;
}

const MAX_SEARCH_OPTIONS = ["5", "50", "100", "150", "200", "unlimited"];
const AVAILABLE_FEATURES = [
  "unlimited_searches",
  "all_features",
  "export_csv",
  "performance_analytics",
  "priority_support",
];

interface EditingPlan extends Plan {
  isNew?: boolean;
}

interface CurrencySettings {
  currency: string;
  exchangeRate: number;
}

export default function PlansAdminPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<EditingPlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);

  // Fetch both plans and currency
  const fetchData = async () => {
    try {
      // Fetch plans
      const plansRes = await fetch("/api/billing/admin/plans");
      const plansData = await plansRes.json();
      if (plansData.success) {
        setPlans(plansData.data || []);
      } else {
        setMessage({ type: "error", text: plansData.message || "Failed to fetch plans" });
      }

      // Fetch currency settings
      const currencyRes = await fetch("/api/settings/currency");
      const currencyData = await currencyRes.json();
      if (currencyData.success) {
        setCurrencySettings(currencyData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: "error", text: "Failed to fetch data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleNew = () => {
    const newPlan: EditingPlan = {
      id: "",
      name: "",
      slug: "",
      price: 0,
      finalPrice: 0,
      discount: 0,
      durationDays: 1,
      deviceLimit: 1,
      suspendDurationMinutes: 30,
      dailySearchLimit: 5,
      maxSearches: "unlimited",
      features: [],
      isActive: true,
      isNew: true,
    };
    setEditingPlan(newPlan);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    // Validation
    if (!editingPlan.name.trim()) {
      setMessage({ type: "error", text: "Plan name is required" });
      return;
    }
    if (!editingPlan.slug.trim()) {
      setMessage({ type: "error", text: "Plan slug is required" });
      return;
    }

    setSaving(true);
    try {
      const method = editingPlan.isNew ? "POST" : "PATCH";

      const res = await fetch("/api/billing/admin/plans", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPlan.id || undefined,
          name: editingPlan.name,
          slug: editingPlan.slug,
          price: editingPlan.price,
          finalPrice: editingPlan.finalPrice,
          discount: editingPlan.discount,
          durationDays: editingPlan.durationDays,
          deviceLimit: editingPlan.deviceLimit,
          suspendDurationMinutes: editingPlan.suspendDurationMinutes,
          dailySearchLimit: editingPlan.dailySearchLimit,
          maxSearches: editingPlan.maxSearches,
          features: editingPlan.features,
          isActive: editingPlan.isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: editingPlan.isNew ? "Plan created successfully" : "Plan updated successfully" });
        setShowForm(false);
        setEditingPlan(null);
        fetchData();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to save plan" });
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      setMessage({ type: "error", text: "Error saving plan" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const res = await fetch(`/api/billing/admin/plans?id=${planId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Plan deleted successfully" });
        fetchData();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to delete plan" });
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      setMessage({ type: "error", text: "Error deleting plan" });
    }
  };

  const formatPrice = (priceUSD: number): string => {
    if (!currencySettings) return `$${priceUSD.toFixed(2)}`;
    if (currencySettings.currency === "IDR") {
      const idrPrice = priceUSD * currencySettings.exchangeRate;
      return `Rp ${Math.round(idrPrice).toLocaleString("id-ID")}`;
    }
    return `$${priceUSD.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-white">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Plans Management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage and update subscription plans</p>
            {currencySettings && (
              <div className="mt-3 inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg text-xs text-slate-600">
                <span>{currencySettings.currency === "IDR" ? "🇮🇩" : "🇺🇸"}</span>
                <span>Pricing in <strong>{currencySettings.currency}</strong></span>
              </div>
            )}
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-white font-semibold hover:bg-orange-600 transition"
          >
            <Plus size={18} />
            New Plan
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            <div className="flex items-center gap-2">
              {message.type === "success" ? <Check size={18} /> : <X size={18} />}
              {message.text}
            </div>
          </div>
        )}

        {/* Plans Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Plan Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Duration</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Devices</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Batas Pencarian/Hari</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Batas Hasil</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No plans found
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{plan.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                      {formatPrice(plan.finalPrice)}
                      {plan.discount > 0 && <span className="ml-2 text-xs text-orange-600">({plan.discount}% off)</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{plan.durationDays} days</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{plan.deviceLimit}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{plan.dailySearchLimit} pencarian</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {plan.maxSearches === "unlimited" ? "∞ Unlimited" : plan.maxSearches}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${plan.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {plan.isActive ? <Check size={14} /> : <X size={14} />}
                        {plan.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(plan)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(plan.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit/New Plan Modal */}
        {showForm && editingPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingPlan.isNew ? "Create New Plan" : "Edit Plan"}
                </h2>
                <button onClick={() => { setShowForm(false); setEditingPlan(null); }} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name *</label>
                    <input
                      type="text"
                      value={editingPlan.name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      placeholder="e.g., Pro - 7 Days"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Slug * (no spaces)</label>
                    <input
                      type="text"
                      value={editingPlan.slug}
                      onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value.toLowerCase() })}
                      placeholder="e.g., pro-7day"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      disabled={!editingPlan.isNew}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Original Price ($)</label>
                    <input
                      type="number"
                      value={editingPlan.price}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Final Price ($)</label>
                    <input
                      type="number"
                      value={editingPlan.finalPrice}
                      onChange={(e) => setEditingPlan({ ...editingPlan, finalPrice: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={editingPlan.discount}
                      onChange={(e) => setEditingPlan({ ...editingPlan, discount: parseFloat(e.target.value) || 0 })}
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (days)</label>
                    <input
                      type="number"
                      value={editingPlan.durationDays}
                      onChange={(e) => setEditingPlan({ ...editingPlan, durationDays: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Devices</label>
                    <input
                      type="number"
                      value={editingPlan.deviceLimit}
                      onChange={(e) => setEditingPlan({ ...editingPlan, deviceLimit: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Suspend (minutes)</label>
                    <input
                      type="number"
                      value={editingPlan.suspendDurationMinutes}
                      onChange={(e) => setEditingPlan({ ...editingPlan, suspendDurationMinutes: parseInt(e.target.value) || 30 })}
                      min="1"
                      step="5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Batas Pencarian per Hari</label>
                    <p className="text-xs text-slate-500 mb-2">Berapa kali user bisa mencari dalam sehari</p>
                    <input
                      type="number"
                      value={editingPlan.dailySearchLimit}
                      onChange={(e) => setEditingPlan({ ...editingPlan, dailySearchLimit: parseInt(e.target.value) || 5 })}
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Batas Hasil Pencarian</label>
                    <p className="text-xs text-slate-500 mb-2">Berapa banyak hasil yang ditampilkan per pencarian</p>
                    <select
                      value={editingPlan.maxSearches}
                      onChange={(e) => setEditingPlan({ ...editingPlan, maxSearches: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {MAX_SEARCH_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt === "unlimited" ? "∞ Unlimited" : opt + " hasil"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hidden - Search Result Limit</label>
                  <p className="text-xs text-slate-500 mb-2">Controls how many search results are displayed to users (applies to all plans)</p>
                  <select
                    value={editingPlan.maxSearches}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxSearches: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {MAX_SEARCH_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "unlimited" ? "∞ Unlimited" : opt + " results"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Features</label>
                  
                  {/* Selected Features */}
                  {editingPlan.features.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {editingPlan.features.map((feature) => (
                        <div key={feature} className="flex items-center justify-between gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                          <span className="text-sm text-slate-700">{feature.replace(/_/g, " ")}</span>
                          <button
                            type="button"
                            onClick={() => setEditingPlan({ ...editingPlan, features: editingPlan.features.filter((f) => f !== feature) })}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preset Features */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">Preset features:</p>
                    <div className="space-y-2">
                      {AVAILABLE_FEATURES.map((feature) => (
                        <label key={feature} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingPlan.features.includes(feature)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...editingPlan.features, feature]
                                : editingPlan.features.filter((f) => f !== feature);
                              setEditingPlan({ ...editingPlan, features: updated });
                            }}
                            className="w-4 h-4 rounded accent-orange-500"
                          />
                          <span className="text-sm text-slate-700">{feature.replace(/_/g, " ")}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Add Custom Feature */}
                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">Or add custom feature:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="customFeatureInput"
                        placeholder="e.g., priority_support, api_access"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById("customFeatureInput") as HTMLInputElement;
                          if (input && input.value.trim()) {
                            const newFeature = input.value.trim().toLowerCase().replace(/\s+/g, "_");
                            if (!editingPlan.features.includes(newFeature)) {
                              setEditingPlan({ ...editingPlan, features: [...editingPlan.features, newFeature] });
                              input.value = "";
                            }
                          }
                        }}
                        className="px-3 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.isActive}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                    className="w-4 h-4 rounded accent-orange-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Plan is Active</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowForm(false); setEditingPlan(null); }}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? "Saving..." : "Save Plan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}