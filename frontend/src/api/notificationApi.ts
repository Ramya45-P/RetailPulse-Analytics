import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export interface NotificationItem {
  id: number;
  company_id: number;
  user_id?: number | null;

  type: string;
  title: string;
  message: string;
  priority: string;

  resource_type?: string | null;
  resource_id?: number | null;

  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  expires_at?: string | null;
}

export interface NotificationListResponse {
  total: number;
  page: number;
  limit: number;
  unread_count: number;
  notifications: NotificationItem[];
}

// ============================================================
// GET NOTIFICATIONS
// ============================================================

export const getNotifications = async (
  page = 1,
  limit = 20
): Promise<NotificationListResponse> => {
  const response = await axios.get(
    `${API_BASE_URL}/notifications`,
    {
      params: {
        page,
        limit,
      },
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// ============================================================
// GET UNREAD COUNT
// ============================================================

export const getUnreadCount = async (): Promise<number> => {
  const response = await axios.get(
    `${API_BASE_URL}/notifications/unread-count`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data.unread_count;
};

// ============================================================
// MARK ONE AS READ
// ============================================================

export const markNotificationAsRead = async (
  notificationId: number
): Promise<void> => {
  await axios.patch(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );
};

// ============================================================
// MARK ALL AS READ
// ============================================================

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await axios.patch(
    `${API_BASE_URL}/notifications/read-all`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );
};