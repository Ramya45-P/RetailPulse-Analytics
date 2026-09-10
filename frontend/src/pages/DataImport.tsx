import { useEffect, useState } from "react";
import axios from "axios";
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
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface ImportUploadResponse {
  import_id: number;
  import_type: string;
  filename: string;
  total_records: number;
  columns: string[];
  preview: Record<string, any>[];
  status: string;
}

interface ValidationError {
  id?: number;
  import_id?: number;
  row_number: number;
  error_type: string;
  error_message: string;
  row_data?: Record<string, any>;
}

interface ImportValidationResponse {
  import_id: number;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  errors: ValidationError[];
  status: string;
}

interface ImportProcessResponse {
  import_id: number;
  import_type: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  duplicate_records: number;
  validation_failures: number;
  status: string;
}

interface ImportHistory {
  id: number;
  import_type: string;
  filename: string;
  uploaded_by: number;
  total_records: number;
  successful_records: number;
  failed_records: number;
  duplicate_records: number;
  status: string;
  created_at: string;
  completed_at?: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function DataImport() {
  const [importType, setImportType] = useState("Products");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadResult, setUploadResult] =
    useState<ImportUploadResponse | null>(null);

  const [validationResult, setValidationResult] =
    useState<ImportValidationResponse | null>(null);

  const [processResult, setProcessResult] =
    useState<ImportProcessResponse | null>(null);

  const [history, setHistory] = useState<ImportHistory[]>([]);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [stage, setStage] = useState<
    "idle" | "uploading" | "validating" | "processing" | "completed"
  >("idle");

  const [error, setError] = useState("");

  const [selectedHistoryId, setSelectedHistoryId] =
    useState<number | null>(null);

  const [historyErrors, setHistoryErrors] = useState<
    ValidationError[]
  >([]);

