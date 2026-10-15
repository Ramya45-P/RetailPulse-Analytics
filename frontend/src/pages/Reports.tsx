
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  createReportSchedule,
  deleteReportSchedule,
  downloadReport,
  generateReport,
  getReportHistory,
  getReportSchedules,
  updateReportSchedule,
} from "../api/reportingApi";

import type {
  CreateScheduleRequest,
  ReportRecord,
  ReportSchedule,
} from "../api/reportingApi";

const reportTypes = [
  { value: "sales", label: "Sales Report" },
  { value: "inventory", label: "Inventory Report" },
  { value: "customers", label: "Customer Report" },
  {
    value: "product_performance",
    label: "Product Performance Report",
  },
  { value: "stock_movement", label: "Stock Movement Report" },
];

const exportFormats = ["CSV", "JSON", "PDF"] as const;

const historyLimit = 20;

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function formatReportType(value: string): string {
  return (
    reportTypes.find((type) => type.value === value)?.label ??
    value.replaceAll("_", " ")
  );
}

export default function Reports() {
  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [productId, setProductId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productSku, setProductSku] = useState("");
  const [brand, setBrand] = useState("");

  const [exportFormat, setExportFormat] =
    useState<"CSV" | "JSON" | "PDF">("CSV");

  const [history, setHistory] = useState<ReportRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [scheduleName, setScheduleName] = useState("");
  const [scheduleReportType, setScheduleReportType] = useState("sales");
  const [scheduleFrequency, setScheduleFrequency] = useState("daily");
  const [scheduleExecutionTime, setScheduleExecutionTime] =
    useState("09:00");
  const [scheduleRecipients, setScheduleRecipients] = useState("");
  const [scheduleFormat, setScheduleFormat] =
    useState<"CSV" | "JSON" | "PDF">("CSV");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [historyResponse, schedulesResponse] = await Promise.all([
        getReportHistory(historyPage, historyLimit),
        getReportSchedules(),
      ]);

      setHistory(historyResponse.reports ?? []);
      setHistoryTotal(Number(historyResponse.total ?? 0));
      setSchedules(
        Array.isArray(schedulesResponse)
          ? schedulesResponse
          : schedulesResponse.schedules ?? [],
      );
    } catch (err: unknown) {
      console.error("Unable to load reports:", err);
      setError("Unable to load reports. Please check your login and backend.");
    } finally {
      setLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleGenerateReport = async () => {
    setError("");
    setSuccess("");

    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after the end date.");
      return;
    }

    if (
      reportType === "product_performance" &&
      ((productId && (!Number.isInteger(Number(productId)) || Number(productId) <= 0)) ||
        (categoryId &&
          (!Number.isInteger(Number(categoryId)) || Number(categoryId) <= 0)))
    ) {
      setError("Product ID and Category ID must be positive integers.");
      return;
    }

    const filters: Record<string, unknown> = {};

    if (reportType === "product_performance") {
      if (productId.trim()) filters.product_id = Number(productId);
      if (categoryId.trim()) filters.category_id = Number(categoryId);
      if (productSku.trim()) filters.sku = productSku.trim();
      if (brand.trim()) filters.brand = brand.trim();
    }

    setGenerating(true);

    try {
      const response = await generateReport({
        report_type: reportType,
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
        filters,
        export_format: exportFormat,
      });

      setSuccess(
        response.message ??
          `${formatReportType(reportType)} generated successfully.`,
      );

      // Return to page one so the newly generated report is visible.
      if (historyPage !== 1) {
        setHistoryPage(1);
      } else {
        await loadData();
      }

      if (response.report_id) {
        setDownloadingId(response.report_id);

        try {
          await downloadReport(response.report_id, exportFormat);
        } finally {
          setDownloadingId(null);
        }
      }
    } catch (err: unknown) {
      console.error("Report generation failed:", err);
      setError("Failed to generate the report. Check the selected filters and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (
    reportId: number,
    format: "CSV" | "JSON" | "PDF",
  ) => {
    setError("");
    setSuccess("");
    setDownloadingId(reportId);

    try {
      await downloadReport(reportId, format);
      setSuccess(`Report ${reportId} downloaded successfully.`);
    } catch (err: unknown) {
      console.error("Report download failed:", err);
      setError(`Unable to download report ${reportId}.`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCreateSchedule = async () => {
    setError("");
    setSuccess("");

    if (!scheduleName.trim()) {
      setError("Please enter a schedule name.");
      return;
    }

    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(scheduleExecutionTime)) {
      setError("Execution time must use HH:MM format.");
      return;
    }

    const recipients = scheduleRecipients
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    const invalidEmail = recipients.find(
      (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    );

    if (invalidEmail) {
      setError(`Invalid email address: ${invalidEmail}`);
      return;
    }

    const payload: CreateScheduleRequest = {
      name: scheduleName.trim(),
      report_type: scheduleReportType,
      report_filters: {},
      frequency: scheduleFrequency,
      execution_time: scheduleExecutionTime,
      recipients,
      export_format: scheduleFormat,
      is_active: true,
    };

    setSavingSchedule(true);

    try {
      await createReportSchedule(payload);

      setSuccess("Scheduled report created successfully.");
      setScheduleName("");
      setScheduleRecipients("");

      await loadData();
    } catch (err: unknown) {
      console.error("Schedule creation failed:", err);
      setError("Failed to create the scheduled report.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleToggleSchedule = async (schedule: ReportSchedule) => {
    setError("");
    setSuccess("");

    try {
      await updateReportSchedule(schedule.id, {
        is_active: !schedule.is_active,
      });

      setSuccess(
        `Schedule "${schedule.name}" ${
          schedule.is_active ? "deactivated" : "activated"
        } successfully.`,
      );

      await loadData();
    } catch (err: unknown) {
      console.error("Schedule update failed:", err);
      setError(`Unable to update schedule "${schedule.name}".`);
    }
  };

  const handleDeleteSchedule = async (schedule: ReportSchedule) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the schedule "${schedule.name}"?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteReportSchedule(schedule.id);
      setSuccess(`Schedule "${schedule.name}" deleted successfully.`);
      await loadData();
    } catch (err: unknown) {
      console.error("Schedule deletion failed:", err);
      setError(`Unable to delete schedule "${schedule.name}".`);
    }
  };

  const historyPageCount = Math.max(
    1,
    Math.ceil(historyTotal / historyLimit),
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Reports & Scheduled Reports
      </Typography>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{ mb: 2 }}
        >
          {success}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Generate Report
          </Typography>

          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="report-type-label">Report Type</InputLabel>
              <Select
                labelId="report-type-label"
                label="Report Type"
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
              >
                {reportTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>

            {reportType === "product_performance" && (
              <>
                <Divider />
                <Typography variant="subtitle1" fontWeight={600}>
                  Product Performance Filters
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Product ID"
                    type="number"
                    value={productId}
                    onChange={(event) => setProductId(event.target.value)}
                  />

                  <TextField
                    fullWidth
                    label="Category ID"
                    type="number"
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Product SKU"
                    value={productSku}
                    onChange={(event) => setProductSku(event.target.value)}
                  />

                  <TextField
                    fullWidth
                    label="Brand"
                    value={brand}
                    onChange={(event) => setBrand(event.target.value)}
                  />
                </Stack>
              </>
            )}

            <FormControl fullWidth>
              <InputLabel id="export-format-label">Export Format</InputLabel>
              <Select
                labelId="export-format-label"
                label="Export Format"
                value={exportFormat}
                onChange={(event) =>
                  setExportFormat(event.target.value as "CSV" | "JSON" | "PDF")
                }
              >
                {exportFormats.map((format) => (
                  <MenuItem key={format} value={format}>
                    {format}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={generating || loading}
              >
                {generating ? "Generating..." : "Generate Report"}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
            mb={2}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Report History
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total reports: {historyTotal}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              onClick={() => void loadData()}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Typography color="text.secondary" py={3}>
              No report history found.
            </Typography>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Report</TableCell>
                      <TableCell>Format</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Rows</TableCell>
                      <TableCell>Generated At</TableCell>
                      <TableCell>Download</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {history.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>{record.id}</TableCell>
                        <TableCell>
                          {record.report_name ||
                            formatReportType(record.report_type)}
                        </TableCell>
                        <TableCell>
                          {record.export_format.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={record.status}
                            color={
                              record.status.toUpperCase() === "SUCCESS"
                                ? "success"
                                : record.status.toUpperCase() === "FAILED"
                                  ? "error"
                                  : "default"
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          {record.row_count}
                        </TableCell>
                        <TableCell>
                          {formatDate(record.created_at)}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {exportFormats.map((format) => (
                              <Button
                                key={format}
                                size="small"
                                onClick={() =>
                                  void handleDownload(record.id, format)
                                }
                                disabled={downloadingId === record.id}
                              >
                                {format}
                              </Button>
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {historyTotal > historyLimit && (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={1}
                  mt={3}
                >
                  <Pagination
                    count={historyPageCount}
                    page={historyPage}
                    onChange={(_, page) => setHistoryPage(page)}
                    color="primary"
                    disabled={loading}
                  />

                  <Typography variant="caption" color="text.secondary">
                    Showing {(historyPage - 1) * historyLimit + 1}–
                    {Math.min(historyPage * historyLimit, historyTotal)} of{" "}
                    {historyTotal} reports
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Create Scheduled Report
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Schedule Name"
              value={scheduleName}
              onChange={(event) => setScheduleName(event.target.value)}
              required
            />

            <FormControl fullWidth>
              <InputLabel id="schedule-report-type-label">
                Report Type
              </InputLabel>
              <Select
                labelId="schedule-report-type-label"
                label="Report Type"
                value={scheduleReportType}
                onChange={(event) =>
                  setScheduleReportType(event.target.value)
                }
              >
                {reportTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="schedule-frequency-label">
                  Frequency
                </InputLabel>
                <Select
                  labelId="schedule-frequency-label"
                  label="Frequency"
                  value={scheduleFrequency}
                  onChange={(event) =>
                    setScheduleFrequency(event.target.value)
                  }
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Execution Time"
                type="time"
                value={scheduleExecutionTime}
                onChange={(event) =>
                  setScheduleExecutionTime(event.target.value)
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel id="schedule-format-label">
                Export Format
              </InputLabel>
              <Select
                labelId="schedule-format-label"
                label="Export Format"
                value={scheduleFormat}
                onChange={(event) =>
                  setScheduleFormat(event.target.value as "CSV" | "JSON" | "PDF")
                }
              >
                {exportFormats.map((format) => (
                  <MenuItem key={format} value={format}>
                    {format}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Recipients (comma-separated emails)"
              placeholder="user@example.com, admin@example.com"
              value={scheduleRecipients}
              onChange={(event) => setScheduleRecipients(event.target.value)}
              helperText="Optional. Separate multiple email addresses with commas."
            />

            <Box>
              <Button
                variant="contained"
                onClick={handleCreateSchedule}
                disabled={savingSchedule}
              >
                {savingSchedule ? "Creating..." : "Create Schedule"}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Scheduled Reports
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : schedules.length === 0 ? (
            <Typography color="text.secondary" py={2}>
              No scheduled reports found.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Report Type</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Run</TableCell>
                    <TableCell>Next Run</TableCell>
                    <TableCell>Last Result</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id} hover>
                      <TableCell>{schedule.id}</TableCell>
                      <TableCell>{schedule.name}</TableCell>
                      <TableCell>
                        {formatReportType(schedule.report_type)}
                      </TableCell>
                      <TableCell>{schedule.frequency}</TableCell>
                      <TableCell>{schedule.execution_time}</TableCell>
                      <TableCell>
                        {schedule.export_format.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={schedule.is_active ? "Active" : "Inactive"}
                          color={schedule.is_active ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(schedule.last_run_at)}
                      </TableCell>
                      <TableCell>
                        {formatDate(schedule.next_run_at)}
                      </TableCell>
                      <TableCell>
                        {schedule.last_status ? (
                          <Chip
                            size="small"
                            label={schedule.last_status}
                            color={
                              schedule.last_status.toUpperCase() === "SUCCESS"
                                ? "success"
                                : schedule.last_status.toUpperCase() === "FAILED"
                                  ? "error"
                                  : "default"
                            }
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            onClick={() => void handleToggleSchedule(schedule)}
                          >
                            {schedule.is_active ? "Deactivate" : "Activate"}
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            onClick={() => void handleDeleteSchedule(schedule)}
                          >
                            Delete
                          </Button>
                        </Stack>

                        {schedule.last_error && (
                          <Typography
                            variant="caption"
                            color="error"
                            display="block"
                            mt={1}
                          >
                            {schedule.last_error}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
