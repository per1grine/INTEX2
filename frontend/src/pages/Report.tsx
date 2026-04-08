import { useCallback, useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import { RefreshCw, ChevronDown, ChevronUp, CheckCircle, Loader2, Clock } from "lucide-react";
import { useAuth } from "@/state/auth";
import { useMlRefresh } from "@/state/mlRefresh";
import { apiGetMlPredictions, type MlPrediction, type MlPredictionsResponse } from "@/utils/api";

// ── Domain config ─────────────────────────────────────────────────────────────

const DOMAINS = [
  {
    key: "donor-acquisition",
    label: "Donor Acquisition",
    summaryDomainKey: "donor",
    predictionNotebook: "donor-acquisition-prediction",
    explanatoryNotebook: "donor-acquisition-explanatory",
    scoreLabel: "Acquisition probability",
    tierLabel: "Risk tier",
  },
  {
    key: "donor-churn",
    label: "Donor Churn",
    summaryDomainKey: "donor-churn",
    predictionNotebook: "donor-churn-prediction",
    explanatoryNotebook: "donor-churn-explanatory",
    scoreLabel: "Churn probability",
    tierLabel: "Risk tier",
  },
  {
    key: "incident",
    label: "Incident Risk",
    summaryDomainKey: "incident",
    predictionNotebook: "incident-prediction",
    explanatoryNotebook: "incident-explanatory",
    scoreLabel: "Severity probability",
    tierLabel: "Attention tier",
  },
  {
    key: "reintegration",
    label: "Reintegration Readiness",
    summaryDomainKey: "reintegration",
    predictionNotebook: "reintegration-prediction",
    explanatoryNotebook: "reintegration-explanatory",
    scoreLabel: "Readiness score",
    tierLabel: "Pathway",
  },
  {
    key: "social-media",
    label: "Social Media Impact",
    summaryDomainKey: "social-media",
    predictionNotebook: "social-media-prediction",
    explanatoryNotebook: "social-media-explanatory",
    scoreLabel: "Conversion probability",
    tierLabel: "Value tier",
  },
  {
    key: "volunteer",
    label: "Volunteer",
    summaryDomainKey: "volunteer",
    predictionNotebook: "volunteer-prediction",
    explanatoryNotebook: "volunteer-explanatory",
    scoreLabel: "Growth potential",
    tierLabel: "Status",
  },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

// During a refresh cycle, notebooks not yet reached should show clock even if
// they were "complete" from a prior run. Only show complete/running for the
// current run state.
function notebookStatusIcon(status: string, isRefreshing: boolean, hasRun: boolean) {
  if (status === "running") return <Loader2 size={14} className="text-amber-500 animate-spin" />;
  if (status === "complete" && (!isRefreshing || hasRun)) return <CheckCircle size={14} className="text-green-600" />;
  return <Clock size={14} className="text-muted-foreground" />;
}

function tierColor(tier: string | null) {
  if (!tier) return "";
  const t = tier.toLowerCase();
  if (t.includes("high") || t.includes("red") || t.includes("critical")) return "text-red-600 font-semibold";
  if (t.includes("medium") || t.includes("amber") || t.includes("moderate")) return "text-amber-600 font-semibold";
  if (t.includes("low") || t.includes("green")) return "text-green-600 font-semibold";
  return "text-foreground";
}

// ── Predictions table ─────────────────────────────────────────────────────────

type PredictionsTableProps = {
  notebook: string;
  scoreLabel: string;
  tierLabel: string;
  token: string;
  modal?: boolean;
  refreshKey: number;
};

function PredictionsTable({ notebook, scoreLabel, tierLabel, token, modal = false, refreshKey }: PredictionsTableProps) {
  const [data, setData] = useState<MlPredictionsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = modal ? 9999 : 10;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetMlPredictions(token, notebook, p, pageSize, modal);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, notebook, pageSize, modal]);

  // Reload when refreshKey increments (notebook completed) or page changes
  useEffect(() => { void load(page); }, [page, load, refreshKey]);

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground"><Loader2 size={16} className="inline animate-spin mr-2" />Loading predictions…</div>;
  if (error)   return <div className="py-8 text-center text-sm text-red-500">{error}</div>;
  if (!data || data.records.length === 0) return <div className="py-8 text-center text-sm text-muted-foreground">No predictions yet — run a refresh to generate scores.</div>;

  const totalPages = Math.ceil(data.totalCount / pageSize);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Record</th>
              <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Type</th>
              <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{scoreLabel}</th>
              <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{tierLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.records.map((r: MlPrediction) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                <td className="py-2.5 px-3 font-medium text-foreground">{r.label}</td>
                <td className="py-2.5 px-3 text-muted-foreground capitalize">{r.recordType}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {r.score != null ? (r.score > 1 ? r.score.toFixed(1) : `${(r.score * 100).toFixed(1)}%`) : "—"}
                </td>
                <td className={`py-2.5 px-3 ${tierColor(r.tier)}`}>{r.tier ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!modal && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            {data.totalCount} total · page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── View All Modal ────────────────────────────────────────────────────────────

type ViewAllModalProps = {
  notebook: string;
  label: string;
  scoreLabel: string;
  tierLabel: string;
  token: string;
  onClose: () => void;
  refreshKey: number;
};

function ViewAllModal({ notebook, label, scoreLabel, tierLabel, token, onClose, refreshKey }: ViewAllModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-background border border-border p-8 mt-4 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-semibold text-foreground">{label} — All Records</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1">
            Close
          </button>
        </div>
        <PredictionsTable notebook={notebook} scoreLabel={scoreLabel} tierLabel={tierLabel} token={token} modal refreshKey={refreshKey} />
      </div>
    </div>
  );
}

// ── Domain accordion ──────────────────────────────────────────────────────────

type DomainAccordionProps = {
  domain: typeof DOMAINS[number];
  token: string;
  notebookStatuses: Record<string, string>;
  completedThisRun: Set<string>;
  pendingAtCycleStart: Set<string>;
  isRefreshing: boolean;
  summary: string | null;
  predRefreshKey: number;
};

function DomainAccordion({ domain, token, notebookStatuses, completedThisRun, pendingAtCycleStart, isRefreshing, summary, predRefreshKey }: DomainAccordionProps) {
  const [open, setOpen] = useState(false);
  const [viewAll, setViewAll] = useState<string | null>(null);

  const predStatus = notebookStatuses[domain.predictionNotebook] ?? "idle";
  const explStatus = notebookStatuses[domain.explanatoryNotebook] ?? "idle";

  // A notebook shows a clock if it was pending (not complete) when the cycle started
  // AND hasn't completed yet this cycle. Notebooks already complete at cycle start keep checkmarks.
  const explPending = isRefreshing && pendingAtCycleStart.has(domain.explanatoryNotebook);
  const explHasRun = !explPending || completedThisRun.has(domain.explanatoryNotebook);
  const predPending = isRefreshing && pendingAtCycleStart.has(domain.predictionNotebook);
  const predHasRun = !predPending || completedThisRun.has(domain.predictionNotebook);

  return (
    <>
      {viewAll && (
        <ViewAllModal
          notebook={viewAll}
          label={domain.label}
          scoreLabel={domain.scoreLabel}
          tierLabel={domain.tierLabel}
          token={token}
          onClose={() => setViewAll(null)}
          refreshKey={predRefreshKey}
        />
      )}

      <div className="border border-border">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="font-heading font-semibold text-foreground">{domain.label}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {notebookStatusIcon(explStatus, isRefreshing, explHasRun)} Analysis
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {notebookStatusIcon(predStatus, isRefreshing, predHasRun)} Prediction
              </span>
            </div>
          </div>
          {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>

        {open && (
          <div className="px-6 pb-6 border-t border-border pt-5">
            {/* Analysis summary — from last completed explanatory run */}
            {summary && (
              <div className="bg-secondary/30 border border-border p-4 mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Analysis Summary</p>
                <p className="text-sm text-foreground leading-relaxed">{summary}</p>
              </div>
            )}

            {/* Prediction records */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Prediction Records — sorted by urgency
              </p>
              <button
                onClick={() => setViewAll(domain.predictionNotebook)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1"
              >
                View all
              </button>
            </div>

            <PredictionsTable
              notebook={domain.predictionNotebook}
              scoreLabel={domain.scoreLabel}
              tierLabel={domain.tierLabel}
              token={token}
              refreshKey={predRefreshKey}
            />
          </div>
        )}
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { token } = useAuth();
  const { status, summaries, isRefreshing, startRefresh, startRetrain, error } = useMlRefresh();

  // Snapshot of statuses at the moment a refresh cycle started.
  // Notebooks that were NOT complete at cycle start must complete this cycle before showing checkmark.
  const [pendingAtCycleStart, setPendingAtCycleStart] = useState<Set<string>>(new Set());
  // Notebooks that completed during this cycle.
  const [completedThisRun, setCompletedThisRun] = useState<Set<string>>(new Set());
  const prevStatusRef = useRef<Record<string, string>>({});

  // Per-notebook refresh keys: increment when that notebook transitions to complete.
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});

  const notebookStatuses: Record<string, string> = {};
  status?.notebooks.forEach(n => { notebookStatuses[n.notebook] = n.status; });

  // When a refresh cycle starts, snapshot which notebooks are not yet complete.
  const prevRefreshingRef = useRef(false);
  useEffect(() => {
    if (isRefreshing && !prevRefreshingRef.current) {
      // Snapshot all notebooks that are not currently complete — they need to run this cycle.
      const pending = new Set(
        Object.entries(notebookStatuses)
          .filter(([, st]) => st !== "complete")
          .map(([nb]) => nb)
      );
      // Also treat ALL notebooks as pending if we have no status yet (backend just started).
      if (Object.keys(notebookStatuses).length === 0) {
        DOMAINS.forEach(d => {
          pending.add(d.predictionNotebook);
          pending.add(d.explanatoryNotebook);
        });
      }
      setPendingAtCycleStart(pending);
      setCompletedThisRun(new Set());
    }
    prevRefreshingRef.current = isRefreshing;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRefreshing]);

  // Watch for notebooks completing; update completedThisRun and refreshKeys.
  useEffect(() => {
    const prev = prevStatusRef.current;
    const newlyCompleted: string[] = [];
    for (const [nb, st] of Object.entries(notebookStatuses)) {
      if (st === "complete" && prev[nb] !== "complete") newlyCompleted.push(nb);
    }
    if (newlyCompleted.length > 0) {
      setCompletedThisRun(s => {
        const next = new Set(s);
        newlyCompleted.forEach(nb => next.add(nb));
        return next;
      });
      setRefreshKeys(k => {
        const next = { ...k };
        newlyCompleted.forEach(nb => { next[nb] = (next[nb] ?? 0) + 1; });
        return next;
      });
    }
    prevStatusRef.current = { ...notebookStatuses };
  });

  const lastUpdated = status?.notebooks
    .map(n => n.completedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <Layout>
      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl">

          {/* Header */}
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Operations Dashboard
              </p>
              <h1 className="mt-3 font-heading text-4xl font-semibold text-foreground">
                ML Insights & Predictions
              </h1>
              <p className="mt-2 text-muted-foreground">
                Machine learning analysis across all program areas. Scores update each time you refresh.
              </p>
              {lastUpdated && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => void startRefresh()}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                  {isRefreshing ? "Running…" : "Refresh predictions"}
                </button>
                <button
                  onClick={() => void startRetrain()}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Full retrain
                </button>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </div>

          {/* Domain accordions */}
          <div className="space-y-3">
            {DOMAINS.map(domain => (
              <DomainAccordion
                key={domain.key}
                domain={domain}
                token={token ?? ""}
                notebookStatuses={notebookStatuses}
                completedThisRun={completedThisRun}
                pendingAtCycleStart={pendingAtCycleStart}
                isRefreshing={isRefreshing}
                summary={summaries[domain.summaryDomainKey] ?? null}
                predRefreshKey={refreshKeys[domain.predictionNotebook] ?? 0}
              />
            ))}
          </div>

        </div>
      </section>
    </Layout>
  );
};

export default AdminDashboard;
