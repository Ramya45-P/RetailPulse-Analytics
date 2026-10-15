import api from "./axios";

export interface ReportRecord {
  id: number;
  report_name: string;
  report_type: string;
  report_filters?: Record<string, unknown>;
  export_format: string;
  status: string;
  row_count: number;
  created_at: string;
}

export interface ReportSchedule {
  id: number;
  name: string;
  report_type: string;
  report_filters: Record<string, unknown>;
  frequency: string;
  execution_time: string;
  recipients: string[];
  export_format: string;
  is_active: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  last_status?: string | null;
  last_error?: string | null;
}

export interface GenerateReportRequest {
  report_type: string;
  start_date?: string;
  end_date?: string;
  filters: Record<string, unknown>;
  export_format: "CSV" | "JSON" | "PDF";
}

export interface CreateScheduleRequest {
  name: string;
  report_type: string;
  report_filters: Record<string, unknown>;
  frequency: string;
  execution_time: string;
  recipients: string[];
  export_format: "CSV" | "JSON" | "PDF";
  is_active: boolean;
}

export async function generateReport(payload: GenerateReportRequest) {
  const response = await api.post("/reports/generate", payload);
  return response.data;
}

export async function getReportHistory(page = 1, limit = 20) {
  const response = await api.get("/reports/history", {
    params: { page, limit },
  });
  return response.data;
}

export async function downloadReport(
  reportId: number,
  format: "CSV" | "JSON" | "PDF"
) {
  const response = await api.get(
    `/reports/history/${reportId}/download`,
    {
      params: { format },
      responseType: "blob",
    }
  );

  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = `report_${reportId}.${format.toLowerCase()}`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
}

export async function getReportSchedules() {
  const response = await api.get("/reports/schedules");
  return response.data;
}

export async function createReportSchedule(
  payload: CreateScheduleRequest
) {
  const response = await api.post("/reports/schedules", payload);
  return response.data;
}

export async function updateReportSchedule(
  scheduleId: number,
  payload: Partial<CreateScheduleRequest>
) {
  const response = await api.patch(
    `/reports/schedules/${scheduleId}`,
    payload
  );
  return response.data;
}

export async function deleteReportSchedule(scheduleId: number) {
  const response = await api.delete(
    `/reports/schedules/${scheduleId}`
  );
  return response.data;
}