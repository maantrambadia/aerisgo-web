import api from "./api";

export async function getMyNotifications({ limit = 50 } = {}) {
  const response = await api.get("/notifications/me", {
    params: { limit },
  });
  return response.data?.items || [];
}

export async function markNotificationRead(id) {
  if (!id) return;

  try {
    await api.post(`/notifications/${id}/read`);
  } catch (error) {
    // Best-effort: do not surface error to user, just log for debugging
    // eslint-disable-next-line no-console
    console.error("Failed to mark notification as read", error);
  }
}
