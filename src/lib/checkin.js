import api from "./api";

/**
 * Check if booking is eligible for check-in
 */
export async function checkEligibility(bookingId) {
  const response = await api.get(`/check-in/${bookingId}/eligibility`);
  return response.data;
}

/**
 * Perform check-in for a booking
 */
export async function performCheckIn(bookingId) {
  const response = await api.post(`/check-in/${bookingId}`);
  return response.data;
}

/**
 * Get boarding pass for checked-in booking
 */
export async function getBoardingPass(bookingId) {
  const response = await api.get(`/check-in/${bookingId}/boarding-pass`);
  return response.data;
}
