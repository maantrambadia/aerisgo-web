import api from "./api";

// Search flights
export const searchFlights = async ({ source, destination, date, passengers }) => {
  try {
    const { data } = await api.get("/flights/search", {
      params: {
        source,
        destination,
        date,
        passengers,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

// Get flight by ID
export const getFlightById = async (id) => {
  try {
    const { data } = await api.get(`/flights/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};
