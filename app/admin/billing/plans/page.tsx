"use client";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2, Tag, X } from "lucide-react";

const initialPlans = [
  {
    id: 1,
    name: "Free",
    price: 0,
    currency: "USD",
    duration: "Forever",
    discount: 0,
    features: ["5 searches/day", "Basic analytics", "1 device"],
    active: true,
  },
  {
    id: 2,
    name: "Pro - 1 Day",
    price: 1.99,
    currency: "USD",
    duration: "1 Day",
    discount: 0,
    features: ["Unlimited searches", "Full analytics", "3 devices", "Export CSV"],
    active: true,
  },
  {
    id: 3,
    name: "Pro - 3 Days",
    price: 4.99,
    currency: "USD",
    duration: "3 Days",
    discount: 0,
    features: ["Unlimited searches", "Full analytics", "3 devices", "Export CSV"],
    active: true,
  },
  {
    id: 4,
    name: "Pro - 7 Days",
    price: 7.99,
    currency: "USD",
    duration: "7 Days",
    discount: 10,
    features: ["Unlimited searches", "Full analytics", "5 devices", "Export CSV", "Priority support"],
    active: true,
  },
  {
    id: 5,
    name: "Pro - 15 Days",
    price: 12.99,
    currency: "USD",
    duration: "15 Days",
    discount: 15,
    features: ["Unlimited searches", "Full analytics", "5 devices", "Export CSV", "Priority support"],
    active: true,
  },
  {
    id: 6,
    name: "Pro - 30 Days",
    price: 19.99,
    currency: "USD",
    duration: "30 Days",
    discount: 20,
    features: ["Unlimited searches", "Full analytics", "Unlimited devices", "Export CSV", "Priority support", "API access"],
    active: true,
  },
];

type Plan = typeof initialPlans[0];

export default function PlansPage() {
  const [plans, setPlans] = useState(initialPlans);
  const [editing, setEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState({ price: "", discount: "" });
  const [showAddFeature, setShowAddFeature] = useState<number | null>(null);
  const [newFeature, setNewFeature] = useState("");

  const discountedPrice = (price: number, discount: number) => {
    if (!discount) return price;
    return price - (price * discount) / 100;
  };

  const handleEdit = (plan: Plan) => {
    setEditing(plan.id);
    setEditData({ price: String(plan.price), discount: String(plan.discount) });
  };

  const handleSave = (id: number) => {
    setPlans(plans.map(p =>
      p.id === id
        ? { ...p, price: parseFloat(editData.price) || p.price, discount: parseInt(editData.discount) || 0 }
        : p
    ));
    setEditing(null);
  };

  const handleToggle = (id: number) => {
    setPlans(plans.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handleRemoveFeature = (planId: number, feature: string) => {
    setPlans(plans.map(p =>
      p.id === planId ? { ...p, features: p.features.filter(f => f !== feature) } : p
    ));
  };

  const handleAddFeature = (planId: number) => {
    if (!newFeature.trim()) return;
    setPlans(plans.map(p =>
      p.id === planId ? { ...p, features: [...p.features, newFeature.trim()] } : p
    ));
    setNewFeature("");
    setShowAddFeature(null);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plans & Pricing</h1>
          <p className="text-slate-400 text-sm mt-1">Manage subscription plans, pricing, and discounts</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
          <Plus size={16} /> Add Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const finalPrice = discountedPrice(plan.price, plan.discount);
          const isEditing = editing === plan.id;

          return (
            <div
              key={plan.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm transition ${
                plan.active ? "border-orange-100" : "border-slate-100 opacity-60"
              }`}
            >
              {/* Plan Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    plan.active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"
                  }`}>
                    {plan.active ? "Active" : "Inactive"}
                  </span>
                  <h3 className="font-bold text-slate-900 mt-2">{plan.name}</h3>
                  <p className="text-xs text-slate-400">{plan.duration}</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-1.5 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-500 transition"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleToggle(plan.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Price & Discount Editor */}
              {isEditing ? (
                <div className="mb-4 space-y-3 bg-orange-50/50 border border-orange-100 rounded-xl p-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Price (USD)</label>
                    <input
                      type="number"
                      value={editData.price}
                      onChange={e => setEditData({ ...editData, price: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editData.discount}
                      onChange={e => setEditData({ ...editData, discount: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                      placeholder="0 = no discount"
                    />
                  </div>
                  {parseFloat(editData.discount) > 0 && parseFloat(editData.price) > 0 && (
                    <div className="text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
                      Final price: ${discountedPrice(parseFloat(editData.price), parseFloat(editData.discount)).toFixed(2)}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(plan.id)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded-lg text-sm font-medium transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="flex-1 border border-slate-200 text-slate-500 py-1.5 rounded-lg text-sm hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  {plan.discount > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-slate-400 line-through text-sm">${plan.price.toFixed(2)}</span>
                        <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                          <Tag size={10} /> {plan.discount}% OFF
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900">${finalPrice.toFixed(2)}</span>
                        <span className="text-slate-400 text-sm">/ {plan.duration}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">
                        {plan.price === 0 ? "Free" : `$${plan.price.toFixed(2)}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-slate-400 text-sm">/ {plan.duration}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center justify-between gap-2 text-sm text-slate-600 group">
                    <span className="flex items-center gap-2">
                      <Check size={13} className="text-orange-500 flex-shrink-0" />
                      {f}
                    </span>
                    <button
                      onClick={() => handleRemoveFeature(plan.id, f)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition"
                    >
                      <X size={11} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Add Feature */}
              {showAddFeature === plan.id ? (
                <div className="flex gap-2 mt-3">
                  <input
                    value={newFeature}
                    onChange={e => setNewFeature(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddFeature(plan.id)}
                    placeholder="e.g. Priority support"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-400"
                    autoFocus
                  />
                  <button
                    onClick={() => handleAddFeature(plan.id)}
                    className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddFeature(null)}
                    className="border border-slate-200 text-slate-400 px-2 py-1.5 rounded-lg text-xs"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddFeature(plan.id)}
                  className="mt-2 w-full text-xs text-slate-400 hover:text-orange-500 border border-dashed border-slate-200 hover:border-orange-300 py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                >
                  <Plus size={11} /> Add feature
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}