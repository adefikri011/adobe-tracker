"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Navbar } from "./_components/Navbar";
import { SearchBar } from "./_components/SearchBar";
import { DashboardHome } from "./_components/DashboardHome";
import { StatsCards } from "./_components/StatsCards";
import { SearchCharts } from "./_components/SearchCharts";
import { ResultsSection } from "./_components/ResultsSection";
import { PaymentModal } from "./_components/PaymentModal";
import { Asset } from "./_components/ResultCard";

const SUSPEND_TEST_MINUTES = 5;

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Asset[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d) => {
        setIsPro(d.plan === "pro");
        setPlanLoading(false);
      })
      .catch(() => setPlanLoading(false));
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
          window.location.href = `/login?error=device_conflict&minutes=${SUSPEND_TEST_MINUTES}`;
          return;
        }

        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "suspended") {
          isRedirecting = true;
          const minutes = Number(data.minutesLeft ?? 1);
          const until = data.suspendedUntil ? `&until=${encodeURIComponent(data.suspendedUntil)}` : "";
          window.location.href = `/login?error=suspended&minutes=${minutes}${until}`;
          return;
        }

        if (data.status === "session_revoked") {
          isRedirecting = true;
          window.location.href = `/login?error=device_conflict&minutes=${SUSPEND_TEST_MINUTES}`;
        }
      } catch (error) {
        console.error("Session polling failed:", error);
      }
    };

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        checkSessionStatus();
      }
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
  }, [router]);

  const handleUpgradeSuccess = async () => {
    await fetch("/api/user/upgrade", { method: "POST" });
    setIsPro(true);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results);
      setFromCache(data.fromCache);
      setCachedAt(data.cachedAt ?? null);
      setSearched(true);
    } catch {
      console.error("Search failed");
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    const exportData = isPro ? results : results.slice(0, 6);
    const headers = ["Title", "Creator", "Category", "Type", "Downloads", "Trend", "Revenue"];
    const rows = exportData.map((a) => [
      `"${a.title}"`, `"${a.creator}"`, `"${a.category}"`,
      a.type, a.downloads, a.trend, `"${a.revenue}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trackstock-${query}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onSuccess={handleUpgradeSuccess}
        />
      )}

      <main className="min-h-screen bg-[#0a0a0a] text-white">
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
              <StatsCards results={results} query={query} />
              <SearchCharts results={results} query={query} />
              <ResultsSection
                results={results}
                query={query}
                isPro={isPro}
                fromCache={fromCache}
                cachedAt={cachedAt}
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