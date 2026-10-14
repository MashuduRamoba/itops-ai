
"use client";

import { useState } from "react";
import type { Incident } from "@/lib/api";

interface Props {
  incident: Incident;
}

export default function ServiceNowReport({ incident }: Props) {
  const [actions, setActions] = useState("");
  const [resolved, setResolved] = useState(false);
  const [copied, setCopied] = useState(false);

  const ticketId = `INC${String(incident.id).padStart(6, "0")}`;

  const report = [
    "ITOPS AI - SERVICENOW INCIDENT REPORT",
    "",
    `Internal Reference: ${ticketId}`,
    `Title: ${incident.title}`,
    `Category: ${incident.category}`,
    `Priority: ${incident.priority}`,
    `Status: ${incident.status}`,
    "",
    "INCIDENT DESCRIPTION",
    incident.description,
    "",
    "AI TROUBLESHOOTING GUIDANCE",
    incident.ai_analysis || "No AI analysis available.",
    "",
    "TECHNICIAN ACTIONS",
    actions.trim() || "No actions recorded.",
    "",
    "RESOLUTION VERIFICATION",
    resolved
      ? "Technician confirmed the issue is resolved."
      : "Resolution has not been confirmed.",
    "",
    "NEXT STEPS",
    resolved
      ? "Complete documentation and follow the ticket closure process."
      : "Continue troubleshooting and verify the outcome with the user.",
    "",
    "NOTE: AI recommendations require technician verification.",
  ].join("\n");

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
    } catch {
      setCopied(false);
      alert("Unable to copy the report. Please copy it manually.");
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-[#111d32] p-6">
      <h3 className="text-xl font-bold text-white">
        ServiceNow Resolution Report
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        Generate a structured ServiceNow ticket update from
        your saved incident and AI troubleshooting analysis.
      </p>

      <div className="mt-6">
        <label
          htmlFor="technician-actions"
          className="mb-2 block text-sm text-slate-300"
        >
          Actions Performed by Technician
        </label>

        <textarea
          id="technician-actions"
          value={actions}
          onChange={(event) => {
            setActions(event.target.value);
            setCopied(false);
          }}
          rows={5}
          placeholder="Describe the troubleshooting actions you performed..."
          className="w-full rounded-xl border border-white/10 bg-[#080e1c] px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
        />
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={resolved}
          onChange={(event) => {
            setResolved(event.target.checked);
            setCopied(false);
          }}
          className="mt-1"
        />
        I have verified that this incident is resolved.
      </label>

      <div className="mt-6 rounded-xl border border-white/10 bg-[#080e1c] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h4 className="font-semibold text-cyan-300">
            Report Preview
          </h4>

          <button
            type="button"
            onClick={() => void copyReport()}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            {copied ? "Copied!" : "Copy Report"}
          </button>
        </div>

        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-300">
          {report}
        </pre>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        This report is for manual use in ServiceNow. It does
        not automatically update or close a ticket.
      </p>
    </section>
  );
}
