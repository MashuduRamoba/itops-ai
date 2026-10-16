
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://itops-ai.onrender.com"
    : "http://127.0.0.1:8000")
).replace(/\/$/, "");

export type IncidentStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "Closed";

export type IncidentPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export interface Incident {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  ai_analysis: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIncidentData {
  title: string;
  description: string;
  category: string;
  priority: IncidentPriority;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      `Unable to connect to the backend at ${API_URL}. Check the backend URL, server status, and CORS settings.`
    );
  }

  if (!response.ok) {
    let message = `API error: ${response.status}`;

    try {
      const error: unknown = await response.json();

      if (
        typeof error === "object" &&
        error !== null &&
        "detail" in error &&
        typeof error.detail === "string"
      ) {
        message = error.detail;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function getHealth(): Promise<unknown> {
  return request<unknown>("/health");
}

export async function getIncidents(): Promise<Incident[]> {
  const data = await request<{ incidents: Incident[] }>(
    "/api/incidents"
  );

  return data.incidents;
}

export async function createIncident(
  incident: CreateIncidentData
): Promise<Incident> {
  return request<Incident>("/api/incidents", {
    method: "POST",
    body: JSON.stringify(incident),
  });
}

export async function updateIncident(
  id: number,
  status: IncidentStatus,
  priority: IncidentPriority
): Promise<Incident> {
  return request<Incident>(`/api/incidents/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, priority }),
  });
}

export async function analyseSavedIncident(
  id: number
): Promise<{
  status: string;
  incident_id: number;
  answer: string;
}> {
  return request(`/api/incidents/${id}/analyse`, {
    method: "POST",
  });
}
