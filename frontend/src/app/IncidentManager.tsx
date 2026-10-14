
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  analyseSavedIncident,
  createIncident,
  getIncidents,
  updateIncident,
  type Incident,
  type IncidentPriority,
  type IncidentStatus,
} from "@/lib/api";

import ServiceNowReport from "./ServiceNowReport";

const priorities: IncidentPriority[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const statuses: IncidentStatus[] = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#080e1c] px-4 py-3 text-sm text-white outline-none focus:border-cyan-500";

const cardClass =
  "rounded-2xl border border-white/10 bg-[#111d32] p-6";

function formatId(id: number) {
  return `INC${String(id).padStart(6, "0")}`;
}

function PriorityBadge({
  priority,
}: {
  priority: IncidentPriority;
}) {
  const colors: Record<IncidentPriority, string> = {
    Low: "bg-slate-700 text-slate-200",
    Medium: "bg-yellow-500/10 text-yellow-300",
    High: "bg-orange-500/10 text-orange-300",
    Critical: "bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${colors[priority]}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: IncidentStatus;
}) {
  const colors: Record<IncidentStatus, string> = {
    Open: "bg-blue-500/10 text-blue-300",
    "In Progress": "bg-yellow-500/10 text-yellow-300",
    Resolved: "bg-emerald-500/10 text-emerald-300",
    Closed: "bg-slate-700 text-slate-200",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${colors[status]}`}
    >
      {status}
    </span>
  );
}

export default function IncidentManager() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [analysingId, setAnalysingId] = useState<
    number | null
  >(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Search and filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // New incident form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General IT");
  const [priority, setPriority] =
    useState<IncidentPriority>("Medium");

  const refresh = useCallback(async () => {
    try {
      const data = await getIncidents();

      setIncidents(data);

      setSelected((current) =>
        current
          ? data.find((item) => item.id === current.id) ??
            null
          : null
      );

      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load incidents."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setBusy(true);

    try {
      const incident = await createIncident({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });

      setTitle("");
      setDescription("");
      setCategory("General IT");
      setPriority("Medium");

      await refresh();

      setSelected(incident);

      setMessage(
        `${formatId(incident.id)} created successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create incident."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(
    incident: Incident,
    status: IncidentStatus,
    newPriority: IncidentPriority
  ) {
    setError("");
    setMessage("");
    setBusy(true);

    try {
      const updated = await updateIncident(
        incident.id,
        status,
        newPriority
      );

      await refresh();
      setSelected(updated);

      setMessage(
        `${formatId(incident.id)} updated successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update incident."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleAnalyse(incident: Incident) {
    setError("");
    setMessage("");
    setAnalysingId(incident.id);

    try {
      const result = await analyseSavedIncident(incident.id);

      await refresh();

      setSelected((current) =>
        current?.id === incident.id
          ? {
              ...current,
              ai_analysis: result.answer,
            }
          : current
      );

      setMessage(
        `AI analysis saved for ${formatId(incident.id)}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI analysis failed."
      );
    } finally {
      setAnalysingId(null);
    }
  }

  // Filter database records
  const filteredIncidents = incidents.filter((incident) => {
    const query = search.toLowerCase().trim();

    const matchesSearch =
      incident.title.toLowerCase().includes(query) ||
      incident.description.toLowerCase().includes(query) ||
      incident.category.toLowerCase().includes(query) ||
      formatId(incident.id).toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" ||
      incident.status === statusFilter;

    const matchesPriority =
      priorityFilter === "All" ||
      incident.priority === priorityFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority
    );
  });

  const total = incidents.length;

  const open = incidents.filter(
    (incident) => incident.status === "Open"
  ).length;

  const inProgress = incidents.filter(
    (incident) => incident.status === "In Progress"
  ).length;

  const resolved = incidents.filter(
    (incident) =>
      incident.status === "Resolved" ||
      incident.status === "Closed"
  ).length;

  const critical = incidents.filter(
    (incident) => incident.priority === "Critical"
  ).length;

  return (
    <div className="space-y-8">
      {/* PAGE HEADING */}
      <section>
        <p className="text-sm font-medium text-cyan-400">
          IT Service Management
        </p>

        <h3 className="mt-2 text-3xl font-bold text-white">
          Incident Operations
        </h3>

        <p className="mt-3 text-slate-400">
          Manage IT incidents, track progress, generate AI
          troubleshooting guidance and prepare ServiceNow
          resolution reports.
        </p>
      </section>

      {/* STATISTICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total Incidents", total],
          ["Open", open],
          ["In Progress", inProgress],
          ["Resolved / Closed", resolved],
          ["Critical", critical],
        ].map(([label, value]) => (
          <div key={label} className={cardClass}>
            <p className="text-sm text-slate-400">
              {label}
            </p>

            <p className="mt-4 text-3xl font-bold text-white">
              {loading ? "—" : value}
            </p>

            <p className="mt-3 text-xs text-slate-500">
              Live database records
            </p>
          </div>
        ))}
      </div>

      {/* NOTIFICATIONS */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          {message}
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-lg font-semibold text-white">
            Search & Filter Incidents
          </h4>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
              setPriorityFilter("All");
            }}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-300 hover:bg-white/10"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="incident-search"
              className="mb-2 block text-sm text-slate-300"
            >
              Search Incidents
            </label>

            <input
              id="incident-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search ID, title, category..."
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="mb-2 block text-sm text-slate-300"
            >
              Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className={inputClass}
            >
              <option value="All">All Statuses</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="priority-filter"
              className="mb-2 block text-sm text-slate-300"
            >
              Priority
            </label>

            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
              className={inputClass}
            >
              <option value="All">All Priorities</option>

              {priorities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Showing {filteredIncidents.length} of{" "}
          {incidents.length} incidents
        </p>
      </section>

      {/* INCIDENT LIST AND CREATE FORM */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* INCIDENT LIST */}
        <section className={`${cardClass} xl:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-lg font-semibold text-white">
              Saved Incidents
            </h4>

            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading || busy}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-6 text-slate-400">
              Loading incidents...
            </p>
          ) : filteredIncidents.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">
              <p className="text-slate-400">
                {incidents.length === 0
                  ? "No incidents yet. Create your first ticket."
                  : "No incidents match your search or filters."}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {filteredIncidents.map((incident) => (
                <button
                  key={incident.id}
                  type="button"
                  onClick={() => {
                    setSelected(incident);
                    setMessage("");
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selected?.id === incident.id
                      ? "border-cyan-500 bg-cyan-500/5"
                      : "border-white/10 hover:border-cyan-500/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-cyan-300">
                      {formatId(incident.id)}
                    </span>

                    <StatusBadge status={incident.status} />
                  </div>

                  <p className="mt-3 font-semibold text-white">
                    {incident.title}
                  </p>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                    {incident.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      {incident.category}
                    </span>

                    <PriorityBadge
                      priority={incident.priority}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* CREATE INCIDENT FORM */}
        <section className={cardClass}>
          <h4 className="text-lg font-semibold text-white">
            Create New Incident
          </h4>

          <p className="mt-2 text-sm text-slate-400">
            Register a new IT support ticket.
          </p>

          <form
            onSubmit={handleCreate}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="ticket-title"
                className="mb-2 block text-sm"
              >
                Incident Title
              </label>

              <input
                id="ticket-title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                minLength={3}
                maxLength={200}
                required
                className={inputClass}
                placeholder="e.g. SharePoint access denied"
              />
            </div>

            <div>
              <label
                htmlFor="ticket-description"
                className="mb-2 block text-sm"
              >
                Description
              </label>

              <textarea
                id="ticket-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                minLength={10}
                maxLength={10000}
                required
                rows={5}
                className={inputClass}
                placeholder="Describe the issue..."
              />
            </div>

            <div>
              <label
                htmlFor="ticket-category"
                className="mb-2 block text-sm"
              >
                Category
              </label>

              <select
                id="ticket-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className={inputClass}
              >
                {[
                  "General IT",
                  "SharePoint",
                  "Microsoft Teams",
                  "Entra ID",
                  "Power Platform",
                  "Network",
                  "Hardware",
                  "Other",
                ].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ticket-priority"
                className="mb-2 block text-sm"
              >
                Priority
              </label>

              <select
                id="ticket-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as IncidentPriority
                  )
                }
                className={inputClass}
              >
                {priorities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              {busy
                ? "Saving Incident..."
                : "+ Create Incident"}
            </button>
          </form>
        </section>
      </div>

      {/* SELECTED INCIDENT */}
      {selected && (
        <>
          <section className={cardClass}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-cyan-400">
                  {formatId(selected.id)}
                </p>

                <h4 className="mt-2 text-xl font-bold text-white">
                  {selected.title}
                </h4>

                <p className="mt-2 text-sm text-slate-400">
                  {selected.category}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                Close Details
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-[#080e1c] p-5">
              <h5 className="font-semibold text-white">
                Incident Description
              </h5>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                {selected.description}
              </p>
            </div>

            {/* STATUS AND PRIORITY */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-status"
                  className="mb-2 block text-sm"
                >
                  Incident Status
                </label>

                <select
                  id="edit-status"
                  value={selected.status}
                  disabled={busy || analysingId !== null}
                  onChange={(event) =>
                    void handleUpdate(
                      selected,
                      event.target.value as IncidentStatus,
                      selected.priority
                    )
                  }
                  className={inputClass}
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="edit-priority"
                  className="mb-2 block text-sm"
                >
                  Incident Priority
                </label>

                <select
                  id="edit-priority"
                  value={selected.priority}
                  disabled={busy || analysingId !== null}
                  onChange={(event) =>
                    void handleUpdate(
                      selected,
                      selected.status,
                      event.target.value as IncidentPriority
                    )
                  }
                  className={inputClass}
                >
                  {priorities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* OLLAMA AI ANALYSIS */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <h5 className="text-lg font-semibold text-white">
                AI Troubleshooting Assistant
              </h5>

              <p className="mt-2 text-sm text-slate-400">
                Generate troubleshooting guidance with
                Ollama and save it to this incident.
              </p>

              <button
                type="button"
                onClick={() =>
                  void handleAnalyse(selected)
                }
                disabled={analysingId !== null || busy}
                className="mt-5 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
              >
                {analysingId === selected.id
                  ? "Analysing with Ollama..."
                  : "Analyse & Save AI Results"}
              </button>

              {selected.ai_analysis && (
                <div className="mt-6 rounded-xl border border-white/10 bg-[#080e1c] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h6 className="font-semibold text-cyan-300">
                      Saved AI Analysis
                    </h6>

                    <button
                      type="button"
                      onClick={() =>
                        void navigator.clipboard.writeText(
                          selected.ai_analysis ?? ""
                        )
                      }
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs hover:bg-white/10"
                    >
                      Copy Analysis
                    </button>
                  </div>

                  <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                    {selected.ai_analysis}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SERVICENOW REPORT */}
          <ServiceNowReport
            key={selected.id}
            incident={selected}
          />
        </>
      )}
    </div>
  );
}
