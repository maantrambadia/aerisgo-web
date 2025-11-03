import api from "./api";

/**
 * Get available meals for a travel class
 */
export async function getAvailableMeals(travelClass) {
  const response = await api.get("/meals/available", {
    params: { travelClass },
  });
  return response.data;
}

/**
 * Get meal preferences for a booking
 */
export async function getMealPreferences(bookingId) {
  const response = await api.get(`/meals/${bookingId}`);
  return response.data;
}

/**
 * Update meal preferences for a booking
 */
export async function updateMealPreference(bookingId, data) {
  const response = await api.put(`/meals/${bookingId}`, data);
  return response.data;
}
