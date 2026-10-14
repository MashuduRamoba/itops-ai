
"use client";

import { useCallback, useEffect, useState } from "react";
import IncidentManager from "./IncidentManager";
import { getIncidents, type Incident } from "@/lib/api";

const API_URL = "http://127.0.0.1:8000";

type Page = "dashboard" | "analysis" | "incidents" | "settings";

type IconName =
  | "dashboard"
  | "brain"
  | "ticket"
  | "settings"
  | "arrow"
  | "server"
  | "check"
  | "activity";

const examples = [
  {
    label: "SharePoint Access",
    description:
      "A user cannot access a SharePoint Online site after migration. The user receives an Access Denied error. Provide possible causes, troubleshooting steps, and a professional ServiceNow ticket update.",
  },
  {
    label: "Microsoft Teams",
    description:
      "A user cannot see a Microsoft Teams channel despite being a member of the team. Provide possible causes and troubleshooting steps.",
  },
  {
    label: "MFA Reset",
    description:
      "A user changed phones and cannot complete Microsoft Authenticator sign-in. Explain the safe identity verification and escalation process.",
  },
  {
    label: "Power Platform",
    description:
      "A user cannot edit fields in a Power Apps form. Buttons are working, but the fields are read-only. Provide troubleshooting steps.",
  },
];

const navigation: {
  id: Page;
  label: string;
  icon: IconName;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "analysis", label: "AI Analysis", icon: "brain" },
  { id: "incidents", label: "Incidents", icon: "ticket" },
  { id: "settings", label: "Settings", icon: "settings" },
];

