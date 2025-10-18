import api from "./api";

// Format airport for display: "City (CODE)"
export const formatAirport = (airport) => {
  if (!airport) return "";
  return `${airport.city} (${airport.code})`;
};

// Parse city name from "City (CODE)" format
export const parseCityName = (str) => {
  if (!str) return "";
  const match = str.match(/^(.+?)\s*\(/);
  return match ? match[1].trim() : str.trim();
};

// Parse airport code from "City (CODE)" format
export const parseAirportCode = (str) => {
  if (!str) return "";
  const match = str.match(/\(([A-Z]{3})\)/);
  return match ? match[1] : "";
};

// Fetch all airports
export const getAllAirports = async () => {
  try {
    const { data } = await api.get("/airports");
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch airports:", error);
    return [];
  }
};

// Fetch popular airports
export const getPopularAirports = async () => {
  try {
    const { data } = await api.get("/airports/popular");
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch popular airports:", error);
    return [];
  }
};
