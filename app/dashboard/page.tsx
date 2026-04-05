"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Navbar } from "./_components/Navbar";
import { SearchBar } from "./_components/SearchBar";
import { DashboardHome } from "./_components/DashboardHome";
import { SearchCharts } from "./_components/SearchCharts";
import { KeywordStats } from "./_components/KeywordStats";
import { ResultsSection } from "./_components/ResultsSection";
import { PaymentModal } from "./_components/PaymentModal";
import { Asset } from "./_components/ResultCard";
import QuotaExceededModal from "../components/QuotaExceededModal";

const SUSPEND_TEST_MINUTES = 30; // Default fallback, actual value comes from API

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Asset[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [suspendDurationMinutes, setSuspendDurationMinutes] = useState(SUSPEND_TEST_MINUTES);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaData, setQuotaData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d) => {
        // Support both old format (just plan string) dan new format (with isPremium)
        const isProPlan = d.isPremium !== undefined ? d.isPremium : d.plan === "pro";
        setIsPro(isProPlan);
        console.log("[Dashboard] Plan status:", d.plan, "isPremium:", isProPlan);
        setPlanLoading(false);
      })
      .catch((err) => {
        console.error("[Dashboard] Failed to fetch plan:", err);
        setPlanLoading(false);
      });
  }, []);

  useEffect(() => {
    let isRedirecting = false;

    const checkSessionStatus = async () => {
      if (isRedirecting) return;
      try {
        const res = await fetch("/api/auth/session-status", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (res.status === 401) {
          isRedirecting = true;
          let minutes = suspendDurationMinutes || SUSPEND_TEST_MINUTES;
          try {
            const data = await res.json();
            if (typeof data?.suspendDurationMinutes === "number") {
              minutes = data.suspendDurationMinutes;
              setSuspendDurationMinutes(data.suspendDurationMinutes);
            }
          } catch {
            // Keep fallback if body is empty or invalid JSON.
          }
          window.location.href = `/login?error=device_conflict&minutes=${minutes}`;
          return;
        }

        if (!res.ok) return;

        const data = await res.json();

        // Update suspendDurationMinutes from API if available
        if (typeof data.suspendDurationMinutes === "number") {
          setSuspendDurationMinutes(data.suspendDurationMinutes);
        }

        if (data.status === "suspended") {
          isRedirecting = true;
          const minutes = Number(data.minutesLeft ?? 1);
          const until = data.suspendedUntil ? `&until=${encodeURIComponent(data.suspendedUntil)}` : "";
          window.location.href = `/login?error=suspended&minutes=${minutes}${until}`;
          return;
        }

        if (data.status === "session_revoked") {
          isRedirecting = true;
          const minutes = data.suspendDurationMinutes || SUSPEND_TEST_MINUTES;
          window.location.href = `/login?error=device_conflict&minutes=${minutes}`;
        }
      } catch (error) {
        console.error("Session polling failed:", error);
      }
    };

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) checkSessionStatus();
    };

    checkSessionStatus();
    const intervalId = window.setInterval(checkSessionStatus, 3000);
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [router, suspendDurationMinutes]);

  const handleUpgradeSuccess = async () => {
    await fetch("/api/user/upgrade", { method: "POST" });
    
    // Refetch plan status dari server untuk ensure data terbaru
    try {
      const res = await fetch("/api/user/plan");
      const data = await res.json();
      const isProPlan = data.isPremium !== undefined ? data.isPremium : data.plan === "pro";
      setIsPro(isProPlan);
      console.log("[Dashboard] Plan updated after upgrade:", data.plan, "isPremium:", isProPlan);
    } catch (error) {
      console.error("[Dashboard] Failed to refetch plan after upgrade:", error);
      setIsPro(true);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      // Handle quota exceeded (429)
      if (res.status === 429) {
        try {
          const text = await res.text();
          const data = text ? JSON.parse(text) : {};
          setQuotaData(data);
          setShowQuotaModal(true);
        } catch (error) {
          // If parsing fails, still show modal with default data
          setQuotaData({ error: "Daily search limit reached" });
          setShowQuotaModal(true);
        }
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        console.error(`[Search] Error ${res.status}`);
        try {
          const errorData = await res.json();
          console.error("[Search] Error details:", errorData);
          alert(`Search error: ${errorData.error || "Unknown error"}`);
        } catch {
          alert(`Search error: HTTP ${res.status}`);
        }
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      setResults(data.results ?? []);
      setFromCache(data.fromCache ?? false);
      setCachedAt(data.cachedAt ?? null);
      setTotal(data.total ?? data.results?.length ?? 0);
      setSearched(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    // Check if user has export feature
    if (!isPro) {
      alert("CSV export is only available for Pro users. Upgrade your plan to unlock this feature!");
      return;
    }

    try {
      const exportData = results;
      const headers = ["Title", "Creator", "Category", "Type", "Downloads", "Trend", "Revenue", "Upload Date"];
      const rows = exportData.map((a) => [
        `"${a.title}"`,
        `"${a.creator}"`,
        `"${a.category}"`,
        a.type,
        a.downloads,
        a.trend,
        `"${a.revenue}"`,
        `"${a.uploadDate ?? "-"}"`,
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trackstock-${query}-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      console.log("[Dashboard] CSV exported successfully");
    } catch (error) {
      console.error("[Dashboard] CSV export error:", error);
      alert("Failed to export CSV. Please try again.");
    }
  };

  return (
    <>
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onSuccess={handleUpgradeSuccess}
        />
      )}
      
      {showQuotaModal && quotaData && (
        <QuotaExceededModal
          isOpen={showQuotaModal}
          searchesUsed={quotaData.searchesUsed || 0}
          limit={quotaData.limit || 0}
          resetInMinutes={quotaData.resetInMinutes || 0}
          onClose={() => {
            setShowQuotaModal(false);
            setQuotaData(null);
          }}
        />
      )}

      <main className="min-h-screen bg-white text-gray-900">
        <Navbar
          isPro={isPro}
          planLoading={planLoading}
          onUpgradeClick={() => setShowPayment(true)}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <SearchBar
            query={query}
            loading={loading}
            onChange={setQuery}
            onSearch={handleSearch}
          />

          {!searched && <DashboardHome />}

          {searched && (
            <div>
              <SearchCharts results={results} query={query} />
              <KeywordStats results={results} query={query} total={total} />
              <ResultsSection
                results={results}
                query={query}
                isPro={isPro}
                fromCache={fromCache}
                cachedAt={cachedAt}
                total={total}
                onUpgradeClick={() => setShowPayment(true)}
                onExportCSV={handleExportCSV}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}