import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";

interface AuditLog {
  id: number;
  action: string;
  resource_id: string | null;
  ip_address: string | null;
  before_values: any;
  status: string;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  company_id: number;
  resource_type: string;
  description: string | null;
  user_agent: string | null;
  after_values: any;
  created_at: string;
}

interface AuditLogsResponse {
  items: AuditLog[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  sort: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("newest");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Detail dialog
  const [selectedLog, setSelectedLog] =
    useState<AuditLog | null>(null);

  // ============================================================
  // FETCH AUDIT LOGS
  // ============================================================

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Authentication token not found.");
        return;
      }

      const params = new URLSearchParams();

      params.append("page", page.toString());
      params.append("limit", limit.toString());
      params.append("sort", sort);

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (action) {
        params.append("action", action);
      }

      if (resourceType) {
        params.append("resource_type", resourceType);
      }

      if (status) {
        params.append("status", status);
      }

      if (userId.trim()) {
        params.append("user_id", userId.trim());
      }

      if (startDate) {
        params.append("start_date", startDate);
      }

      if (endDate) {
        params.append("end_date", endDate);
      }

      const response = await fetch(
        `http://127.0.0.1:8000/audit-logs/?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch audit logs (${response.status})`
        );
      }

      const data: AuditLogsResponse =
        await response.json();

      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error("Audit logs error:", err);
      setError("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {
    fetchAuditLogs();

    const interval = setInterval(() => {
      fetchAuditLogs();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [
    page,
    limit,
    sort,
    action,
    resourceType,
    status,
    userId,
    startDate,
    endDate,
  ]);

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearch = () => {
    setPage(1);
    fetchAuditLogs();
  };

  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  const handleClearFilters = () => {
    setSearch("");
    setAction("");
    setResourceType("");
    setStatus("");
    setUserId("");
    setStartDate("");
    setEndDate("");
    setSort("newest");
    setPage(1);
  };

  // ============================================================
  // BUILD EXPORT PARAMETERS
  // ============================================================

  const buildExportParams = () => {
    const params = new URLSearchParams();

    params.append("sort", sort);

    if (search.trim()) {
      params.append("search", search.trim());
    }

    if (action) {
      params.append("action", action);
    }

    if (resourceType) {
      params.append("resource_type", resourceType);
    }

    if (status) {
      params.append("status", status);
    }

    if (userId.trim()) {
      params.append("user_id", userId.trim());
    }

    if (startDate) {
      params.append("start_date", startDate);
    }

    if (endDate) {
      params.append("end_date", endDate);
    }

    return params;
  };

  // ============================================================
  // EXPORT CSV / PDF
  // ============================================================

  const handleExport = async (
    type: "csv" | "pdf"
  ) => {
    try {
      setError("");

      const token =
        localStorage.getItem("access_token");

      if (!token) {
        setError(
          "Authentication token not found."
        );
        return;
      }

      const params = buildExportParams();

      const response = await fetch(
        `http://127.0.0.1:8000/audit-logs/export/${type}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Export failed (${response.status})`
        );
      }

      const blob = await response.blob();

      const downloadUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = downloadUrl;

      link.download =
        type === "csv"
          ? "audit_logs.csv"
          : "audit_logs.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        downloadUrl
      );
    } catch (err) {
      console.error(
        "Audit export error:",
        err
      );

      setError(
        `Failed to export audit logs as ${type.toUpperCase()}.`
      );
    }
  };

  // ============================================================
  // PAGINATION
  // ============================================================

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(
        (current) => current - 1
      );
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(
        (current) => current + 1
      );
    }
  };

  // ============================================================
  // STATUS COLOR
  // ============================================================

  const getStatusColor = (
    statusValue: string
  ):
    | "success"
    | "error"
    | "warning"
    | "default" => {
    if (statusValue === "SUCCESS") {
      return "success";
    }

    if (statusValue === "FAILED") {
      return "error";
    }

    if (statusValue === "WARNING") {
      return "warning";
    }

    return "default";
  };

  // ============================================================
  // FORMAT JSON
  // ============================================================

  const formatJson = (value: any) => {
    if (!value) {
      return "-";
    }

    return JSON.stringify(
      value,
      null,
      2
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <Box sx={{ p: 3 }}>

      {/* PAGE HEADER */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Audit Logs
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Monitor user activities and system changes.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAuditLogs}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* FILTERS */}

      <Paper
        sx={{
          p: 2,
          mt: 3,
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 2,
          }}
        >
          Filters
        </Typography>

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
          flexWrap="wrap"
          useFlexGap
        >
          <TextField
            label="Search"
            placeholder="Search audit logs..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            size="small"
            sx={{
              minWidth: 220,
            }}
          />

          <TextField
            select
            label="Action"
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
            size="small"
            sx={{
              minWidth: 150,
            }}
          >
            <MenuItem value="">
              All Actions
            </MenuItem>

            <MenuItem value="CREATE">
              CREATE
            </MenuItem>

            <MenuItem value="UPDATE">
              UPDATE
            </MenuItem>

            <MenuItem value="DELETE">
              DELETE
            </MenuItem>

            <MenuItem value="LOGIN">
              LOGIN
            </MenuItem>

            <MenuItem value="LOGOUT">
              LOGOUT
            </MenuItem>
          </TextField>

          <TextField
            select
            label="Resource"
            value={resourceType}
            onChange={(event) => {
              setResourceType(event.target.value);
              setPage(1);
            }}
            size="small"
            sx={{
              minWidth: 170,
            }}
          >
            <MenuItem value="">
              All Resources
            </MenuItem>

            <MenuItem value="PRODUCT">
              PRODUCT
            </MenuItem>

            <MenuItem value="CUSTOMER">
              CUSTOMER
            </MenuItem>

            <MenuItem value="SALE">
              SALE
            </MenuItem>

            <MenuItem value="IMPORT">
              IMPORT
            </MenuItem>

            <MenuItem value="USER">
              USER
            </MenuItem>
          </TextField>

          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            size="small"
            sx={{
              minWidth: 150,
            }}
          >
            <MenuItem value="">
              All Statuses
            </MenuItem>

            <MenuItem value="SUCCESS">
              SUCCESS
            </MenuItem>

            <MenuItem value="FAILED">
              FAILED
            </MenuItem>

            <MenuItem value="WARNING">
              WARNING
            </MenuItem>
          </TextField>

          <TextField
            label="User ID"
            type="number"
            value={userId}
            onChange={(event) => {
              setUserId(event.target.value);
              setPage(1);
            }}
            size="small"
            sx={{
              minWidth: 120,
            }}
          />

          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(1);
            }}
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(1);
            }}
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            select
            label="Sort"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            size="small"
            sx={{
              minWidth: 150,
            }}
          >
            <MenuItem value="newest">
              Newest First
            </MenuItem>

            <MenuItem value="oldest">
              Oldest First
            </MenuItem>
          </TextField>
        </Stack>

        {/* ACTION BUTTONS */}

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
          sx={{ mt: 2 }}
          flexWrap="wrap"
          useFlexGap
        >
          <Button
            variant="contained"
            onClick={handleSearch}
          >
            Search
          </Button>

          <Button
            variant="outlined"
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              handleExport("csv")
            }
          >
            Export CSV
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              handleExport("pdf")
            }
          >
            Export PDF
          </Button>
        </Stack>
      </Paper>

      {/* ERROR */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* LOADING */}

      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 5,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* TABLE */}

      {!loading && !error && (
        <>
          <TableContainer
            component={Paper}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>User</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Action</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Resource</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Resource ID</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Description</strong>
                  </TableCell>

                  <TableCell>
                    <strong>IP Address</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Timestamp</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Details</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      align="center"
                      sx={{
                        py: 5,
                      }}
                    >
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow
                      key={log.id}
                      hover
                    >
                      <TableCell>
                        {log.user_name ||
                          (log.user_id !== null
                            ? `User ${log.user_id}`
                            : "-")}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={log.action}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        {log.resource_type}
                      </TableCell>

                      <TableCell>
                        {log.resource_id ?? "-"}
                      </TableCell>

                      <TableCell>
                        {log.description ?? "-"}
                      </TableCell>

                      <TableCell>
                        {log.ip_address ?? "-"}
                      </TableCell>

                      <TableCell>
                        {new Date(
                          log.created_at
                        ).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={log.status}
                          color={getStatusColor(
                            log.status
                          )}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() =>
                            setSelectedLog(log)
                          }
                          title="View audit details"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* PAGINATION */}

          <Paper
            sx={{
              p: 2,
              mt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="body2">
              Total Records:{" "}
              <strong>{total}</strong>
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <TextField
                select
                label="Rows"
                value={limit}
                onChange={(event) => {
                  setLimit(
                    Number(event.target.value)
                  );
                  setPage(1);
                }}
                size="small"
                sx={{
                  width: 100,
                }}
              >
                <MenuItem value={10}>
                  10
                </MenuItem>

                <MenuItem value={20}>
                  20
                </MenuItem>

                <MenuItem value={50}>
                  50
                </MenuItem>

                <MenuItem value={100}>
                  100
                </MenuItem>
              </TextField>

              <Button
                variant="outlined"
                onClick={
                  handlePreviousPage
                }
                disabled={page <= 1}
              >
                Previous
              </Button>

              <Typography
                variant="body2"
                sx={{
                  minWidth: 90,
                  textAlign: "center",
                }}
              >
                Page {page} of {totalPages}
              </Typography>

              <Button
                variant="outlined"
                onClick={
                  handleNextPage
                }
                disabled={
                  page >= totalPages ||
                  totalPages === 0
                }
              >
                Next
              </Button>
            </Stack>
          </Paper>
        </>
      )}

      {/* AUDIT DETAIL DIALOG */}

      <Dialog
        open={Boolean(selectedLog)}
        onClose={() =>
          setSelectedLog(null)
        }
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Audit Log Details
        </DialogTitle>

        <DialogContent dividers>
          {selectedLog && (
            <Box>
              <Stack spacing={2}>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    Audit ID
                  </Typography>

                  <Typography>
                    {selectedLog.id}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    User
                  </Typography>

                  <Typography>
                    {selectedLog.user_name ||
                      (selectedLog.user_id !== null
                        ? `User ${selectedLog.user_id}`
                        : "-")}
                  </Typography>

                  {selectedLog.user_email && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {selectedLog.user_email}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    User ID
                  </Typography>

                  <Typography>
                    {selectedLog.user_id ?? "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    Action
                  </Typography>

                  <Typography>
                    {selectedLog.action}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    Resource
                  </Typography>

                  <Typography>
                    {selectedLog.resource_type}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    Resource ID
                  </Typography>

                  <Typography>
                    {selectedLog.resource_id ?? "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    Description
                  </Typography>

                  <Typography>
                    {selectedLog.description ?? "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    Status
                  </Typography>

                  <Chip
                    label={selectedLog.status}
                    color={getStatusColor(
                      selectedLog.status
                    )}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    IP Address
                  </Typography>

                  <Typography>
                    {selectedLog.ip_address ?? "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    Browser / User Agent
                  </Typography>

                  <Typography
                    sx={{
                      wordBreak: "break-word",
                    }}
                  >
                    {selectedLog.user_agent ?? "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    Timestamp
                  </Typography>

                  <Typography>
                    {new Date(
                      selectedLog.created_at
                    ).toLocaleString()}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Before Values
                  </Typography>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      backgroundColor:
                        "background.default",
                      overflow: "auto",
                    }}
                  >
                    <Box
                      component="pre"
                      sx={{
                        margin: 0,
                        whiteSpace:
                          "pre-wrap",
                        wordBreak:
                          "break-word",
                        fontSize: 13,
                      }}
                    >
                      {formatJson(
                        selectedLog.before_values
                      )}
                    </Box>
                  </Paper>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    After Values
                  </Typography>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      backgroundColor:
                        "background.default",
                      overflow: "auto",
                    }}
                  >
                    <Box
                      component="pre"
                      sx={{
                        margin: 0,
                        whiteSpace:
                          "pre-wrap",
                        wordBreak:
                          "break-word",
                        fontSize: 13,
                      }}
                    >
                      {formatJson(
                        selectedLog.after_values
                      )}
                    </Box>
                  </Paper>
                </Box>

              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setSelectedLog(null)
            }
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}