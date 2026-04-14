"use client";
import { X, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UpgradeAccessModalProps {
  isOpen: boolean;
  featureName: string;
  currentPlan: string;
  onClose: () => void;
}

export default function UpgradeAccessModal({
  isOpen,
  featureName,
  currentPlan,
  onClose,
}: UpgradeAccessModalProps) {
  const router = useRouter();

  const handleClose = () => {
    router.push("/dashboard");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-600 px-6 py-8 text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>

          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Lock size={32} className="text-white" fill="white" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-white">Pro Feature Locked</h2>
          <p className="text-white/80 text-sm mt-2">
            Upgrade to Pro to access this feature
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Feature & Plan Info */}
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-sm font-semibold text-slate-900 mb-1">
              {featureName}
            </div>
            <div className="text-xs text-slate-600">
              Currently on <span className="font-semibold capitalize">{currentPlan}</span> plan
            </div>
          </div>

          {/* Pro Features */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              What You'll Get with Pro
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Spy contributor portfolios
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Analyze top-performing assets
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Real-time portfolio insights
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <Link
            href="/pricing"
            className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold hover:opacity-90 transition-opacity text-sm text-center"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
}
