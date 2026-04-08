import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { RefreshCw } from "lucide-react";
import { apiGetImpactStats, type ImpactStats } from "@/utils/api";

const COLORS = [
  "hsl(213,30%,16%)",
  "hsl(43,52%,55%)",
  "hsl(213,20%,28%)",
  "hsl(43,45%,72%)",
  "hsl(30,8%,62%)",
];

const TOOLTIP_STYLE = {
  border: "1px solid hsl(40,15%,87%)",
  background: "hsl(40,33%,97%)",
  fontSize: 13,
};

const Impact = () => {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await apiGetImpactStats(isRefresh);
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const reintegrationRate = stats
    ? Math.round((stats.reintegrationProgressCount / stats.totalResidents) * 100)
    : 0;

  const summaryCards = stats
    ? [
        { label: "Children Currently in Care", value: stats.activeResidents.toString() },
        {
          label: "Total Contributions",
          value: `$${Math.round(stats.totalContributionsValue).toLocaleString()}`,
        },
        {
          label: "Reintegration Rate",
          value: `~${reintegrationRate}%`,
        },
        { label: "Active Supporters", value: stats.uniqueSuporters.toString() },
      ]
    : [];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="font-heading text-3xl font-semibold text-foreground">Our Impact</h1>
          <p className="text-muted-foreground mt-1">
            Aggregated, anonymized data showing how your contributions make a difference.
          </p>
        </div>

        {loading && (
          <div className="text-muted-foreground text-sm py-24 text-center">Loading stats…</div>
        )}

        {error && (
          <div className="text-destructive text-sm py-8 text-center">{error}</div>
        )}

        {!loading && !error && stats && (
          <>
            {/* Summary Cards */}
            <div className="relative mb-14">
              <button
                onClick={() => fetchStats(true)}
                disabled={refreshing}
                className="absolute -top-8 right-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summaryCards.map((card) => (
                  <div key={card.label} className="border border-border p-5">
                    <div className="text-sm text-muted-foreground mb-2">{card.label}</div>
                    <div className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid md:grid-cols-2 gap-8 mb-14">
              {/* Residents by Year */}
              <div className="border border-border p-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
                  Children Admitted by Year
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.residentsByYear}>
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 12, fill: "hsl(213,12%,48%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "hsl(213,12%,48%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="hsl(43,52%,55%)" radius={[2, 2, 0, 0]} name="Children" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reintegration Breakdown */}
              <div className="border border-border p-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
                  Reintegration Progress
                </h3>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={220}>
                    <PieChart>
                      <Pie
                        data={stats.reintegrationBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="status"
                      >
                        {stats.reintegrationBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value: number, _: string, entry: { payload?: { status?: string } }) =>
                          [`${value} children`, entry.payload?.status ?? ""]
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {stats.reintegrationBreakdown.map((item, i) => (
                      <div key={item.status} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{item.status}</span>
                        <span className="font-medium text-foreground ml-auto">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid md:grid-cols-2 gap-8 mb-14">
              {/* Donation Breakdown */}
              <div className="border border-border p-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
                  Contributions by Type
                </h3>
                {(() => {
                  const OTHER_TYPES = ["Time", "Skills", "SocialMedia"];
                  const grouped = stats.donationBreakdown.reduce<{ type: string; totalValue: number }[]>(
                    (acc, item) => {
                      if (OTHER_TYPES.includes(item.type)) {
                        const other = acc.find((x) => x.type === "Other");
                        if (other) other.totalValue += item.totalValue;
                        else acc.push({ type: "Other", totalValue: item.totalValue });
                      } else {
                        acc.push(item);
                      }
                      return acc;
                    },
                    []
                  );
                  return (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={220}>
                        <PieChart>
                          <Pie
                            data={grouped}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="totalValue"
                            nameKey="type"
                          >
                            {grouped.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            formatter={(value: number, _: string, entry: { payload?: { type?: string } }) =>
                              [`$${Math.round(value).toLocaleString()}`, entry.payload?.type ?? ""]
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {grouped.map((item, i) => (
                          <div key={item.type} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-muted-foreground">{item.type}</span>
                            <span className="font-medium text-foreground ml-auto">
                              ${Math.round(item.totalValue).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Safe House Occupancy */}
              <div className="border border-border p-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
                  Safe House Occupancy
                </h3>
                <div className="space-y-5 mt-2">
                  {stats.safehouseOccupancy.map((sh) => {
                    const pct = sh.capacity > 0 ? Math.round((sh.occupancy / sh.capacity) * 100) : 0;
                    return (
                      <div key={sh.name}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-foreground">{sh.name}</span>
                          <span className="text-muted-foreground">
                            {sh.occupancy}/{sh.capacity} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-secondary">
                          <div
                            className="h-full bg-accent transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </>
        )}

        <p className="text-xs text-muted-foreground text-center">
          All data is aggregated and anonymized to protect the privacy and safety of the children in our care.
        </p>
      </div>
    </Layout>
  );
};

export default Impact;