  const [errorsLoading, setErrorsLoading] = useState(false);

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      ""
    );
  };

  const getHeaders = () => {
    const token = getToken();

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/import/history`,
        {
          headers: getHeaders(),
        }
      );

      setHistory(response.data);
    } catch (err: any) {
      console.error("Failed to load import history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // -----------------------------------------
  // FILE VALIDATION
  // -----------------------------------------

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;

    setError("");
    setUploadResult(null);
    setValidationResult(null);
    setProcessResult(null);
    setStage("idle");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith(".csv")) {
      setSelectedFile(null);
      setError("Only CSV files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size === 0) {
      setSelectedFile(null);
      setError("The selected CSV file is empty.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError("File size must not exceed 10 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  // -----------------------------------------
  // UPLOAD
  // -----------------------------------------

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a CSV file.");
      return;
    }

    try {
      setLoading(true);
      setStage("uploading");
      setError("");

      setUploadResult(null);
      setValidationResult(null);
      setProcessResult(null);

      const formData = new FormData();

      formData.append("import_type", importType);
      formData.append("file", selectedFile);

      const response = await axios.post(
        `${API_BASE_URL}/import/upload`,
        formData,
        {
          headers: {
            ...getHeaders(),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadResult(response.data);
      setStage("idle");

      await loadHistory();
    } catch (err: any) {
      console.error("Upload failed:", err);

      setStage("idle");

      setError(
        err.response?.data?.detail ||
          "Failed to upload the file. Please check the file and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // VALIDATE
  // -----------------------------------------

  const handleValidate = async () => {
  console.log("=== VALIDATE BUTTON CLICKED ===");

  if (!uploadResult) {
    console.log("No uploadResult found.");
    setError("Please upload a CSV file first.");
    return;
  }

  console.log("Import ID:", uploadResult.import_id);
  console.log(
    "Validation URL:",
    `${API_BASE_URL}/import/validate/${uploadResult.import_id}`
  );

  try {
    setLoading(true);
    setStage("validating");
    setError("");

    console.log("Sending validation request...");

    const response = await axios.post(
      `${API_BASE_URL}/import/validate/${uploadResult.import_id}`,
      {},
      {
        headers: getHeaders(),
      }
    );

    console.log("Validation response:", response.data);

    setValidationResult(response.data);
    setStage("idle");

    await loadHistory();
  } catch (err: any) {
    console.error("Validation failed:", err);
    console.error("Response:", err.response?.data);
    console.error("Status:", err.response?.status);

    setStage("idle");

    setError(
      err.response?.data?.detail ||
        "Failed to validate the import."
    );
  } finally {
    setLoading(false);
  }
};
  // -----------------------------------------
  // PROCESS
  // -----------------------------------------

  const handleProcess = async () => {
    if (!uploadResult) {
      return;
    }

    if (!validationResult) {
      setError("Please validate the import before processing.");
      return;
    }

    // Only block if there are ZERO valid records.
    // Invalid records are skipped by the backend.
    if (validationResult.valid_records === 0) {
      setError(
        "There are no valid records available to import."
      );
      return;
    }

    try {
      setLoading(true);
      setStage("processing");
      setError("");

      const response = await axios.post(
        `${API_BASE_URL}/import/process/${uploadResult.import_id}`,
        {},
        {
          headers: getHeaders(),
        }
      );

      setProcessResult(response.data);
      setStage("completed");

      await loadHistory();
    } catch (err: any) {
      console.error("Processing failed:", err);

      setStage("idle");

      setError(
        err.response?.data?.detail ||
          "Failed to process the import."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // VIEW ERRORS
  // -----------------------------------------

  const handleViewErrors = async (importId: number) => {
    try {
      setErrorsLoading(true);
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/import/${importId}/errors`,
        {
          headers: getHeaders(),
        }
      );

      setHistoryErrors(response.data);
      setSelectedHistoryId(importId);
    } catch (err: any) {
      console.error("Failed to load import errors:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load import errors."
      );
    } finally {
      setErrorsLoading(false);
    }
  };

  // -----------------------------------------
  // DOWNLOAD FAILED RECORDS
  // -----------------------------------------

  const handleDownloadErrors = () => {
    if (historyErrors.length === 0) {
      setError("There are no failed records to download.");
      return;
    }

    const headers = [
      "Row Number",
      "Error Type",
      "Error Message",
      "Row Data",
    ];

    const rows = historyErrors.map((item) => [
      item.row_number,
      item.error_type,
      item.error_message,
      JSON.stringify(item.row_data || {}),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `import_${
      selectedHistoryId || "errors"
    }_failed_records.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // -----------------------------------------
  // RESET
  // -----------------------------------------

  const resetImport = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setValidationResult(null);
    setProcessResult(null);
    setError("");
    setStage("idle");
    setHistoryErrors([]);
    setSelectedHistoryId(null);

    const fileInput = document.getElementById(
      "csv-file-input"
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // -----------------------------------------
  // STAGE MESSAGE
  // -----------------------------------------

  const getStageMessage = () => {
    switch (stage) {
      case "uploading":
        return "Uploading CSV file...";

      case "validating":
        return "Validating CSV records...";

      case "processing":
        return "Processing valid records...";

      case "completed":
        return "Import completed.";

      default:
        return "";
    }
  };

  // -----------------------------------------
  // STATUS COLOR
  // -----------------------------------------

  const getStatusColor = (
    status: string
  ): "success" | "error" | "warning" | "default" => {
    switch (status) {
      case "Completed":
        return "success";

      case "Completed with Errors":
        return "warning";

      case "Failed":
        return "error";

      case "Processing":
        return "warning";

      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* PAGE HEADER */}

      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
      >
        Data Import & Integration
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Import Products, Customers, and Sales Transactions
        using CSV files.
      </Typography>

      {/* ERROR */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* PROCESS STATUS */}

      {stage !== "idle" && (
        <Alert
          severity={
            stage === "completed"
              ? "success"
              : "info"
          }
          sx={{ mb: 3 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {stage !== "completed" && (
              <CircularProgress size={18} />
            )}

            <Typography>
              {getStageMessage()}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* -----------------------------------------
          UPLOAD SECTION
      ----------------------------------------- */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            gutterBottom
          >
            Upload CSV
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* IMPORT TYPE */}

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Import Type</InputLabel>

              <Select
                value={importType}
                label="Import Type"
                disabled={loading}
                onChange={(e) => {
                  setImportType(e.target.value);
                  resetImport();
                }}
              >
                <MenuItem value="Products">
                  Products
                </MenuItem>

                <MenuItem value="Customers">
                  Customers
                </MenuItem>

                <MenuItem value="Sales">
                  Sales
                </MenuItem>
              </Select>
            </FormControl>

            {/* FILE */}

            <Button
              variant="outlined"
              component="label"
              disabled={loading}
            >
              Choose CSV File

              <input
                id="csv-file-input"
                type="file"
                hidden
                accept=".csv"
                onChange={handleFileChange}
              />
            </Button>

            {/* FILE NAME */}

            {selectedFile && (
              <Typography>
                {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(1)} KB)
              </Typography>
            )}

            {/* UPLOAD BUTTON */}

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || loading}
            >
              {stage === "uploading" ? (
                <>
                  <CircularProgress
                    size={20}
                    sx={{ mr: 1 }}
                  />

                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>

            {/* RESET */}

            <Button
              variant="text"
              onClick={resetImport}
              disabled={loading}
            >
              Reset
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              mt: 2,
            }}
          >
            Accepted format: CSV only. Maximum file size:
            10 MB.
          </Typography>
        </CardContent>
      </Card>

      {/* -----------------------------------------
          PREVIEW
      ----------------------------------------- */}

      {uploadResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              fontWeight="bold"
              gutterBottom
            >
              Import Preview
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {/* IMPORT INFO */}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                mb: 2,
              }}
            >
              <Chip
                label={`Import ID: ${uploadResult.import_id}`}
              />

              <Chip
                label={`Type: ${uploadResult.import_type}`}
              />

              <Chip
                label={`File: ${uploadResult.filename}`}
              />

              <Chip
                label={`Records: ${uploadResult.total_records}`}
              />

              <Chip
                label={`Status: ${uploadResult.status}`}
              />
            </Box>

            {/* DETECTED COLUMNS */}

            {uploadResult.columns.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  Detected Columns
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  {uploadResult.columns.map(
                    (column) => (
                      <Chip
                        key={column}
                        size="small"
                        label={column}
                      />
                    )
                  )}
                </Box>
              </Box>
            )}

            {/* PREVIEW TABLE */}

            {uploadResult.preview.length > 0 && (
              <Box
                sx={{
                  overflowX: "auto",
                  mb: 3,
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {uploadResult.columns.map(
                        (column) => (
                          <TableCell key={column}>
                            <strong>{column}</strong>
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {uploadResult.preview.map(
                      (row, index) => (
                        <TableRow key={index}>
                          {uploadResult.columns.map(
                            (column) => (
                              <TableCell key={column}>
                                {String(
                                  row[column] ?? ""
                                )}
                              </TableCell>
                            )
                          )}
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* VALIDATE */}

            <Button
              variant="contained"
              onClick={handleValidate}
              disabled={loading}
            >
              {stage === "validating" ? (
                <>
                  <CircularProgress
                    size={20}
                    sx={{ mr: 1 }}
                  />

                  Validating...
                </>
              ) : (
                "Validate Import"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* -----------------------------------------
          VALIDATION RESULT
      ----------------------------------------- */}

      {validationResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              fontWeight="bold"
              gutterBottom
            >
              Validation Results
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {/* SUMMARY */}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                mb: 3,
              }}
            >
              <Chip
                label={`Total: ${validationResult.total_records}`}
              />

              <Chip
                color="success"
                label={`Valid: ${validationResult.valid_records}`}
              />

              <Chip
                color={
                  validationResult.invalid_records > 0
                    ? "error"
                    : "success"
                }
                label={`Invalid: ${validationResult.invalid_records}`}
              />

              <Chip
                label={`Duplicates: ${validationResult.duplicate_records}`}
              />

              <Chip
                label={`Status: ${validationResult.status}`}
              />
            </Box>

            {/* INVALID RECORD MESSAGE */}

            {validationResult.invalid_records > 0 && (
              <Alert
                severity="warning"
                sx={{ mb: 3 }}
              >
                <strong>
                  {validationResult.invalid_records}
                </strong>{" "}
                invalid record(s) will be skipped.

                <br />

                <strong>
                  {validationResult.valid_records}
                </strong>{" "}
                valid record(s) can still be imported.
              </Alert>
            )}

            {/* ALL VALID */}

            {validationResult.invalid_records === 0 && (
              <Alert
                severity="success"
                sx={{ mb: 3 }}
              >
                All records passed validation and are
                ready to be imported.
              </Alert>
            )}

            {/* ERRORS TABLE */}

            {validationResult.errors.length > 0 && (
              <>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  Validation Errors
                </Typography>

                <Box
                  sx={{
                    overflowX: "auto",
                    mb: 3,
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Row</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Error Type</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Message</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {validationResult.errors.map(
                        (item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {item.row_number}
                            </TableCell>

                            <TableCell>
                              {item.error_type}
                            </TableCell>

                            <TableCell>
                              {item.error_message}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </>
            )}

            {/* PROCESS */}

            <Button
              variant="contained"
              color="success"
              onClick={handleProcess}
              disabled={
                loading ||
                validationResult.valid_records === 0
              }
            >
              {stage === "processing" ? (
                <>
                  <CircularProgress
                    size={20}
                    sx={{ mr: 1 }}
                  />

                  Processing...
                </>
              ) : (
                "Process Import"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* -----------------------------------------
          PROCESS RESULT
      ----------------------------------------- */}

      {processResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              fontWeight="bold"
              gutterBottom
            >
              Import Result
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Alert
              severity={
                processResult.failed_records > 0 ||
                processResult.validation_failures > 0
                  ? "warning"
                  : "success"
              }
              sx={{ mb: 2 }}
            >
              Import status:{" "}
              <strong>{processResult.status}</strong>

              {processResult.validation_failures > 0 &&
                ` — ${processResult.validation_failures} validation failure(s) were skipped.`}
            </Alert>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={`Total: ${processResult.total_records}`}
              />

              <Chip
                color="success"
                label={`Successful: ${processResult.successful_records}`}
              />

              <Chip
                color={
                  processResult.failed_records > 0
                    ? "error"
                    : "default"
                }
                label={`Failed: ${processResult.failed_records}`}
              />

              <Chip
                label={`Duplicates: ${processResult.duplicate_records}`}
              />

              <Chip
                label={`Validation Failures: ${processResult.validation_failures}`}
              />
            </Box>

            {processResult.validation_failures > 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2 }}
              >
                Valid records were imported successfully.
                Invalid records were excluded to protect
                database integrity.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* -----------------------------------------
          IMPORT HISTORY
      ----------------------------------------- */}

      <Card>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            gutterBottom
          >
            Import History
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {historyLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                p: 3,
              }}
            >
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Typography color="text.secondary">
              No import history available.
            </Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>ID</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Type</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Filename</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Uploaded By</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Total</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Successful</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Failed</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Duplicates</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Created</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>

                      <TableCell>
                        {item.import_type}
                      </TableCell>

                      <TableCell>
                        {item.filename}
                      </TableCell>

                      <TableCell>
                        {item.uploaded_by}
                      </TableCell>

                      <TableCell>
                        {item.total_records}
                      </TableCell>

                      <TableCell>
                        {item.successful_records}
                      </TableCell>

                      <TableCell>
                        {item.failed_records}
                      </TableCell>

                      <TableCell>
                        {item.duplicate_records}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={item.status}
                          color={getStatusColor(
                            item.status
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        {new Date(
                          item.created_at
                        ).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            handleViewErrors(item.id)
                          }
                          disabled={errorsLoading}
                        >
                          View Errors
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* -----------------------------------------
              IMPORT ERRORS
          ----------------------------------------- */}

          {selectedHistoryId !== null && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                  Import Errors — ID {selectedHistoryId}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                  }}
                >
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleDownloadErrors}
                    disabled={
                      historyErrors.length === 0
                    }
                  >
                    Download Failed Records
                  </Button>

                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setSelectedHistoryId(null);
                      setHistoryErrors([]);
                    }}
                  >
                    Close
                  </Button>
                </Box>
              </Box>

              {errorsLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: 3,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : historyErrors.length === 0 ? (
                <Alert severity="success">
                  No validation or import errors found
                  for this import.
                </Alert>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Row</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Error Type</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Error Message</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Row Data</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {historyErrors.map(
                        (item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {item.row_number}
                            </TableCell>

                            <TableCell>
                              {item.error_type}
                            </TableCell>

                            <TableCell>
                              {item.error_message}
                            </TableCell>

                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 400,
                                  whiteSpace: "pre-wrap",
                                  wordBreak:
                                    "break-word",
                                }}
                              >
                                {JSON.stringify(
                                  item.row_data || {}
                                )}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default DataImport;