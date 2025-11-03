import api from "./api";

/**
 * Get baggage allowance for a travel class
 */
export async function getBaggageAllowance(travelClass) {
  const response = await api.get("/baggage/allowance", {
    params: { travelClass },
  });
  return response.data;
}

/**
 * Get baggage allowance for a booking
 */
export async function getBaggageByBooking(bookingId) {
  const response = await api.get(`/baggage/booking/${bookingId}`);
  return response.data;
}

/**
 * Get baggage summary
 */
export async function getBaggageSummary(travelClass) {
  const response = await api.get("/baggage/summary", {
    params: { travelClass },
  });
  return response.data;
}

/**
 * Compare baggage allowances
 */
export async function compareBaggageAllowances() {
  const response = await api.get("/baggage/compare");
  return response.data;
}
