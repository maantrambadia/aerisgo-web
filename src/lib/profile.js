import api from "./api";

/**
 * Update user profile
 */
export async function updateProfile(data) {
  const response = await api.put("/profile", data);
  return response.data;
}

/**
 * Change password
 */
export async function changePassword(data) {
  const response = await api.put("/profile/change-password", data);
  return response.data;
}

/**
 * Get user documents
 */
export async function getDocuments() {
  const response = await api.get("/profile/documents");
  return response.data;
}

/**
 * Upsert document
 */
export async function upsertDocument(data) {
  const response = await api.post("/profile/documents", data);
  return response.data;
}

/**
 * Delete document
 */
export async function deleteDocument(documentType) {
  const response = await api.delete(`/profile/documents/${documentType}`);
  return response.data;
}
