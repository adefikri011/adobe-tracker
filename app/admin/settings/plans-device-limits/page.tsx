"use client";
import { useEffect, useState } from "react";
import { Loader2, Save, AlertCircle, Users, Zap } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  durationDays: number;
  deviceLimit: number;
  suspendDurationMinutes: number;
  isActive: boolean;
}

interface EditingState {
  planId: string | null;
  newLimit: number | null;
  newSuspendDuration: number | null;
  field: 'deviceLimit' | 'suspendDuration' | null;
}

export default function PlansDeviceLimitsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EditingState>({ planId: null, newLimit: null, newSuspendDuration: null, field: null });
  const [syncedCount, setSyncedCount] = useState(0);
  const [messageSaved, setMessageSaved] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/admin/plans");
      const data = await res.json();
      if (data.plans) {
        // Filter only active plans
        setPlans(data.plans.filter((p: Plan) => p.isActive));
      }
    } catch (err) {
      console.error("Error loading plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (plan: Plan, field: 'deviceLimit' | 'suspendDuration') => {
    setEditing({
      planId: plan.id,
      newLimit: plan.deviceLimit,
      newSuspendDuration: plan.suspendDurationMinutes,
      field,
    });
  };

  const handleSaveDeviceLimit = async () => {
    if (!editing.planId) return;

    try {
      setSaving(true);
      const payload: any = { id: editing.planId };

      if (editing.field === 'deviceLimit' && editing.newLimit !== null) {
        payload.deviceLimit = Math.max(1, Math.floor(editing.newLimit));
      } else if (editing.field === 'suspendDuration' && editing.newSuspendDuration !== null) {
        payload.suspendDurationMinutes = Math.max(1, Math.floor(editing.newSuspendDuration));
      }

      const res = await fetch("/api/billing/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSyncedCount(data.syncedProfiles || 0);
        setMessageSaved(true);

        // Update UI
        setPlans(
          plans.map((p) =>
            p.id === editing.planId
              ? {
                  ...p,
                  ...(editing.field === 'deviceLimit' && { deviceLimit: Math.max(1, Math.floor(editing.newLimit!)) }),
                  ...(editing.field === 'suspendDuration' && { suspendDurationMinutes: Math.max(1, Math.floor(editing.newSuspendDuration!)) }),
                }
              : p
          )
        );

        setEditing({ planId: null, newLimit: null, newSuspendDuration: null, field: null });
        setTimeout(() => setMessageSaved(false), 3000);
      }
    } catch (err) {
      console.error("Error saving device limit:", err);
      alert("Failed to save device limit");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing({ planId: null, newLimit: null, newSuspendDuration: null, field: null });
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl">
        <div className="flex items-center justify-center h-96">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Device Limits Per Plan</h1>
        <p className="text-slate-500 mt-2">
          Set the maximum number of devices each subscription plan allows
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8 flex gap-3">
        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>How it works:</strong> When users subscribe to a plan, they automatically get the device limit and suspend duration set here. 
          When you change either setting, all active subscribers to that plan will be updated automatically.
        </div>
      </div>

      {/* Success Message */}
      {messageSaved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-8 flex gap-3 items-start">
          <div className="w-full">
            <p className="text-green-800 font-semibold text-sm">✅ Device limit updated successfully!</p>
            {syncedCount > 0 && (
              <p className="text-green-700 text-xs mt-1">
                Synced to {syncedCount} active subscriber{syncedCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Plans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Plan Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Device Limit
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Suspend Duration
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {plans.map((plan, idx) => {
                const isEditingDeviceLimit = editing.planId === plan.id && editing.field === 'deviceLimit';
                const isEditingSuspendDuration = editing.planId === plan.id && editing.field === 'suspendDuration';

                return (
                  <tr key={plan.id} className={idx !== plans.length - 1 ? "border-b border-slate-100" : ""}>
                    {/* Plan Name */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                        <p className="text-xs text-slate-400">{plan.slug}</p>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{plan.durationDays} days</span>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">${plan.finalPrice.toFixed(2)}</span>
                    </td>

                    {/* Device Limit - Edit or Display */}
                    <td className="px-6 py-4">
                      {isEditingDeviceLimit ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={editing.newLimit || ""}
                            onChange={(e) =>
                              setEditing({ ...editing, newLimit: parseInt(e.target.value) || 1 })
                            }
                            className="w-16 px-3 py-2 border border-orange-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            autoFocus
                          />
                          <span className="text-sm text-slate-500">device{editing.newLimit !== 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-amber-500" />
                          <span className="text-sm font-semibold text-slate-900">
                            {plan.deviceLimit} device{plan.deviceLimit !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Suspend Duration - Edit or Display */}
                    <td className="px-6 py-4">
                      {isEditingSuspendDuration ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="1440"
                            step="5"
                            value={editing.newSuspendDuration || ""}
                            onChange={(e) =>
                              setEditing({ ...editing, newSuspendDuration: parseInt(e.target.value) || 30 })
                            }
                            className="w-16 px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <span className="text-sm text-slate-500">min</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {plan.suspendDurationMinutes} minute{plan.suspendDurationMinutes !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {editing.planId === plan.id && editing.field ? (
                          <>
                            <button
                              onClick={handleSaveDeviceLimit}
                              disabled={saving}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-xs font-semibold rounded-lg transition"
                            >
                              {saving ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save size={14} />
                                  Save
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancel}
                              disabled={saving}
                              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleEditStart(plan, 'deviceLimit')}
                              className="px-2.5 py-1.5 border border-slate-300 hover:border-orange-300 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-semibold rounded-lg transition"
                            >
                              Device
                            </button>
                            <button
                              onClick={() => handleEditStart(plan, 'suspendDuration')}
                              className="px-2.5 py-1.5 border border-slate-300 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs font-semibold rounded-lg transition"
                            >
                              Suspend
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {plans.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm">No active plans found</p>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-3">💡 Tips</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• <strong>Free users</strong> will get the global device limit and suspend duration from Settings</li>
          <li>• <strong>Paid users</strong> will automatically get their plan's device limit and suspend duration</li>
          <li>• Plan settings are prioritized over global and individual profile settings</li>
          <li>• Changes apply immediately to all active subscribers of that plan</li>
          <li>• Suspend duration = how many minutes to suspend user when exceeding device limit</li>
        </ul>
      </div>
    </div>
  );
}
