import api from "./api";

export async function getDynamicPrice(
  flightId,
  travelClass,
  isExtraLegroom = false,
  seatType = "standard"
) {
  const params = new URLSearchParams({
    travelClass,
    isExtraLegroom: String(isExtraLegroom),
    seatType,
  });

  const response = await api.get(
    `/pricing/dynamic/${flightId}?${params.toString()}`
  );
  return response.data;
}

export async function getPricingConfig() {
  const response = await api.get("/pricing/config");
  return response.data;
}

export async function calculatePrice(
  baseFare,
  travelClass,
  isExtraLegroom = false,
  includeTaxes = true
) {
  const response = await api.post("/pricing/calculate", {
    baseFare,
    travelClass,
    isExtraLegroom,
    includeTaxes,
  });
  return response.data;
}

export async function getPriceBreakdown(
  baseFare,
  travelClass,
  isExtraLegroom = false
) {
  const response = await api.post("/pricing/breakdown", {
    baseFare,
    travelClass,
    isExtraLegroom,
  });
  return response.data;
}