function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    brain: (
      <>
        <path d="M12 18V5a3 3 0 0 0-5.7-1.3A4 4 0 0 0 4 10a4 4 0 0 0 1 7.6A3.5 3.5 0 0 0 12 18Z" />
        <path d="M12 18V5a3 3 0 0 1 5.7-1.3A4 4 0 0 1 20 10a4 4 0 0 1-1 7.6A3.5 3.5 0 0 1 12 18Z" />
        <path d="M8 9l2 2M16 9l-2 2M12 14v5" />
      </>
    ),
    ticket: (
      <>
        <path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z" />
        <path d="M12 5v14" strokeDasharray="2 2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    server: (
      <>
        <rect x="3" y="3" width="18" height="8" rx="2" />
        <rect x="3" y="13" width="18" height="8" rx="2" />
        <path d="M7 7h.01M7 17h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    activity: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Critical: "bg-red-500/10 text-red-300",
    High: "bg-orange-500/10 text-orange-300",
    Medium: "bg-yellow-500/10 text-yellow-300",
    Low: "bg-slate-700 text-slate-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${
        colors[priority] ?? colors.Low
      }`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Open: "bg-blue-500/10 text-blue-300",
    "In Progress": "bg-yellow-500/10 text-yellow-300",
    Resolved: "bg-emerald-500/10 text-emerald-300",
    Closed: "bg-slate-700 text-slate-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${
        colors[status] ?? "bg-slate-700 text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}

export default function Home() {
  const [page, setPage] = useState<Page>("dashboard");

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [incidentsError, setIncidentsError] = useState("");

  const [backendOnline, setBackendOnline] = useState(false);

  const [description, setDescription] = useState("");
  const [answer, setAnswer] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const refreshIncidents = useCallback(async () => {
    try {
      const data = await getIncidents();
      setIncidents(data);
      setIncidentsError("");
    } catch (error) {
      setIncidentsError(
        error instanceof Error
          ? error.message
          : "Unable to load incidents."
      );
    } finally {
      setIncidentsLoading(false);
    }
  }, []);

  const checkBackend = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/health`, {
        cache: "no-store",
      });
      setBackendOnline(response.ok);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    void refreshIncidents();
    void checkBackend();
  }, [refreshIncidents, checkBackend]);

  function navigate(nextPage: Page) {
    setPage(nextPage);

    if (nextPage === "dashboard") {
      void refreshIncidents();
    }

    void checkBackend();
  }

  async function analyseIncident() {
    if (description.trim().length < 10) {
      setAnalysisError(
        "Please enter an incident description of at least 10 characters."
      );
      return;
    }

    setAnalysing(true);
    setAnalysisError("");
    setAnswer("");

    try {
      const response = await fetch(`${API_URL}/api/analyse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: HTTP ${response.status}`);
      }

      const data: { answer?: string } = await response.json();

      if (typeof data.answer !== "string") {
        throw new Error("Invalid response from the AI backend.");
      }

      setAnswer(data.answer);
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Unable to analyse incident."
      );
    } finally {
      setAnalysing(false);
    }
  }

  const total = incidents.length;
  const open = incidents.filter(
    (incident) => incident.status === "Open"
  ).length;
  const resolved = incidents.filter(
    (incident) =>
      incident.status === "Resolved" || incident.status === "Closed"
  ).length;
  const critical = incidents.filter(
    (incident) => incident.priority === "Critical"
  ).length;

  const stats = [
    {
      label: "Total Incidents",
      value: total,
      subtitle: "All saved incidents",
      color: "text-cyan-400",
    },
    {
      label: "Open Incidents",
      value: open,
      subtitle: "Awaiting action",
      color: "text-blue-400",
    },
    {
      label: "Resolved / Closed",
      value: resolved,
      subtitle: "Completed incidents",
      color: "text-emerald-400",
    },
    {
      label: "Critical Priority",
      value: critical,
      subtitle: "Requires attention",
      color: "text-red-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080e1c] text-slate-100 lg:flex">
      {/* SIDEBAR */}
      <aside className="border-b border-white/10 bg-[#0d1628] lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-6 py-7">
          <div className="rounded-xl bg-cyan-500 p-2 text-slate-950">
            <Icon name="brain" size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              ITOps <span className="text-cyan-400">AI</span>
            </h1>
            <p className="text-xs text-slate-500">
              IT Operations Platform
            </p>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:block lg:space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex min-w-fit items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition lg:w-full ${
                page === item.id
                  ? "bg-cyan-500/10 text-cyan-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden px-5 lg:absolute lg:bottom-7 lg:block lg:w-64">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold text-slate-300">
              AI ENGINE
            </p>
            <p className="mt-2 text-sm text-white">Llama 3.2 3B</p>
            <p className="mt-1 text-xs text-slate-500">
              Ollama • Local inference
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#0b1425] px-6 py-5 md:px-9">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              IT Operations / {page}
            </p>

            <h2 className="mt-1 text-xl font-semibold capitalize">
              {page === "analysis"
                ? "AI Incident Analysis"
                : page === "incidents"
                ? "Incident Management"
                : page}
            </h2>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 px-4 py-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                backendOnline ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            {backendOnline ? "Backend Online" : "Backend Offline"}
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-9">
          {/* DASHBOARD */}
          {page === "dashboard" && (
            <>
              <section>
                <p className="text-sm font-medium text-cyan-400">
                  Operations Overview
                </p>

                <h3 className="mt-2 text-3xl font-bold">
                  Welcome to ITOps AI
                </h3>

                <p className="mt-3 text-slate-400">
                  Monitor your saved incidents and use local AI to
                  accelerate IT troubleshooting.
                </p>
              </section>

              {incidentsError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                >
                  Unable to load incidents: {incidentsError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-[#111d32] p-6"
                  >
                    <p className="text-sm text-slate-400">
                      {stat.label}
                    </p>

                    <p
                      className={`mt-4 text-4xl font-bold ${stat.color}`}
                    >
                      {incidentsLoading || incidentsError
                        ? "—"
                        : stat.value}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      {stat.subtitle}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <section className="rounded-2xl border border-white/10 bg-[#111d32] p-6 xl:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-lg font-semibold">
                      Recent Incidents
                    </h4>

                    <button
                      onClick={() => navigate("incidents")}
                      className="text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      View All →
                    </button>
                  </div>

                  {incidentsLoading ? (
                    <p className="mt-6 text-sm text-slate-400">
                      Loading incidents...
                    </p>
                  ) : incidents.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">
                      <p className="text-slate-400">
                        No incidents found.
                      </p>

                      <button
                        onClick={() => navigate("incidents")}
                        className="mt-4 text-sm text-cyan-400"
                      >
                        Create your first incident →
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full min-w-[600px] text-left text-sm">
                        <thead className="border-b border-white/10 text-xs text-slate-500">
                          <tr>
                            <th className="pb-4">Incident</th>
                            <th className="pb-4">Category</th>
                            <th className="pb-4">Priority</th>
                            <th className="pb-4">Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {incidents.slice(0, 5).map((incident) => (
                            <tr
                              key={incident.id}
                              className="border-b border-white/5"
                            >
                              <td className="py-4 pr-4">
                                <span className="font-medium text-cyan-300">
                                  INC
                                  {String(incident.id).padStart(6, "0")}
                                </span>

                                <p className="mt-1 text-xs text-slate-400">
                                  {incident.title}
                                </p>
                              </td>

                              <td className="py-4 text-slate-300">
                                {incident.category}
                              </td>

                              <td className="py-4">
                                <PriorityBadge
                                  priority={incident.priority}
                                />
                              </td>

                              <td className="py-4">
                                <StatusBadge
                                  status={incident.status}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#111d32] p-6">
                  <h4 className="text-lg font-semibold">
                    AI Assistant
                  </h4>

                  <div className="mt-5 inline-flex rounded-xl bg-cyan-500/10 p-4 text-cyan-400">
                    <Icon name="brain" size={28} />
                  </div>

                  <h5 className="mt-5 text-xl font-semibold">
                    Troubleshoot smarter.
                  </h5>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Generate incident summaries, possible root causes,
                    troubleshooting instructions and ticket updates
                    using your local AI model.
                  </p>

                  <button
                    onClick={() => navigate("analysis")}
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                  >
                    Open AI Analysis
                    <Icon name="arrow" size={18} />
                  </button>
                </section>
              </div>
            </>
          )}

          {/* AI ANALYSIS */}
          {page === "analysis" && (
            <>
              <section>
                <p className="text-sm font-medium text-cyan-400">
                  Intelligent Troubleshooting
                </p>

                <h3 className="mt-2 text-3xl font-bold">
                  AI Incident Analysis
                </h3>

                <p className="mt-3 text-slate-400">
                  Describe an issue and receive AI-generated guidance
                  from your local Ollama model.
                </p>
              </section>

              <div className="grid gap-6 xl:grid-cols-3">
                <section className="rounded-2xl border border-white/10 bg-[#111d32] p-6 xl:col-span-2">
                  <label
                    htmlFor="description"
                    className="text-sm font-semibold"
                  >
                    Incident Description
                  </label>

                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    maxLength={10000}
                    rows={9}
                    placeholder="Describe the affected system, error message and troubleshooting already performed..."
                    className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-[#080e1c] p-5 text-sm leading-7 outline-none focus:border-cyan-500"
                  />

                  <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500">
                    <span>
                      Use sanitised incident descriptions only.
                    </span>
                    <span>{description.length}/10000</span>
                  </div>

                  <button
                    onClick={analyseIncident}
                    disabled={analysing}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-4 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {analysing
                      ? "Analysing with Ollama..."
                      : "Analyse Incident"}

                    {!analysing && <Icon name="arrow" size={18} />}
                  </button>

                  {analysisError && (
                    <p
                      role="alert"
                      className="mt-4 text-sm text-red-400"
                    >
                      {analysisError}
                    </p>
                  )}
                </section>

                <aside className="rounded-2xl border border-white/10 bg-[#111d32] p-6">
                  <h4 className="text-lg font-semibold">
                    Quick Templates
                  </h4>

                  <p className="mt-2 text-sm text-slate-400">
                    Choose an IT support scenario.
                  </p>

                  <div className="mt-6 space-y-3">
                    {examples.map((example) => (
                      <button
                        key={example.label}
                        onClick={() => {
                          setDescription(example.description);
                          setAnalysisError("");
                        }}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm hover:border-cyan-500"
                      >
                        {example.label}

                        <p className="mt-2 text-xs text-slate-500">
                          Use template →
                        </p>
                      </button>
                    ))}
                  </div>
                </aside>
              </div>

              <section className="rounded-2xl border border-white/10 bg-[#111d32] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold">
                    AI Analysis Results
                  </h4>

                  {answer && (
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(answer)
                      }
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs hover:bg-white/10"
                    >
                      Copy Results
                    </button>
                  )}
                </div>

                {analysing ? (
                  <p
                    role="status"
                    className="mt-6 animate-pulse text-cyan-300"
                  >
                    Ollama is analysing your incident...
                  </p>
                ) : answer ? (
                  <div className="mt-6 whitespace-pre-wrap break-words rounded-xl bg-[#080e1c] p-6 text-sm leading-8 text-slate-200">
                    {answer}
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-slate-500">
                    Your AI analysis will appear here.
                  </div>
                )}
              </section>
            </>
          )}

          {/* REAL INCIDENT MANAGEMENT */}
          {page === "incidents" && <IncidentManager />}

          {/* SETTINGS */}
          {page === "settings" && (
            <section className="rounded-2xl border border-white/10 bg-[#111d32] p-6">
              <h3 className="text-2xl font-bold">
                System Settings
              </h3>

              <p className="mt-3 text-slate-400">
                Current local development configuration.
              </p>

              <div className="mt-7 space-y-5 text-sm">
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-slate-400">
                    AI Provider
                  </span>
                  <span>Ollama</span>
                </div>

                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-slate-400">
                    AI Model
                  </span>
                  <span>Llama 3.2 3B</span>
                </div>

                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-slate-400">
                    Backend Status
                  </span>
                  <span
                    className={
                      backendOnline
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {backendOnline ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-slate-400">
                    Database
                  </span>
                  <span>SQLite</span>
                </div>

                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-slate-400">
                    Backend API
                  </span>
                  <span>localhost:8000</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">
                    Frontend
                  </span>
                  <span>Next.js 16</span>
                </div>
              </div>

              <button
                onClick={() => {
                  void checkBackend();
                  void refreshIncidents();
                }}
                className="mt-7 rounded-xl border border-white/10 px-5 py-3 text-sm hover:bg-white/10"
              >
                Refresh System Status
              </button>
            </section>
          )}

          <footer className="border-t border-white/10 pt-6 text-xs text-slate-500">
            ITOps AI v1.1 • Next.js + FastAPI + SQLite + Ollama
          </footer>
        </div>
      </main>
    </div>
  );
}
