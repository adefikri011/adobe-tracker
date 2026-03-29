import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import EarningShell        from "@/components/admin/stats/earning/EarningShell";
import EarningChart        from "@/components/admin/stats/earning/EarningChart";
import EarningBreakdown    from "@/components/admin/stats/earning/EarningBreakdown";
import EarningTransactions from "@/components/admin/stats/earning/EarningTransactions";
import EarningByCategory   from "@/components/admin/stats/earning/EarningByCategory";

// ── Placeholder stats — replace with real DB / Adobe API queries ───────────
const summaryCards = [
  {
    key:        "total",
    label:      "Total Earnings",
    value:      "$12,480.00",
    change:     "+8.2%",
    up:         true,
    sub:        "All time",
  },
  {
    key:        "monthly",
    label:      "This Month",
    value:      "$2,340.00",
    change:     "+12.5%",
    up:         true,
    sub:        "vs last month",
  },
  {
    key:        "weekly",
    label:      "This Week",
    value:      "$580.00",
    change:     "-3.1%",
    up:         false,
    sub:        "vs last week",
  },
  {
    key:        "pending",
    label:      "Pending Payout",
    value:      "$940.00",
    change:     "Est. 3 days",
    up:         null,
    sub:        "Adobe processing",
  },
];

export default async function TotalEarningPage() {
  return (
    <EarningShell summaryCards={summaryCards}>
      {/* Chart */}
      <EarningChart />

      {/* Breakdown + Category side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <EarningBreakdown />
        <EarningByCategory />
      </div>

      {/* Transactions table */}
      <EarningTransactions />
    </EarningShell>
  );
}