"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];

interface Asset {
  title: string;
  downloads: number;
  type: string;
}

interface SearchChartsProps {
  results: Asset[];
  query: string;
}

export function SearchCharts({ results, query }: SearchChartsProps) {
  const typeBreakdown = results.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeBreakdown).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {/* Bar chart */}
      <div className="sm:col-span-2 bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <h3 className="font-semibold mb-1 text-gray-800">Downloads by Asset</h3>
        <p className="text-gray-400 text-xs mb-4">Top results for &ldquo;{query}&rdquo;</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={results.slice(0, 8).map((a) => ({
              name: a.title.split(" ").slice(0, 2).join(" "),
              downloads: a.downloads,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
            <XAxis
              dataKey="name"
              stroke="#cbd5e1"
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#cbd5e1"
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                color: "#1e293b",
                fontSize: 12,
              }}
              cursor={{ fill: "#fff7ed" }}
            />
            <Bar dataKey="downloads" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <h3 className="font-semibold mb-1 text-gray-800">Type Breakdown</h3>
        <p className="text-gray-400 text-xs mb-4">Photo / Vector / Video</p>
        {pieData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    color: "#1e293b",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-500">{d.name}</span>
                  </div>
                  <span className="text-gray-400">{d.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-gray-300 text-xs text-center pt-8">No data</div>
        )}
      </div>
    </div>
  );
}