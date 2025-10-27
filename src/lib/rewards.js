import api from "./api";

/**
 * Get reward balance and stats
 */
export async function getRewardBalance() {
  const response = await api.get("/rewards/balance");
  return response.data;
}

/**
 * Get reward transaction history
 */
export async function getRewardHistory({ page = 1, limit = 10 } = {}) {
  const response = await api.get("/rewards/transactions", {
    params: { page, limit },
  });
  return response.data;
}

/**
 * Redeem reward points
 */
export async function redeemPoints(points) {
  const response = await api.post("/rewards/redeem", { points });
  return response.data;
}
