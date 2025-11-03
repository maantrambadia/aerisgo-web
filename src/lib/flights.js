import api from "./api";

// Search flights
export const searchFlights = async ({
  source,
  destination,
  date,
  passengers,
  returnDate,
}) => {
  try {
    const params = {
      source,
      destination,
      date,
      passengers,
    };

    // Add returnDate if provided for round-trip
    if (returnDate) {
      params.returnDate = returnDate;
    }

    const { data } = await api.get("/flights/search", {
      params,
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
