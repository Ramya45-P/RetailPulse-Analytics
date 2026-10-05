import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  Menu,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import NotificationsIcon from "@mui/icons-material/Notifications";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notificationApi";

import type { NotificationItem } from "../api/notificationApi";

export default function NotificationCenter() {
  const [anchorEl, setAnchorEl] =
    useState<null | HTMLElement>(null);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // NOTIFICATION DETAILS
  // ============================================================

  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);

  // ============================================================
  // FILTER STATES
  // ============================================================

  const [readFilter, setReadFilter] =
    useState("all");

  const [typeFilter, setTypeFilter] =
    useState("all");

  const [priorityFilter, setPriorityFilter] =
    useState("all");

  const open = Boolean(anchorEl);

  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications(1, 20);

      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );

      setError(
        "Unable to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD + REFRESH
  // ============================================================

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // OPEN NOTIFICATION MENU
  // ============================================================

  const handleOpen = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setAnchorEl(event.currentTarget);
    loadNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // ============================================================
  // GET UNIQUE TYPES
  // ============================================================

  const notificationTypes = useMemo(() => {
    return Array.from(
      new Set(
        notifications.map(
          (notification) => notification.type
        )
      )
    );
  }, [notifications]);

  // ============================================================
  // FILTER NOTIFICATIONS
  // ============================================================

  const filteredNotifications = useMemo(() => {
    return notifications.filter(
      (notification) => {
        // ----------------------------
        // READ / UNREAD FILTER
        // ----------------------------

        if (
          readFilter === "unread" &&
          notification.is_read
        ) {
          return false;
        }

        if (
          readFilter === "read" &&
          !notification.is_read
        ) {
          return false;
        }

        // ----------------------------
        // TYPE FILTER
        // ----------------------------

        if (
          typeFilter !== "all" &&
          notification.type !== typeFilter
        ) {
          return false;
        }

        // ----------------------------
        // PRIORITY FILTER
        // ----------------------------

        if (
          priorityFilter !== "all" &&
          notification.priority.toLowerCase() !==
            priorityFilter.toLowerCase()
        ) {
          return false;
        }

        return true;
      }
    );
  }, [
    notifications,
    readFilter,
    typeFilter,
    priorityFilter,
  ]);

  // ============================================================
  // MARK ONE AS READ + OPEN DETAILS
  // ============================================================

  const handleNotificationClick = async (
    notification: NotificationItem
  ) => {
    try {
      // Open details immediately
      setSelectedNotification(notification);

      // Mark unread notification as read
      if (!notification.is_read) {
        await markNotificationAsRead(
          notification.id
        );

        // Update local state immediately so the
        // UI does not require a full page refresh.
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  is_read: true,
                  read_at: new Date().toISOString(),
                }
              : item
          )
        );

        setUnreadCount((current) =>
          Math.max(current - 1, 0)
        );
      }
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );

      setError(
        "Unable to update notification status."
      );
    }
  };

  // ============================================================
  // CLOSE DETAILS
  // ============================================================

  const handleCloseDetails = () => {
    setSelectedNotification(null);
  };

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();

      // Update UI immediately
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at:
            notification.read_at ??
            new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );

      setError(
        "Unable to mark all notifications as read."
      );
    }
  };

  // ============================================================
  // PRIORITY COLOR
  // ============================================================

  const getPriorityColor = (
    priority: string
  ) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "error";

      case "high":
        return "warning";

      case "medium":
        return "info";

      default:
        return "default";
    }
  };

  return (
    <>
      {/* ======================================================
          NOTIFICATION BUTTON
      ====================================================== */}

      <IconButton
        color="inherit"
        onClick={handleOpen}
        aria-label="notifications"
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* ======================================================
          NOTIFICATION MENU
      ====================================================== */}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            width: 450,
            maxHeight: 650,
            mt: 1,
          },
        }}
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
          >
            Notifications
          </Typography>

          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider />

        {/* ====================================================
            FILTERS
        ==================================================== */}

        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {/* READ FILTER */}

          <FormControl
            size="small"
            fullWidth
          >
            <InputLabel>
              Status
            </InputLabel>

            <Select
              value={readFilter}
              label="Status"
              onChange={(event) =>
                setReadFilter(event.target.value)
              }
            >
              <MenuItem value="all">
                All
              </MenuItem>

              <MenuItem value="unread">
                Unread
              </MenuItem>

              <MenuItem value="read">
                Read
              </MenuItem>
            </Select>
          </FormControl>

          {/* TYPE FILTER */}

          <FormControl
            size="small"
            fullWidth
          >
            <InputLabel>
              Type
            </InputLabel>

            <Select
              value={typeFilter}
              label="Type"
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
            >
              <MenuItem value="all">
                All Types
              </MenuItem>

              {notificationTypes.map(
                (type) => (
                  <MenuItem
                    key={type}
                    value={type}
                  >
                    {type}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          {/* PRIORITY FILTER */}

          <FormControl
            size="small"
            fullWidth
          >
            <InputLabel>
              Priority
            </InputLabel>

            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value
                )
              }
            >
              <MenuItem value="all">
                All Priorities
              </MenuItem>

              <MenuItem value="critical">
                Critical
              </MenuItem>

              <MenuItem value="high">
                High
              </MenuItem>

              <MenuItem value="medium">
                Medium
              </MenuItem>

              <MenuItem value="low">
                Low
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* ====================================================
            ERROR STATE
        ==================================================== */}

        {error && (
          <Box
            sx={{
              px: 2,
              py: 2,
              textAlign: "center",
            }}
          >
            <Typography
              color="error"
              variant="body2"
            >
              {error}
            </Typography>

            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={loadNotifications}
            >
              Retry
            </Button>
          </Box>
        )}

        {/* ====================================================
            LOADING STATE
        ==================================================== */}

        {loading && notifications.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
            }}
          >
            <Typography
              color="text.secondary"
            >
              Loading notifications...
            </Typography>
          </Box>
        ) : filteredNotifications.length ===
          0 ? (
          /* ==================================================
             EMPTY STATE
          ================================================== */

          <Box
            sx={{
              p: 4,
              textAlign: "center",
            }}
          >
            <NotificationsIcon
              sx={{
                fontSize: 40,
                color: "text.secondary",
                mb: 1,
              }}
            />

            <Typography
              color="text.secondary"
            >
              {notifications.length === 0
                ? "You're all caught up. No new notifications."
                : "No notifications match the selected filters."}
            </Typography>
          </Box>
        ) : (
          /* ==================================================
             NOTIFICATION LIST
          ================================================== */

          <List
            disablePadding
            sx={{
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {filteredNotifications.map(
              (notification) => (
                <Box key={notification.id}>
                  <ListItemButton
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                    sx={{
                      px: 2,
                      py: 1.5,
                      backgroundColor:
                        notification.is_read
                          ? "transparent"
                          : "#f5f9ff",
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                      }}
                    >
                      {/* TITLE */}

                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={1}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={
                            notification.is_read
                              ? 500
                              : 700
                          }
                        >
                          {notification.title}
                        </Typography>

                        <Chip
                          label={
                            notification.priority
                          }
                          size="small"
                          color={
                            getPriorityColor(
                              notification.priority
                            ) as
                              | "error"
                              | "warning"
                              | "info"
                              | "default"
                          }
                        />
                      </Box>

                      {/* MESSAGE */}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                        }}
                      >
                        {notification.message}
                      </Typography>

                      {/* TYPE + TIME */}

                      <Box
                        display="flex"
                        justifyContent="space-between"
                        mt={1}
                        gap={1}
                      >
                        <Typography
                          variant="caption"
                          color="primary"
                        >
                          {notification.type}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {new Date(
                            notification.created_at
                          ).toLocaleString()}
                        </Typography>
                      </Box>

                      {/* RESOURCE */}

                      {notification.resource_type && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Resource:{" "}
                          {
                            notification.resource_type
                          }
                          {notification.resource_id
                            ? ` #${notification.resource_id}`
                            : ""}
                        </Typography>
                      )}
                    </Box>
                  </ListItemButton>

                  <Divider />
                </Box>
              )
            )}
          </List>
        )}
      </Menu>

      {/* ======================================================
          NOTIFICATION DETAILS DIALOG
      ====================================================== */}

      <Dialog
        open={Boolean(selectedNotification)}
        onClose={handleCloseDetails}
        fullWidth
        maxWidth="sm"
      >
        {selectedNotification && (
          <>
            <DialogTitle>
              <Box
                display="flex"
                alignItems="center"
                gap={1}
              >
                <Inventory2Icon color="primary" />

                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Notification Details
                </Typography>
              </Box>
            </DialogTitle>

            <DialogContent dividers>
              {/* TITLE */}

              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
              >
                {selectedNotification.title}
              </Typography>

              {/* PRIORITY + TYPE */}

              <Box
                display="flex"
                gap={1}
                flexWrap="wrap"
                mb={2}
              >
                <Chip
                  label={selectedNotification.type}
                  color="primary"
                  variant="outlined"
                />

                <Chip
                  label={
                    selectedNotification.priority
                  }
                  color={
                    getPriorityColor(
                      selectedNotification.priority
                    ) as
                      | "error"
                      | "warning"
                      | "info"
                      | "default"
                  }
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* MESSAGE */}

              <Typography
                variant="subtitle2"
                fontWeight={700}
                gutterBottom
              >
                Description
              </Typography>

              <Typography
                variant="body2"
                sx={{ mb: 2 }}
              >
                {selectedNotification.message}
              </Typography>

              {/* RESOURCE */}

              {selectedNotification.resource_type && (
                <>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    gutterBottom
                  >
                    Related Resource
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mb: 2 }}
                  >
                    {selectedNotification.resource_type}

                    {selectedNotification.resource_id
                      ? ` #${selectedNotification.resource_id}`
                      : ""}
                  </Typography>
                </>
              )}

              {/* INVENTORY INFORMATION */}

              {selectedNotification.resource_type ===
                "Product" && (
                <>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    gutterBottom
                  >
                    Inventory Information
                  </Typography>

                  <Box
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 1,
                      backgroundColor:
                        "action.hover",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5 }}
                    >
                      The notification message contains
                      the current inventory risk,
                      stock level, reorder point, and
                      recommended quantity where
                      applicable.
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {selectedNotification.message}
                    </Typography>
                  </Box>
                </>
              )}

              {/* CREATED TIME */}

              <Typography
                variant="subtitle2"
                fontWeight={700}
                gutterBottom
              >
                Created
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {new Date(
                  selectedNotification.created_at
                ).toLocaleString()}
              </Typography>
            </DialogContent>

            <DialogActions>
              <Button
                onClick={handleCloseDetails}
                variant="contained"
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}