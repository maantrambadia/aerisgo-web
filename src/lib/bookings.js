import api from "./api";

/**
 * Get user's bookings
 */
export async function getMyBookings({ page = 1, limit = 100 } = {}) {
  const response = await api.get("/bookings", {
    params: { page, limit },
  });
  return response.data;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId) {
  const response = await api.delete(`/bookings/${bookingId}`);
  return response.data;
}

/**
 * Get booking by ID
 */
export async function getBookingById(bookingId) {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
}
